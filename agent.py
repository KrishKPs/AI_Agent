"""
Layer 2: the LLM agent.

Same objective as Layer 1 (grid_search.py) -- find the incremental-profit-
maximizing discount for each SKU -- but instead of brute-forcing every
discount, an LLM decides which discounts to test by calling simulate_promo()
as a tool, reading the results, and reasoning about what to try next. It is
given only a SKU name: it never sees list_price, unit_cost, elasticity,
cannibalization, or pull_forward directly. It has a limited budget of tool
calls, so it has to search efficiently instead of grid-searching like Layer 1
does.

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    python3 agent.py                      # run every SKU in the catalog
    python3 agent.py --sku "Gatorade 28oz" --compare
"""

import argparse
import json
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()  # reads .env in this directory into the environment, if present

from promo import simulate_promo
from catalog import get_catalog
from grid_search import best_discount_for

MODEL = "claude-opus-5"
MAX_TOOL_CALLS = 8

SIMULATE_PROMO_TOOL = {
    "name": "simulate_promo",
    "description": (
        "Run one promotion for the given SKU and report what happened: units "
        "sold, baseline profit, promo profit, and incremental_profit -- the "
        "number to maximize. Call this as many times as you need with "
        "different discounts to find the discount that maximizes "
        "incremental_profit."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "sku": {
                "type": "string",
                "description": "Exact SKU name from the catalog you were given.",
            },
            "discount": {
                "type": "number",
                "description": "Fraction off list price, e.g. 0.2 for 20% off. Must be >= 0 and < 1.",
            },
            "horizon_weeks": {
                "type": "integer",
                "description": "Weeks to simulate (promo week + payback weeks). Defaults to 4.",
            },
        },
        "required": ["sku", "discount"],
        "additionalProperties": False,
    },
}


def make_tool_executor(catalog_by_name):
    def execute(sku: str, discount: float, horizon_weeks: int = 4) -> dict:
        product = catalog_by_name.get(sku)
        if product is None:
            return {"error": f"Unknown SKU {sku!r}. Valid SKUs: {list(catalog_by_name)}"}
        try:
            return simulate_promo(product, discount=discount, horizon_weeks=horizon_weeks)
        except ValueError as exc:
            return {"error": str(exc)}

    return execute


def stream_agent_for_sku(client: anthropic.Anthropic, sku_name: str, catalog_by_name: dict):
    """Run the agent loop for one SKU, yielding an event dict after each step:

      {"type": "tool_call",   "input": {...}, "result": {...}}   -- one simulate_promo probe
      {"type": "final",       "text": ..., "tool_calls_made": N} -- last event, always sent

    Kept separate from run_agent_for_sku so a caller (CLI or web backend) can
    show progress live instead of waiting for the whole loop to finish.
    """
    execute_tool = make_tool_executor(catalog_by_name)

    system = (
        "You are a trade-promotion analyst. You are given one SKU by name only -- "
        "you do NOT know its price, cost, elasticity, cannibalization, or "
        "pull-forward. Discover how it behaves by calling simulate_promo with "
        f"different discounts (0.0 to 0.6) for SKU '{sku_name}'. Your goal is to "
        "find the discount that maximizes incremental_profit -- note that the "
        "best discount may be 0% (no promo) if every discount you try loses "
        f"money. You have a budget of {MAX_TOOL_CALLS} simulate_promo calls -- "
        "use them efficiently (e.g. a coarse sweep first, then zoom in near the "
        "best point). When you are done, stop calling tools and give your final "
        "answer as a single line in exactly this format:\n"
        "FINAL: discount=<fraction> incremental_profit=<number>\n"
        "followed by one sentence of reasoning."
    )

    messages = [
        {
            "role": "user",
            "content": f"Find the profit-maximizing discount for SKU '{sku_name}'.",
        }
    ]

    tool_calls_made = 0
    final_text = ""

    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=system,
            tools=[SIMULATE_PROMO_TOOL],
            messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})

        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
        if not tool_use_blocks:
            final_text = "".join(b.text for b in response.content if b.type == "text")
            break

        tool_results = []
        for block in tool_use_blocks:
            tool_calls_made += 1
            if tool_calls_made > MAX_TOOL_CALLS:
                result = {"error": "Tool call budget exhausted. Give your FINAL answer now."}
            else:
                result = execute_tool(**block.input)
            yield {"type": "tool_call", "input": block.input, "result": result}
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                }
            )
        messages.append({"role": "user", "content": tool_results})

        if response.stop_reason != "tool_use":
            break

    yield {
        "type": "final",
        "text": final_text.strip(),
        "tool_calls_made": min(tool_calls_made, MAX_TOOL_CALLS),
    }


def run_agent_for_sku(client: anthropic.Anthropic, sku_name: str, catalog_by_name: dict) -> dict:
    """Non-streaming wrapper used by the CLI: drains stream_agent_for_sku and
    returns just the final outcome."""
    final = None
    for event in stream_agent_for_sku(client, sku_name, catalog_by_name):
        if event["type"] == "final":
            final = event
    return {
        "sku": sku_name,
        "tool_calls_made": final["tool_calls_made"],
        "final_text": final["text"],
    }


def main():
    parser = argparse.ArgumentParser(
        description="Layer 2: LLM agent that discovers optimal promo discounts."
    )
    parser.add_argument(
        "--sku", help="Run only this SKU (exact name). Default: every SKU in the catalog."
    )
    parser.add_argument(
        "--compare",
        action="store_true",
        help="Also print the true grid-search optimum for each SKU, for comparison.",
    )
    args = parser.parse_args()

    catalog = get_catalog()
    catalog_by_name = {p.name: p for p in catalog}

    if args.sku:
        if args.sku not in catalog_by_name:
            raise SystemExit(f"Unknown SKU {args.sku!r}. Choices: {list(catalog_by_name)}")
        skus = [args.sku]
    else:
        skus = list(catalog_by_name)

    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        raise SystemExit(
            "No Anthropic credentials found.\n"
            "Set ANTHROPIC_API_KEY (or run `ant auth login`) and try again."
        )
    client = anthropic.Anthropic()

    for sku_name in skus:
        print(f"\n=== {sku_name} ===")
        try:
            outcome = run_agent_for_sku(client, sku_name, catalog_by_name)
        except anthropic.AuthenticationError as exc:
            raise SystemExit(f"Authentication failed: {exc}") from exc
        except anthropic.APIError as exc:
            print(f"Skipping {sku_name!r}: API error: {exc}")
            continue
        print(f"(used {outcome['tool_calls_made']}/{MAX_TOOL_CALLS} simulate_promo calls)")
        print(outcome["final_text"])

        if args.compare:
            truth = best_discount_for(catalog_by_name[sku_name])
            print(
                f"[grid-search truth: discount={truth['discount']:.0%} "
                f"incremental_profit={truth['incremental_profit']:,.2f}]"
            )


if __name__ == "__main__":
    main()

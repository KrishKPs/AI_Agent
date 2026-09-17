"""
Layer 0 of the trade-promotion optimization agent.

Two pieces, nothing else:
  1. Product        -> the HIDDEN truth about a SKU (elasticity, cannibalization,
                       pull-forward). The agent never sees these numbers.
  2. simulate_promo -> runs one promo against that truth and returns what happened,
                       including the only number that matters: incremental_profit.

No ML, no LLM yet. This is pure, deterministic Python. Get this right and every
later layer (grid search, then the agent) just calls simulate_promo() over and over.
"""

from dataclasses import dataclass


# ---------------------------------------------------------------------------
# 1. THE HIDDEN GROUND TRUTH
# ---------------------------------------------------------------------------
@dataclass
class Product:
    """Everything true about a SKU. The agent is NOT allowed to read these fields
    directly -- it can only learn about them by running promos and seeing results."""
    name: str
    list_price: float        # normal shelf price, e.g. $4.00
    unit_cost: float         # what it costs PepsiCo to make + deliver, e.g. $1.60
    base_units: float        # units sold per week with NO promo

    # --- the three effects that make promos tricky ---
    elasticity: float        # how strongly demand reacts to price. More negative =
                             #   more sensitive. CPG promo elasticity is often -2 to -4.
    cannibalization: float   # fraction of promo lift stolen from your OTHER products
                             #   (not new demand). 0.0 = none, 0.4 = 40% is stolen.
    pull_forward: float      # fraction of promo lift that is just future sales pulled
                             #   earlier (shoppers stockpile). Paid back in later weeks.


# ---------------------------------------------------------------------------
# 2. THE SIMULATOR + PROFIT CALCULATOR
# ---------------------------------------------------------------------------
def simulate_promo(product: Product, discount: float, horizon_weeks: int = 4) -> dict:
    """Run ONE promo and report the outcome over a multi-week horizon.

    discount:       fraction off list price during the promo week, e.g. 0.20 = 20% off.
                    PepsiCo funds this discount -- it is the 'trade spend'.
    horizon_weeks:  how many weeks we watch, so pull-forward payback is captured.
                    Week 1 is the promo; the rest are normal weeks (minus payback).

    Returns a dict. The headline field is 'incremental_profit'.
    """
    if not 0 <= discount < 1:
        raise ValueError("discount must be in [0, 1)")

    p = product

    # --- Baseline world: no promo, sell base_units every week at full margin ---
    base_margin = p.list_price - p.unit_cost
    baseline_profit = p.base_units * base_margin * horizon_weeks

    # --- Promo world ---
    # Price drops -> demand rises. price_ratio^elasticity is the classic lift curve.
    price_ratio = 1.0 - discount
    demand_multiplier = price_ratio ** p.elasticity          # >1 because elasticity<0
    gross_promo_units = p.base_units * demand_multiplier

    # Of the EXTRA units, some are stolen from other SKUs and some are borrowed
    # from the future -- neither is genuinely new business.
    lift_units = gross_promo_units - p.base_units
    stolen = lift_units * p.cannibalization
    borrowed = lift_units * p.pull_forward

    # During the promo week PepsiCo earns a thinner margin (it funded the discount).
    promo_margin = (p.list_price * price_ratio) - p.unit_cost
    promo_week_profit = gross_promo_units * promo_margin

    # In the weeks after, we sell base units MINUS the borrowed volume being paid back.
    payback_per_week = borrowed / max(horizon_weeks - 1, 1)
    later_weeks_profit = sum(
        (p.base_units - payback_per_week) * base_margin
        for _ in range(horizon_weeks - 1)
    )

    promo_profit = promo_week_profit + later_weeks_profit
    incremental_profit = promo_profit - baseline_profit

    return {
        "discount": discount,
        "gross_promo_units": round(gross_promo_units, 1),
        "true_new_units": round(lift_units - stolen - borrowed, 1),  # the honest lift
        "baseline_profit": round(baseline_profit, 2),
        "promo_profit": round(promo_profit, 2),
        "incremental_profit": round(incremental_profit, 2),  # <-- the objective
    }


# ---------------------------------------------------------------------------
# 3. DEMO -- runs when you execute this file directly
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # A made-up but realistic snack SKU. In the real project these hidden numbers
    # would be randomized so the agent can't just look them up.
    chips = Product(
        name="Lay's Classic 8oz",
        list_price=4.00,
        unit_cost=1.60,
        base_units=1000,
        elasticity=-3.0,
        cannibalization=0.35,
        pull_forward=0.30,
    )

    print(f"SKU: {chips.name}   (agent cannot see the numbers below)")
    print(f"   elasticity={chips.elasticity}  "
          f"cannibalization={chips.cannibalization}  "
          f"pull_forward={chips.pull_forward}\n")

    print(f"{'discount':>9} | {'gross units':>11} | {'true new':>9} | "
          f"{'incremental profit':>18}")
    print("-" * 56)
    for d in [0.0, 0.10, 0.20, 0.30, 0.40, 0.50]:
        r = simulate_promo(chips, discount=d)
        print(f"{d:>8.0%} | {r['gross_promo_units']:>11.0f} | "
              f"{r['true_new_units']:>9.0f} | {r['incremental_profit']:>18,.0f}")

    print("\nNotice: deeper discounts keep growing UNIT volume, but incremental")
    print("profit peaks and then turns negative. Finding that peak is the whole game.")

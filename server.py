"""
Local web dashboard for the trade-promotion optimization agent.

Serves a single-page frontend (static/index.html) and a small JSON/SSE API
that wraps promo.py, grid_search.py, and agent.py directly -- no logic is
duplicated in JavaScript, and the Anthropic API key never leaves the server.

Run:
    uvicorn server:app --reload
Then open http://127.0.0.1:8000
"""

import json
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from catalog import get_catalog
from company_data import get_full_catalog, add_custom_product
from company_analytics import get_catalog_summary
from promo import simulate_promo
from grid_search import sweep
from agent import stream_agent_for_sku, MAX_TOOL_CALLS, MODEL

app = FastAPI(title="Trade Promotion Optimizer")

CATALOG_BY_NAME = {p.name: p for p in get_catalog()}

COMPANY_CATALOG = get_full_catalog()
COMPANY_BY_NAME = {}
COMPANY_PRODUCT_BY_NAME = {}


def _rebuild_company_indexes():
    global COMPANY_BY_NAME, COMPANY_PRODUCT_BY_NAME
    COMPANY_BY_NAME = {cp.product.name: cp for cp in COMPANY_CATALOG}
    COMPANY_PRODUCT_BY_NAME = {name: cp.product for name, cp in COMPANY_BY_NAME.items()}


_rebuild_company_indexes()


class NewProductRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=60)
    region: str = Field(min_length=1, max_length=60)
    list_price: float = Field(gt=0)
    unit_cost: float = Field(ge=0)
    base_units: float = Field(gt=0)


def _get_product(sku: str):
    product = CATALOG_BY_NAME.get(sku)
    if product is None:
        raise HTTPException(status_code=404, detail=f"Unknown SKU {sku!r}")
    return product


def _get_company_product(sku: str):
    product = COMPANY_PRODUCT_BY_NAME.get(sku)
    if product is None:
        raise HTTPException(status_code=404, detail=f"Unknown SKU {sku!r}")
    return product


@app.get("/api/catalog")
def api_catalog():
    """SKU names only -- the same information the agent is allowed to see."""
    return {"skus": list(CATALOG_BY_NAME), "max_tool_calls": MAX_TOOL_CALLS, "model": MODEL}


@app.get("/api/simulate")
def api_simulate(sku: str, discount: float, horizon_weeks: int = 4):
    product = _get_product(sku)
    try:
        return simulate_promo(product, discount=discount, horizon_weeks=horizon_weeks)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/grid_search")
def api_grid_search(sku: str, step: float = 0.02, max_discount: float = 0.60):
    product = _get_product(sku)
    curve = sweep(product, step=step, max_discount=max_discount)
    best = max(curve, key=lambda r: r["incremental_profit"])
    return {"sku": sku, "curve": curve, "best": best}


@app.get("/api/agent/stream")
def api_agent_stream(sku: str):
    _get_product(sku)  # 404 early if the SKU is bad, before opening the stream

    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        raise HTTPException(
            status_code=412,
            detail="No Anthropic credentials found. Set ANTHROPIC_API_KEY in .env and restart the server.",
        )

    def event_stream():
        client = anthropic.Anthropic()
        try:
            for event in stream_agent_for_sku(client, sku, CATALOG_BY_NAME):
                yield f"data: {json.dumps(event)}\n\n"
        except anthropic.APIError as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/company/products")
def api_company_products():
    """The dashboard's product catalog: realistic SKUs with prices, costs, and
    a 52-week sales history (seasonal + noise, for display/charting only)."""
    return [
        {
            "sku": cp.product.name,
            "name": cp.product.name,
            "category": cp.category,
            "region": cp.region,
            "list_price": cp.product.list_price,
            "unit_cost": cp.product.unit_cost,
            "base_units": cp.product.base_units,
            "weekly_units": cp.weekly_units,
        }
        for cp in COMPANY_CATALOG
    ]


@app.post("/api/company/products", status_code=201)
def api_add_company_product(payload: NewProductRequest):
    """Add a new SKU from plain business inputs (name, category, region,
    price, cost, normal weekly volume). Simulation behavior (elasticity,
    cannibalization, pull-forward) is inferred from category -- the caller
    never has to know those terms. Persisted to disk so it survives restarts."""
    if payload.unit_cost >= payload.list_price:
        raise HTTPException(status_code=400, detail="Unit cost must be less than the shelf price.")

    try:
        cp = add_custom_product(
            name=payload.name.strip(),
            category=payload.category.strip(),
            region=payload.region.strip(),
            list_price=payload.list_price,
            unit_cost=payload.unit_cost,
            base_units=payload.base_units,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    COMPANY_CATALOG.append(cp)
    _rebuild_company_indexes()

    return {
        "sku": cp.product.name,
        "name": cp.product.name,
        "category": cp.category,
        "region": cp.region,
        "list_price": cp.product.list_price,
        "unit_cost": cp.product.unit_cost,
        "base_units": cp.product.base_units,
        "weekly_units": cp.weekly_units,
    }


@app.get("/api/company/analytics/summary")
def api_company_analytics_summary():
    """Portfolio-level view over the company catalog: a data-grid row per SKU,
    portfolio totals, and category/region breakdowns -- all derived from the
    same get_company_catalog() the optimizer uses, via pandas."""
    return get_catalog_summary()


@app.get("/api/company/simulate")
def api_company_simulate(sku: str, discount: float, horizon_weeks: int = 4):
    product = _get_company_product(sku)
    try:
        return simulate_promo(product, discount=discount, horizon_weeks=horizon_weeks)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/company/grid_search")
def api_company_grid_search(sku: str, step: float = 0.02, max_discount: float = 0.60):
    product = _get_company_product(sku)
    curve = sweep(product, step=step, max_discount=max_discount)
    best = max(curve, key=lambda r: r["incremental_profit"])
    return {"sku": sku, "curve": curve, "best": best}


@app.get("/api/company/surface")
def api_company_surface(
    sku: str,
    discount_step: float = 0.04,
    max_discount: float = 0.60,
    max_horizon_weeks: int = 12,
):
    """Profit across discount depth AND promo length -- the grid behind the
    3D chart. Reuses simulate_promo() unmodified, just looped over two axes."""
    product = _get_company_product(sku)
    points = []
    d = 0.0
    while d < max_discount:
        for horizon in range(1, max_horizon_weeks + 1):
            result = simulate_promo(product, discount=round(d, 4), horizon_weeks=horizon)
            points.append(
                {
                    "discount": result["discount"],
                    "horizon_weeks": horizon,
                    "incremental_profit": result["incremental_profit"],
                }
            )
        d += discount_step
    return {"sku": sku, "points": points}


@app.get("/api/company/agent/stream")
def api_company_agent_stream(sku: str):
    _get_company_product(sku)  # 404 early if the SKU is bad, before opening the stream

    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        raise HTTPException(
            status_code=412,
            detail="No Anthropic credentials found. Set ANTHROPIC_API_KEY in .env and restart the server.",
        )

    def event_stream():
        client = anthropic.Anthropic()
        try:
            for event in stream_agent_for_sku(client, sku, COMPANY_PRODUCT_BY_NAME):
                yield f"data: {json.dumps(event)}\n\n"
        except anthropic.APIError as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


app.mount("/", StaticFiles(directory="static", html=True), name="static")

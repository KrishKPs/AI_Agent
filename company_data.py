"""
A synthetic "company" catalog for the dashboard's display layer: realistic
SKUs, categories, regions, prices, and 52 weeks of seasonal sales history.

Every SKU wraps a real promo.Product, so nothing here is fake math -- these
are just realistic-looking inputs and a believable history. The actual promo
simulation still runs through the untouched simulate_promo()/sweep()/agent
functions in promo.py, grid_search.py, and agent.py.
"""

import hashlib
import json
import math
import random
from dataclasses import dataclass
from pathlib import Path

from promo import Product

_SEED = 7

_DATA_DIR = Path(__file__).parent / "data"
_CUSTOM_PRODUCTS_FILE = _DATA_DIR / "custom_products.json"

# A new SKU only gives us the business inputs a merchandiser actually knows
# (price, cost, normal volume) -- never elasticity/cannibalization/pull-forward.
# Those get inferred from category, using the same spread already present
# across the seeded catalog above.
CATEGORY_PRESETS = {
    "Chips": {"elasticity": -3.0, "cannibalization": 0.31, "pull_forward": 0.27, "amplitude": 0.15, "phase": 0.47},
    "Soda": {"elasticity": -1.8, "cannibalization": 0.11, "pull_forward": 0.41, "amplitude": 0.30, "phase": 0.00},
    "Snacks": {"elasticity": -1.45, "cannibalization": 0.09, "pull_forward": 0.165, "amplitude": 0.30, "phase": 0.75},
    "Beverages": {"elasticity": -2.10, "cannibalization": 0.15, "pull_forward": 0.38, "amplitude": 0.20, "phase": 0.25},
}
DEFAULT_PRESET = {"elasticity": -2.0, "cannibalization": 0.20, "pull_forward": 0.25, "amplitude": 0.20, "phase": 0.30}

# name, category, region, list_price, unit_cost, base_units,
# elasticity, cannibalization, pull_forward, seasonal amplitude, seasonal phase
_CATALOG_SPEC = [
    ("Ridgeline Salted Chips 8oz", "Chips", "Northeast", 3.99, 1.55, 1200, -3.2, 0.35, 0.30, 0.15, 0.50),
    ("Ridgeline BBQ Chips 8oz", "Chips", "Midwest", 3.99, 1.60, 950, -3.0, 0.30, 0.28, 0.12, 0.50),
    ("Blaze Nacho Tortilla 9oz", "Chips", "South", 4.29, 1.85, 880, -2.6, 0.28, 0.22, 0.10, 0.40),
    ("Surge Citrus Soda 12pk", "Soda", "West", 6.49, 3.10, 1600, -1.9, 0.12, 0.42, 0.30, 0.00),
    ("Surge Cola 12pk", "Soda", "Northeast", 6.49, 3.05, 2100, -1.7, 0.10, 0.40, 0.25, 0.00),
    ("Northfield Granola Bars 8ct", "Snacks", "Midwest", 4.79, 2.40, 600, -1.4, 0.08, 0.15, 0.30, 0.75),
    ("Northfield Trail Mix 10oz", "Snacks", "South", 5.29, 2.65, 450, -1.5, 0.10, 0.18, 0.30, 0.75),
    ("Cascade Sparkling Water 8pk", "Beverages", "West", 5.99, 2.20, 1350, -2.1, 0.15, 0.38, 0.20, 0.25),
]


@dataclass
class CompanyProduct:
    product: Product  # sim-ready core: name, list_price, unit_cost, base_units, elasticity, cannibalization, pull_forward
    category: str
    region: str
    weekly_units: list  # 52 weeks, seasonal + noise -- display only, not fed into the simulator


def _seasonal_multiplier(week: int, phase: float, amplitude: float) -> float:
    return 1.0 + amplitude * math.sin(2 * math.pi * (week / 52 + phase))


def _history(base_units: float, amplitude: float, phase: float, rng: random.Random) -> list:
    weeks = []
    for week in range(1, 53):
        mult = _seasonal_multiplier(week, phase, amplitude)
        noise = rng.gauss(1.0, 0.06)
        weeks.append(max(0.0, round(base_units * mult * noise)))
    return weeks


def get_company_catalog() -> list:
    rng = random.Random(_SEED)
    catalog = []
    for name, category, region, price, cost, base_units, elasticity, cannib, pull, amp, phase in _CATALOG_SPEC:
        product = Product(
            name=name,
            list_price=price,
            unit_cost=cost,
            base_units=base_units,
            elasticity=elasticity,
            cannibalization=cannib,
            pull_forward=pull,
        )
        weekly_units = _history(base_units, amp, phase, rng)
        catalog.append(CompanyProduct(product=product, category=category, region=region, weekly_units=weekly_units))
    return catalog


def _stable_seed(name: str) -> int:
    """A seed that's the same across restarts (unlike Python's built-in
    hash(), which is randomized per-process) so an added SKU's sales history
    doesn't reshuffle every time the server restarts."""
    return int(hashlib.sha256(name.encode()).hexdigest(), 16) % (2**32)


def _build_company_product(name, category, region, list_price, unit_cost, base_units) -> "CompanyProduct":
    preset = CATEGORY_PRESETS.get(category, DEFAULT_PRESET)
    product = Product(
        name=name,
        list_price=list_price,
        unit_cost=unit_cost,
        base_units=base_units,
        elasticity=preset["elasticity"],
        cannibalization=preset["cannibalization"],
        pull_forward=preset["pull_forward"],
    )
    rng = random.Random(_stable_seed(name))
    weekly_units = _history(base_units, preset["amplitude"], preset["phase"], rng)
    return CompanyProduct(product=product, category=category, region=region, weekly_units=weekly_units)


def _read_custom_specs() -> list:
    if not _CUSTOM_PRODUCTS_FILE.exists():
        return []
    with open(_CUSTOM_PRODUCTS_FILE) as f:
        return json.load(f)


def _write_custom_specs(specs: list) -> None:
    _DATA_DIR.mkdir(exist_ok=True)
    with open(_CUSTOM_PRODUCTS_FILE, "w") as f:
        json.dump(specs, f, indent=2)


def load_custom_products() -> list:
    """SKUs added at runtime through the UI, persisted to disk."""
    return [_build_company_product(**spec) for spec in _read_custom_specs()]


def add_custom_product(name: str, category: str, region: str, list_price: float, unit_cost: float, base_units: float):
    """Add a new SKU from plain business inputs and persist it. Raises
    ValueError if the name collides with an existing SKU."""
    existing_names = {cp.product.name for cp in get_company_catalog()} | {s["name"] for s in _read_custom_specs()}
    if name in existing_names:
        raise ValueError(f"A product named {name!r} already exists.")

    spec = {
        "name": name,
        "category": category,
        "region": region,
        "list_price": list_price,
        "unit_cost": unit_cost,
        "base_units": base_units,
    }
    specs = _read_custom_specs()
    specs.append(spec)
    _write_custom_specs(specs)
    return _build_company_product(**spec)


def get_full_catalog() -> list:
    """The seeded catalog plus anything added at runtime through the UI."""
    return get_company_catalog() + load_custom_products()

"""
Layer 0: the "ground truth" world the agent is trying to figure out.

This file defines:
  - Product: a dataclass holding the HIDDEN economic truth about one SKU.
             An agent (grid search in Layer 1, LLM in Layer 2) is only allowed
             to call simulate_promo() and read its output -- never reach into
             a Product's fields directly. That's what makes this a decision
             problem instead of a lookup problem.
  - simulate_promo(): runs one promotion against that truth and reports
             INCREMENTAL PROFIT, the number the whole project is optimizing.

Nothing here is "the real world" -- it's a deliberately simplified model.
Every simplifying assumption is called out in a comment where it's made,
so later you can swap in something more realistic without hunting for it.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Product:
    """
    The hidden truth for one SKU. `frozen=True` makes instances immutable --
    once created, a Product's numbers can't be accidentally changed, which
    matters because this is meant to represent a fixed (if unknown) reality.

    Fields:
        sku:             identifier, e.g. "COLA-12PK"
        list_price:      full shelf price per unit, in dollars
        unit_cost:        what it costs the company to make/ship one unit
        base_units:      units sold per WEEK at full price, no promo running
        elasticity:      price elasticity of demand (negative number).
                         Governs how much weekly volume rises when price
                         drops. -2.0 means "a 1% price cut grows demand ~2%".
                         More negative = more price-sensitive shoppers.
        cannibalization: fraction (0-1) of the promo's apparent extra volume
                         that isn't real -- shoppers who'd have bought this
                         exact SKU at full price anyway, this same week.
        pull_forward:    fraction (0-1) of the promo's apparent extra volume
                         that is stockpiling: real purchases now, but future
                         weeks lose an equal number of full-price sales.
    """

    sku: str
    list_price: float
    unit_cost: float
    base_units: float
    elasticity: float
    cannibalization: float
    pull_forward: float

    def __post_init__(self) -> None:
        if self.list_price <= 0 or self.unit_cost <= 0:
            raise ValueError("list_price and unit_cost must be positive")
        if self.unit_cost >= self.list_price:
            raise ValueError("unit_cost must be less than list_price")
        if self.base_units <= 0:
            raise ValueError("base_units must be positive")
        if self.elasticity >= 0:
            raise ValueError("elasticity must be negative (price down -> demand up)")
        if not (0 <= self.cannibalization <= 1):
            raise ValueError("cannibalization must be between 0 and 1")
        if not (0 <= self.pull_forward <= 1):
            raise ValueError("pull_forward must be between 0 and 1")
        if self.cannibalization + self.pull_forward > 1:
            raise ValueError("cannibalization + pull_forward can't exceed 1")


def simulate_promo(product: Product, discount: float, horizon_weeks: int = 4) -> dict:
    """
    Run one promotion of `discount` (0.20 = 20% off) for `horizon_weeks` weeks
    against `product`'s hidden truth, and report what happened financially.

    Returns a dict of every intermediate quantity (not just the final answer)
    so later layers -- and you, right now -- can see exactly where the money
    went, not just the bottom line.
    """
    if not (0 <= discount < 1):
        raise ValueError("discount must be in [0, 1)")
    if horizon_weeks <= 0:
        raise ValueError("horizon_weeks must be positive")

    promo_price = product.list_price * (1 - discount)

    # --- Demand response: constant-elasticity curve ---
    # Standard economics form: Q = Q0 * (P / P0) ** elasticity.
    # Here P/P0 is just (1 - discount). Elasticity is negative, so cutting
    # price (making (1-discount) < 1) raises predicted weekly units.
    # SIMPLIFYING ASSUMPTION: one fixed elasticity is used across the whole
    # 0-50% discount range. Real demand curves often bend (e.g. shoppers
    # barely react below some threshold, then react sharply past it).
    weekly_promo_units = product.base_units * (1 - discount) ** product.elasticity

    weekly_lift = weekly_promo_units - product.base_units

    # SIMPLIFYING ASSUMPTION: this weekly lift is treated as constant for
    # every week of the promo (no ramp-up in week 1, no fatigue by week 4).
    gross_lift_total = weekly_lift * horizon_weeks

    # --- Split the gross lift into three buckets ---
    # cannibalized_units: the demand curve *predicts* this many extra units,
    # but this slice is shoppers who'd have bought at full price anyway --
    # not a real extra transaction. We exclude it from volume entirely: it's
    # a haircut on how much of the curve's "lift" to actually believe.
    cannibalized_units = gross_lift_total * product.cannibalization

    # pulled_forward_units: a real transaction happens now, but it consumes
    # a future full-price sale that otherwise would have happened. Modeled
    # as an immediate opportunity-cost charge against a future week's margin.
    pulled_forward_units = gross_lift_total * product.pull_forward

    # net_new_units: whatever's left is genuinely new demand this promo
    # unlocked -- the only volume that's actually worth celebrating.
    net_new_units = gross_lift_total - cannibalized_units - pulled_forward_units

    baseline_units_total = product.base_units * horizon_weeks
    # Cannibalized units are deliberately left out here -- see comment above.
    total_promo_units = baseline_units_total + pulled_forward_units + net_new_units

    baseline_profit = baseline_units_total * (product.list_price - product.unit_cost)
    promo_profit = total_promo_units * (promo_price - product.unit_cost)

    # The future sale destroyed by pull-forward would have earned full
    # (list_price - unit_cost) margin. Charging that now keeps the promo
    # honest about a cost that would otherwise show up "next quarter,"
    # invisible to whoever's judging this promo in isolation.
    pull_forward_cost = pulled_forward_units * (product.list_price - product.unit_cost)

    incremental_profit = promo_profit - baseline_profit - pull_forward_cost

    return {
        "sku": product.sku,
        "discount": discount,
        "horizon_weeks": horizon_weeks,
        "promo_price": promo_price,
        "weekly_promo_units": weekly_promo_units,
        "baseline_units_total": baseline_units_total,
        "gross_lift_total": gross_lift_total,
        "cannibalized_units": cannibalized_units,
        "pulled_forward_units": pulled_forward_units,
        "net_new_units": net_new_units,
        "total_promo_units": total_promo_units,
        "incremental_units": total_promo_units - baseline_units_total,
        "baseline_profit": baseline_profit,
        "promo_profit": promo_profit,
        "pull_forward_cost": pull_forward_cost,
        "incremental_profit": incremental_profit,
    }


def sample_products() -> list[Product]:
    """A small hidden catalog with deliberately different behavior per SKU."""
    return [
        Product(
            sku="COLA-12PK",
            list_price=6.99,
            unit_cost=3.80,
            base_units=1000,
            elasticity=-2.8,
            cannibalization=0.15,
            pull_forward=0.35,  # shelf-stable -> shoppers stockpile hard
        ),
        Product(
            sku="TORTILLA-CHIPS",
            list_price=4.49,
            unit_cost=2.10,
            base_units=1500,
            elasticity=-2.2,
            cannibalization=0.30,  # lots of brand-switching on this shelf
            pull_forward=0.10,
        ),
        Product(
            sku="PREMIUM-COFFEE",
            list_price=8.99,
            unit_cost=5.00,
            base_units=500,
            elasticity=-1.6,  # less price-sensitive shoppers
            cannibalization=0.20,
            pull_forward=0.30,
        ),
        Product(
            sku="SNACK-BARS",
            list_price=5.00,
            unit_cost=2.00,  # 60% margin -- room for a discount to still pay
            base_units=800,
            elasticity=-2.5,
            cannibalization=0.10,  # little brand-switching on this item
            pull_forward=0.15,  # not heavily stockpiled
        ),
    ]


if __name__ == "__main__":
    demo = sample_products()[0]
    result = simulate_promo(demo, discount=0.20, horizon_weeks=4)
    for key, value in result.items():
        print(f"{key:22s}: {value}")

"""
Layer 1: brute-force grid search.

For each SKU, try every discount in a fine grid and report the discount that
maximizes incremental_profit. No AI -- this is the "answer key" Layer 2 (the
LLM agent) is judged against: can it find the same peak using far fewer,
adaptively-chosen simulate_promo() calls instead of brute force?
"""

from promo import Product, simulate_promo
from catalog import get_catalog


def sweep(
    product: Product,
    step: float = 0.01,
    max_discount: float = 0.60,
    horizon_weeks: int = 4,
) -> list[dict]:
    """Run simulate_promo() at every discount from 0 up to (not including)
    max_discount and return the full list of results, in order."""
    results = []
    d = 0.0
    while d < max_discount:
        results.append(simulate_promo(product, discount=round(d, 4), horizon_weeks=horizon_weeks))
        d += step
    return results


def best_discount_for(
    product: Product,
    step: float = 0.01,
    max_discount: float = 0.60,
    horizon_weeks: int = 4,
) -> dict:
    """The sweep() result with the highest incremental_profit."""
    return max(
        sweep(product, step=step, max_discount=max_discount, horizon_weeks=horizon_weeks),
        key=lambda r: r["incremental_profit"],
    )


def main():
    catalog = get_catalog()

    print(f"{'SKU':<22} | {'best discount':>13} | {'incremental profit':>18}")
    print("-" * 62)
    for product in catalog:
        best = best_discount_for(product)
        print(
            f"{product.name:<22} | {best['discount']:>12.0%} | "
            f"{best['incremental_profit']:>18,.2f}"
        )


if __name__ == "__main__":
    main()

"""
Pandas view over company_data.py's catalog for the "Catalog overview" section.

This module invents no data of its own -- it only reshapes
company_data.get_full_catalog() (the seeded catalog plus anything added at
runtime) into a tidy DataFrame and aggregates it.
"""

import pandas as pd

from company_data import get_full_catalog


def _catalog_dataframe() -> pd.DataFrame:
    rows = []
    for cp in get_full_catalog():
        p = cp.product
        annual_units = sum(cp.weekly_units)
        rows.append(
            {
                "sku": p.name,
                "name": p.name,
                "category": cp.category,
                "region": cp.region,
                "list_price": p.list_price,
                "unit_cost": p.unit_cost,
                "margin_pct": (p.list_price - p.unit_cost) / p.list_price * 100,
                "annual_units": annual_units,
                "avg_weekly_units": annual_units / len(cp.weekly_units),
            }
        )
    return pd.DataFrame(rows)


def get_catalog_summary() -> dict:
    df = _catalog_dataframe()

    rows = [
        {
            "sku": r.sku,
            "name": r.name,
            "category": r.category,
            "region": r.region,
            "list_price": float(round(r.list_price, 2)),
            "unit_cost": float(round(r.unit_cost, 2)),
            "margin_pct": float(round(r.margin_pct, 1)),
            "annual_units": float(round(r.annual_units, 0)),
            "avg_weekly_units": float(round(r.avg_weekly_units, 0)),
        }
        for r in df.itertuples()
    ]

    portfolio = {
        "total_annual_units": float(round(df["annual_units"].sum(), 0)),
        "sku_count": int(len(df)),
        "avg_price": float(round(df["list_price"].mean(), 2)),
        "avg_margin_pct": float(round(df["margin_pct"].mean(), 1)),
    }

    def _grouped(column: str) -> list:
        grouped = df.groupby(column)["annual_units"].sum().round(0)
        return [{column: key, "annual_units": float(value)} for key, value in grouped.items()]

    return {
        "rows": rows,
        "portfolio": portfolio,
        "by_category": _grouped("category"),
        "by_region": _grouped("region"),
    }

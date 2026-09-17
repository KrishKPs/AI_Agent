"""
The hidden product catalog shared by Layer 1 (grid_search.py) and Layer 2
(agent.py). Every field on these Products is ground truth an agent is not
allowed to read directly -- see promo.py.
"""

from promo import Product


def get_catalog() -> list[Product]:
    return [
        Product(
            name="Lay's Classic 8oz",
            list_price=4.00,
            unit_cost=1.60,
            base_units=1000,
            elasticity=-3.0,   # very price-sensitive, lots of substitutes on shelf
            cannibalization=0.35,
            pull_forward=0.30,
        ),
        Product(
            name="Doritos Nacho 9oz",
            list_price=4.50,
            unit_cost=1.90,
            base_units=800,
            elasticity=-2.2,
            cannibalization=0.25,
            pull_forward=0.20,
        ),
        Product(
            name="Gatorade 28oz",
            list_price=2.50,
            unit_cost=1.10,
            base_units=1500,
            elasticity=-1.8,
            cannibalization=0.10,  # few close substitutes
            pull_forward=0.40,     # shelf-stable, easy to stockpile
        ),
        Product(
            name="Quaker Oats 42oz",
            list_price=5.50,
            unit_cost=3.20,
            base_units=400,
            elasticity=-1.3,   # loyal buyers, not very price-sensitive
            cannibalization=0.05,
            pull_forward=0.10,
        ),
    ]

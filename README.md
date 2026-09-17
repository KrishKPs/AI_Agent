# AI_Agent: Trade Promotion Optimizer (early version)

> Earlier working copy of **[Promolytics](https://github.com/KrishKPs/Promolytics)**. Promolytics is the maintained version.

**An AI agent that finds the discount that actually makes money, not just the one that moves the most units.**

A 40% discount doubles volume and looks great on a sales chart. Three effects quietly eat the profit behind it: margin compression, cannibalization of your own SKUs, and pull-forward (shoppers stockpiling). Promolytics models all three and finds the discount that maximizes *incremental profit*.

## How it works

| Layer | File | What it does |
|---|---|---|
| Simulator | `promo.py` | Deterministic 4-week promo model: baseline vs. promo world, minus cannibalization and pull-forward payback |
| Brute force | `grid_search.py` | Sweeps 0–60% in 1% steps; the exact optimum and the answer key |
| AI agent | `agent.py` | Claude gets only the SKU name and 8 simulator calls, and has to find the peak like an analyst would. It is scored against grid search |
| Dashboard | `server.py` + `frontend/` | FastAPI + React: catalog, profit curve, volume-vs-profit, 2-D profit surface, live slider, streamed agent reasoning |

The agent never sees price, cost, or elasticity, and it knows that "don't run a promotion" (0%) is sometimes the right answer.

## Run it

```bash
pip install -r requirements.txt
cp .env.example .env        # add your ANTHROPIC_API_KEY
python3 -m uvicorn server:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000, or on macOS just double-click `Start Dashboard.command`.

Command line only:

```bash
python3 promo.py                                   # profit curve for one SKU
python3 grid_search.py                             # exact optimum for every SKU
python3 agent.py --sku "Gatorade 28oz" --compare   # agent vs. ground truth
```

Frontend development (the built app is already in `static/`):

```bash
cd frontend && npm install && npm run dev
```

## Stack

Python · FastAPI · pandas · Anthropic Claude (tool use, SSE streaming) · React · Vite

## Limitations

Elasticity, cannibalization and pull-forward are realistic, category-based estimates, not fitted to real sales data. The decision engine is real; those parameters are the part you'd tune. See the Promolytics repo for the full write-up.

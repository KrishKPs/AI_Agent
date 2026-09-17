import { fmtMoney, fmtPct, fmtUnits } from "../format";

/** The one insight the whole project rests on: a deep discount sells a lot
 * more units, but that volume can cost more margin than it earns. Bars are
 * scaled independently (units vs dollars aren't the same axis) — this is a
 * contrast, not a precise chart. */
export default function UnitsVsProfitBars({ deepest, baselineUnits }) {
  if (!deepest) return null;

  const unitsPct = Math.min(100, (deepest.gross_promo_units / (baselineUnits * 2)) * 100);
  const profitMagnitude = Math.max(Math.abs(deepest.incremental_profit), 1);
  const profitPct = Math.min(100, (profitMagnitude / (baselineUnits * 4)) * 100);
  const profitGood = deepest.incremental_profit >= 0;

  return (
    <div className="bars">
      <div className="bar-col">
        <div className="bar-track">
          <div className="bar-fill bar-fill-units" style={{ height: `${Math.max(unitsPct, 4)}%` }} />
        </div>
        <div className="bar-value">{fmtUnits(deepest.gross_promo_units)}</div>
        <div className="bar-label">units sold</div>
      </div>
      <div className="bar-col">
        <div className="bar-track">
          <div
            className={"bar-fill " + (profitGood ? "bar-fill-profit-good" : "bar-fill-profit-bad")}
            style={{ height: `${Math.max(profitPct, 4)}%` }}
          />
        </div>
        <div className={"bar-value " + (profitGood ? "good" : "bad")}>{fmtMoney(deepest.incremental_profit)}</div>
        <div className="bar-label">actual profit</div>
      </div>
      <p className="bars-caption">
        At {fmtPct(deepest.discount)} off, this product sells way more units — but that doesn't mean more money.
      </p>
    </div>
  );
}

import { fmtMoney, fmtPct } from "../format";

function Arrow({ up }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: up ? "none" : "rotate(180deg)" }}>
      <path d="M6 10V2M6 2L2.5 5.5M6 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  target: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 14a4 4 0 1 1 4-4 4 4 0 0 1-4 4Zm0-10.5A6.5 6.5 0 1 0 18.5 12 6.5 6.5 0 0 0 12 5.5Z" />,
  dollar: <path d="M12 2v20M17 6.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5 2.24 3.5 5 3.5 5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  trend: <path d="M3 17l6-6 4 4 8-9M15 6h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  flag: <path d="M5 21V4m0 1h13l-3 4 3 4H5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
};

function KpiIcon({ name }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="kpi-icon" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function KpiCard({ icon, label, value, deltaGood, deltaLabel, accent }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <div className="kpi-label">{label}</div>
        <KpiIcon name={icon} />
      </div>
      <div className={"kpi-value" + (accent ? " kpi-value-accent" : "")}>{value}</div>
      {deltaLabel && (
        <div className={"kpi-delta " + (deltaGood ? "good" : "bad")}>
          <Arrow up={deltaGood} />
          {deltaLabel}
        </div>
      )}
    </div>
  );
}

export default function KpiRow({ kpis }) {
  if (!kpis) return null;
  const { bestDiscount, projectedProfit, unitsLiftPct, breakEvenDiscount } = kpis;
  const profitable = projectedProfit > 0.5;
  const flat = Math.abs(projectedProfit) <= 0.5;

  return (
    <div className="kpi-row">
      <KpiCard icon="target" label="Best discount" value={fmtPct(bestDiscount)} accent />
      <KpiCard
        icon="dollar"
        label="Projected profit"
        value={fmtMoney(projectedProfit)}
        deltaGood={profitable || flat}
        deltaLabel={profitable ? "vs. no promo" : flat ? "no discount pays off" : "loses money"}
      />
      <KpiCard
        icon="trend"
        label="Units lift"
        value={(unitsLiftPct >= 0 ? "+" : "") + unitsLiftPct.toFixed(0) + "%"}
        deltaGood={unitsLiftPct >= 0}
        deltaLabel="vs. normal week"
      />
      <KpiCard
        icon="flag"
        label="Break-even discount"
        value={breakEvenDiscount !== null ? fmtPct(breakEvenDiscount) : "—"}
        deltaGood={breakEvenDiscount !== null}
        deltaLabel={breakEvenDiscount !== null ? "highest that still pays off" : "none tested pay off"}
      />
    </div>
  );
}

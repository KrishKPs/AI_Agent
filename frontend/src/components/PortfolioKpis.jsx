import { fmtCompact, fmtMoney } from "../format";

const ICONS = {
  boxes: <path d="M12 2 3 7l9 5 9-5-9-5ZM3 7v10l9 5V12M21 7v10l-9 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  layers: <path d="M12 2 2 8l10 6 10-6-10-6ZM2 14l10 6 10-6M2 11l10 6 10-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  dollar: <path d="M12 2v20M17 6.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5 2.24 3.5 5 3.5 5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  percent: <path d="M19 5 5 19M7.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm9 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
};

function Icon({ name }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="kpi-icon" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function Card({ icon, label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <div className="kpi-label">{label}</div>
        <Icon name={icon} />
      </div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

export default function PortfolioKpis({ portfolio }) {
  if (!portfolio) return null;
  return (
    <div className="kpi-row">
      <Card icon="boxes" label="Total annual units" value={fmtCompact(portfolio.total_annual_units)} />
      <Card icon="layers" label="SKUs in catalog" value={portfolio.sku_count} />
      <Card icon="dollar" label="Average price" value={fmtMoney(portfolio.avg_price)} />
      <Card icon="percent" label="Average margin" value={portfolio.avg_margin_pct.toFixed(1) + "%"} />
    </div>
  );
}

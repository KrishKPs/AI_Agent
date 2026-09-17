import { CATEGORY_COLOR } from "../categoryIcon";
import { fmtMoney, fmtUnits } from "../format";

export default function ProductTicker({ product }) {
  if (!product) return null;

  const margin = ((product.list_price - product.unit_cost) / product.list_price) * 100;
  const color = CATEGORY_COLOR[product.category] ?? "var(--accent)";

  const rows = [
    ["SKU", product.name],
    ["CATEGORY", product.category],
    ["REGION", product.region],
    ["PRICE", fmtMoney(product.list_price)],
    ["UNIT COST", fmtMoney(product.unit_cost)],
    ["MARGIN", margin.toFixed(1) + "%"],
    ["BASE UNITS", fmtUnits(product.base_units) + "/wk"],
  ];

  return (
    <div className="ticker" style={{ borderLeftColor: color }}>
      {rows.map(([label, value]) => (
        <div className="ticker-row" key={label}>
          <span className="ticker-label">{label}</span>
          <span className="ticker-value">{value}</span>
        </div>
      ))}
    </div>
  );
}

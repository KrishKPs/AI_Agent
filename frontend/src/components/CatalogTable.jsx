import { fmtMoney, fmtUnits } from "../format";

export default function CatalogTable({ rows, activeSku, onSelect }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="table-wrap">
      <table className="catalog-table">
        <thead>
          <tr>
            <th className="col-name">Name</th>
            <th>Category</th>
            <th>Region</th>
            <th className="num">Price</th>
            <th className="num">Unit cost</th>
            <th className="num">Margin</th>
            <th className="num">Annual units</th>
            <th className="num">Avg weekly units</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sku} className={r.sku === activeSku ? "active" : ""} onClick={() => onSelect?.(r.sku)}>
              <td className="col-name">{r.name}</td>
              <td>{r.category}</td>
              <td>{r.region}</td>
              <td className="num">{fmtMoney(r.list_price)}</td>
              <td className="num">{fmtMoney(r.unit_cost)}</td>
              <td className="num">{r.margin_pct.toFixed(1)}%</td>
              <td className="num">{fmtUnits(r.annual_units)}</td>
              <td className="num">{fmtUnits(r.avg_weekly_units)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

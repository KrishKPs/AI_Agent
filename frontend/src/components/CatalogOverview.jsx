import PortfolioKpis from "./PortfolioKpis";
import SalesHistoryChart from "./SalesHistoryChart";
import CatalogTable from "./CatalogTable";
import CategoryRegionBars from "./CategoryRegionBars";
import AddProductForm from "./AddProductForm";

export default function CatalogOverview({ summary, activeProduct, activeSku, onSelectSku, onProductAdded }) {
  if (!summary) return null;

  return (
    <section>
      <div className="section-label">Catalog overview</div>
      <div className="catalog-overview">
        <PortfolioKpis portfolio={summary.portfolio} />

        {activeProduct && (
          <div className="card">
            <div className="chart-title">{activeProduct.name} — 52-week sales history</div>
            <p className="help-text">Weekly units sold, with the category's seasonal pattern visible.</p>
            <SalesHistoryChart weeklyUnits={activeProduct.weekly_units} />
          </div>
        )}

        <div className="card">
          <div className="chart-title">Annual units by category &amp; region</div>
          <p className="help-text">Where the portfolio's volume actually comes from.</p>
          <CategoryRegionBars byCategory={summary.by_category} byRegion={summary.by_region} />
        </div>

        <div className="card">
          <div className="chart-title">All products</div>
          <p className="help-text">Click a row to select that product for the optimizer below.</p>
          <AddProductForm onAdded={onProductAdded} />
          <CatalogTable rows={summary.rows} activeSku={activeSku} onSelect={onSelectSku} />
        </div>
      </div>
    </section>
  );
}

import { useRef } from "react";
import CategoryIcon from "../categoryIcon";
import Sparkline from "./Sparkline";
import { fmtCompact, fmtMoney } from "../format";

export default function ProductCard({ product, active, onSelect }) {
  const cardRef = useRef(null);

  const unitsSold = product.weekly_units.reduce((a, b) => a + b, 0);

  function handleMouseMove(e) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${y * -10}deg) translateY(-2px)`;
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (card) card.style.transform = "";
  }

  return (
    <button
      ref={cardRef}
      className={"product-card" + (active ? " active" : "")}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(product.sku)}
      type="button"
    >
      <div className="product-card-top">
        <span className="product-icon">
          <CategoryIcon category={product.category} />
        </span>
        <span className="product-badges">
          <span className="badge">{product.category}</span>
          <span className="badge badge-quiet">{product.region}</span>
        </span>
      </div>
      <div className="product-name">{product.name}</div>
      <div className="product-stats">
        <div>
          <div className="product-stat-value">{fmtMoney(product.list_price)}</div>
          <div className="product-stat-label">price</div>
        </div>
        <div>
          <div className="product-stat-value">{fmtCompact(unitsSold)}</div>
          <div className="product-stat-label">units / yr</div>
        </div>
      </div>
      <Sparkline values={product.weekly_units} />
    </button>
  );
}

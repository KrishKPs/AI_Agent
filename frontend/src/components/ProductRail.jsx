import ProductCard from "./ProductCard";

export default function ProductRail({ products, activeSku, onSelect }) {
  return (
    <section>
      <div className="section-label">Your catalog</div>
      <div className="product-rail">
        {products.map((p) => (
          <ProductCard key={p.sku} product={p} active={p.sku === activeSku} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

export default function ViewTabs({ view, onChange }) {
  return (
    <div className="view-tabs" role="tablist" aria-label="Dashboard section">
      <button
        type="button"
        role="tab"
        aria-selected={view === "optimizer"}
        className={"view-tab" + (view === "optimizer" ? " active" : "")}
        onClick={() => onChange("optimizer")}
      >
        Promo optimizer
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "catalog"}
        className={"view-tab" + (view === "catalog" ? " active" : "")}
        onClick={() => onChange("catalog")}
      >
        Catalog overview
      </button>
    </div>
  );
}

import { useState } from "react";
import { addCompanyProduct } from "../api";

const CATEGORIES = ["Chips", "Soda", "Snacks", "Beverages", "Other"];
const REGIONS = ["Northeast", "Midwest", "South", "West", "Other"];

const BLANK = {
  name: "",
  category: "Chips",
  categoryOther: "",
  region: "Northeast",
  regionOther: "",
  list_price: "",
  unit_cost: "",
  base_units: "",
};

export default function AddProductForm({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function reset() {
    setForm(BLANK);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const category = form.category === "Other" ? form.categoryOther.trim() : form.category;
    const region = form.region === "Other" ? form.regionOther.trim() : form.region;
    const name = form.name.trim();
    const list_price = parseFloat(form.list_price);
    const unit_cost = parseFloat(form.unit_cost);
    const base_units = parseFloat(form.base_units);

    if (!name) return setError("Give the product a name.");
    if (!category) return setError("Pick or type a category.");
    if (!region) return setError("Pick or type a region.");
    if (!(list_price > 0)) return setError("Shelf price must be greater than $0.");
    if (!(unit_cost >= 0)) return setError("Unit cost can't be negative.");
    if (!(unit_cost < list_price)) return setError("Unit cost must be less than the shelf price.");
    if (!(base_units > 0)) return setError("Normal weekly units must be greater than 0.");

    setSubmitting(true);
    try {
      const created = await addCompanyProduct({ name, category, region, list_price, unit_cost, base_units });
      reset();
      setOpen(false);
      onAdded?.(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-quiet" onClick={() => setOpen(true)}>
        + Add product
      </button>
    );
  }

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <div className="add-product-grid">
        <label className="field">
          <span className="field-label">Product name</span>
          <input
            className="field-input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Ridgeline Sea Salt & Vinegar 8oz"
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field-label">Category</span>
          <select className="field-input" value={form.category} onChange={(e) => update("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {form.category === "Other" && (
          <label className="field">
            <span className="field-label">Category name</span>
            <input
              className="field-input"
              value={form.categoryOther}
              onChange={(e) => update("categoryOther", e.target.value)}
              placeholder="e.g. Frozen"
            />
          </label>
        )}

        <label className="field">
          <span className="field-label">Region</span>
          <select className="field-input" value={form.region} onChange={(e) => update("region", e.target.value)}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        {form.region === "Other" && (
          <label className="field">
            <span className="field-label">Region name</span>
            <input
              className="field-input"
              value={form.regionOther}
              onChange={(e) => update("regionOther", e.target.value)}
              placeholder="e.g. Southwest"
            />
          </label>
        )}

        <label className="field">
          <span className="field-label">Shelf price ($)</span>
          <input
            className="field-input"
            type="number"
            step="0.01"
            min="0"
            value={form.list_price}
            onChange={(e) => update("list_price", e.target.value)}
            placeholder="4.29"
          />
        </label>

        <label className="field">
          <span className="field-label">Cost to make &amp; ship ($)</span>
          <input
            className="field-input"
            type="number"
            step="0.01"
            min="0"
            value={form.unit_cost}
            onChange={(e) => update("unit_cost", e.target.value)}
            placeholder="1.85"
          />
        </label>

        <label className="field">
          <span className="field-label">Normal weekly units sold</span>
          <input
            className="field-input"
            type="number"
            step="1"
            min="0"
            value={form.base_units}
            onChange={(e) => update("base_units", e.target.value)}
            placeholder="900"
          />
        </label>
      </div>

      <p className="add-product-hint">
        We'll infer how shoppers respond to discounts (elasticity, cannibalization, stockpiling) from the category, the
        same way the rest of the catalog works.
      </p>

      {error && <p className="add-product-error">{error}</p>}

      <div className="add-product-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Adding…" : "Add to catalog"}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

import { useEffect, useRef, useState } from "react";
import { fetchCompanySimulate } from "../api";
import { fmtMoney, fmtPct, fmtUnits } from "../format";

export default function ExperimentSlider({ sku }) {
  const [discount, setDiscount] = useState(0.25);
  const [result, setResult] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetchCompanySimulate(sku, discount);
        setResult(r);
      } catch {
        setResult(null);
      }
    }, 120);
    return () => clearTimeout(timer.current);
  }, [sku, discount]);

  const good = result && result.incremental_profit >= 0;

  return (
    <section className="card experiment">
      <div className="section-label">Try your own discount</div>
      <input
        type="range"
        min={0}
        max={59}
        value={Math.round(discount * 100)}
        onChange={(e) => setDiscount(Number(e.target.value) / 100)}
        className="slider"
        aria-label="Discount percentage"
      />
      <p className="experiment-readout">
        At <strong>{fmtPct(discount)} off</strong>: about{" "}
        <strong>{result ? fmtUnits(result.gross_promo_units) : "…"} units</strong>, profit of{" "}
        <strong className={good ? "good" : "bad"}>{result ? fmtMoney(result.incremental_profit) : "…"}</strong>.
      </p>
    </section>
  );
}

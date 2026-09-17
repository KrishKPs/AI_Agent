import { fmtMoney, fmtPct } from "../format";

export default function Headline({ discount, profit, eyebrow }) {
  const good = profit === null || profit >= 0;

  let action;
  let detail;
  if (profit === null) {
    action = `Run a ${fmtPct(discount)} discount.`;
    detail = "";
  } else if (!good || discount === 0) {
    action = "Don't run a promotion this time.";
    detail = "Every discount we tested would lose money — the biggest earner is simply keeping the normal price.";
  } else {
    action = `Run a ${fmtPct(discount)} discount.`;
    detail = `It should add about ${fmtMoney(profit)} in profit over the next month — the best of any discount we tested.`;
  }

  return (
    <div className={"hero-card " + (good ? "hero-good" : "hero-bad")}>
      <div className="hero-glow" aria-hidden="true" />
      {eyebrow && <div className="hero-eyebrow">{eyebrow}</div>}
      <h2 className="hero-action">{action}</h2>
      {detail && <p className="hero-detail">{detail}</p>}
    </div>
  );
}

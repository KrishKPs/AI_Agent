import { fmtPct } from "../format";

export default function Explanation({ best, deepest }) {
  if (!best || !deepest) return null;

  const text =
    best.incremental_profit > 0.5
      ? `A ${fmtPct(best.discount)} discount hits the sweet spot: it's enough to get shoppers ` +
        `buying, without giving away so much margin that the extra volume stops paying for ` +
        `itself. Push it further, to ${fmtPct(deepest.discount)} off, and units keep climbing — ` +
        `but profit doesn't, because too much of that "extra" volume is really just shoppers ` +
        `who would've bought anyway, or stocking up early.`
      : `Every discount we tested loses money for this product. Shoppers here don't respond ` +
        `strongly enough to a lower price to make up for the thinner margin, so the highest-` +
        `profit move is simply keeping the normal price.`;

  return <p className="explanation">{text}</p>;
}

/** The agent's final message ends with a line like:
 *  "FINAL: discount=0.1 incremental_profit=76.4" followed by a reasoning sentence. */
export function parseFinal(text) {
  const m = text.match(/discount\s*=\s*([\d.]+)[\s\S]*?incremental_profit\s*=\s*(-?[\d.]+)/i);
  const discount = m ? parseFloat(m[1]) : null;
  const profit = m ? parseFloat(m[2]) : null;
  const reasoning = text.replace(/FINAL:.*$/im, "").trim();
  return { discount, profit, reasoning };
}

export function comparisonMessage(agentProfit, truth, toolCallsMade) {
  if (!truth) return "";
  if (truth.incremental_profit <= 0.5) {
    return agentProfit <= 0.5
      ? "This matches the exact answer — no discount is actually worth running here."
      : "Note: the exact method found no discount is profitable here, but the AI suggests one anyway.";
  }
  const pct = Math.max(0, Math.min(100, (agentProfit / truth.incremental_profit) * 100));
  return `That's about ${pct.toFixed(0)}% of the maximum possible profit, found using ${toolCallsMade} tries instead of testing every option.`;
}

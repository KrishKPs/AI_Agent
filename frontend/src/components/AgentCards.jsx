import { fmtMoney, fmtPct } from "../format";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 12.5 9.5 18 20 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function resultLine(probe) {
  const { incremental_profit, gross_promo_units } = probe;
  const verb = incremental_profit >= 0 ? "made" : "lost";
  return `Sold about ${Math.round(gross_promo_units).toLocaleString()} units and ${verb} ${fmtMoney(
    Math.abs(incremental_profit)
  )} versus no promo.`;
}

export default function AgentCards({ probes, final, compareMessage, running }) {
  if (probes.length === 0 && !running) return null;

  return (
    <div>
      <div className="section-label">Watching it think</div>
      <div className="agent-timeline">
        <div className="agent-timeline-line" aria-hidden="true" />

        {probes.map((probe, i) => {
          const good = probe.incremental_profit >= 0;
          return (
            <div className="agent-step" key={i}>
              <div className={"agent-node " + (good ? "good" : "bad")}>{i + 1}</div>
              <div className="agent-step-body">
                <div className="agent-step-head">
                  <span className="agent-step-discount">{fmtPct(probe.discount)} off</span>
                  <span className={"agent-step-result " + (good ? "good" : "bad")}>
                    {fmtMoney(probe.incremental_profit)}
                  </span>
                </div>
                <p className="agent-step-detail">{resultLine(probe)}</p>
              </div>
            </div>
          );
        })}

        {running && !final && (
          <div className="agent-step">
            <div className="agent-node pending" />
            <div className="agent-step-body agent-step-pending">Choosing the next discount to try…</div>
          </div>
        )}

        {final && (
          <div className="agent-step agent-step-final">
            <div className="agent-node final">
              <CheckIcon />
            </div>
            <div className="agent-step-body">
              <div className="agent-step-head">
                <span className="agent-step-discount">Settled on {fmtPct(final.discount)}</span>
              </div>
              <p className="agent-step-reasoning">{final.reasoning}</p>
              {compareMessage && <p className="agent-step-compare">{compareMessage}</p>}
              <p className="agent-step-tally">
                Found in {final.toolCallsMade} {final.toolCallsMade === 1 ? "try" : "tries"}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

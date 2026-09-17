export default function RunPanel({ mode, onModeChange, onRun, running }) {
  return (
    <div className="run-panel">
      <div className="toggle" role="radiogroup" aria-label="How to find the best promotion">
        <button
          type="button"
          role="radio"
          aria-checked={mode === "quick"}
          className={"toggle-option" + (mode === "quick" ? " active" : "")}
          onClick={() => onModeChange("quick")}
        >
          Quick answer
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "agent"}
          className={"toggle-option" + (mode === "agent" ? " active" : "")}
          onClick={() => onModeChange("agent")}
        >
          Watch the AI decide
        </button>
      </div>
      <button className="btn btn-primary" onClick={onRun} disabled={running}>
        {running ? "Working…" : "Find the best promotion"}
      </button>
      <p className="run-panel-hint">
        {mode === "quick"
          ? "Tests every discount from 0% to 60% — instant, no AI involved."
          : "An AI makes a handful of smart guesses instead of testing everything, the way a real analyst would."}
      </p>
    </div>
  );
}

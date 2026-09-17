import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import IntroPanel from "./components/IntroPanel";
import Banner from "./components/Banner";
import ProductRail from "./components/ProductRail";
import ViewTabs from "./components/ViewTabs";
import CatalogOverview from "./components/CatalogOverview";
import RunPanel from "./components/RunPanel";
import KpiRow from "./components/KpiRow";
import Headline from "./components/Headline";
import ProfitCurveChart from "./components/ProfitCurveChart";
import ProfitHeatmap from "./components/ProfitHeatmap";
import UnitsVsProfitBars from "./components/UnitsVsProfitBars";
import ProductTicker from "./components/ProductTicker";
import Explanation from "./components/Explanation";
import AgentCards from "./components/AgentCards";
import ExperimentSlider from "./components/ExperimentSlider";
import {
  fetchCompanyProducts,
  fetchCompanyGridSearch,
  fetchCompanySurface,
  fetchCatalogSummary,
  streamCompanyAgent,
} from "./api";
import { parseFinal, comparisonMessage } from "./agentParse";
import "./App.css";

function computeKpis(curve, best) {
  if (!curve || curve.length === 0 || !best) return null;
  const baselineUnits = curve[0].gross_promo_units;
  const unitsLiftPct = baselineUnits ? ((best.gross_promo_units - baselineUnits) / baselineUnits) * 100 : 0;

  let breakEvenDiscount = null;
  if (best.incremental_profit > 0.5) {
    const profitable = curve.filter((p) => p.incremental_profit >= 0);
    breakEvenDiscount = Math.max(...profitable.map((p) => p.discount));
  }

  return { bestDiscount: best.discount, projectedProfit: best.incremental_profit, unitsLiftPct, breakEvenDiscount };
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [activeSku, setActiveSku] = useState(null);
  const [mode, setMode] = useState("quick");
  const [error, setError] = useState("");
  const [catalogSummary, setCatalogSummary] = useState(null);
  const [view, setView] = useState("optimizer");

  const [gridCurve, setGridCurve] = useState(null);
  const [gridBest, setGridBest] = useState(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [surfacePoints, setSurfacePoints] = useState(null);

  const [agentProbes, setAgentProbes] = useState([]);
  const [agentFinal, setAgentFinal] = useState(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    fetchCompanyProducts()
      .then((data) => {
        setProducts(data);
        setActiveSku(data[0]?.sku ?? null);
      })
      .catch(() => setError("Couldn't reach the server. Is it still running?"));

    fetchCatalogSummary()
      .then(setCatalogSummary)
      .catch(() => setError("Couldn't load the catalog overview."));
  }, []);

  function handleProductAdded(newProduct) {
    fetchCompanyProducts()
      .then(setProducts)
      .catch(() => setError("Added the product, but couldn't refresh the catalog list."));
    fetchCatalogSummary()
      .then(setCatalogSummary)
      .catch(() => setError("Added the product, but couldn't refresh the catalog overview."));
    setActiveSku(newProduct.sku);
    setView("catalog");
  }

  useEffect(() => {
    if (!activeSku) return;
    esRef.current?.close();
    setAgentProbes([]);
    setAgentFinal(null);
    setAgentRunning(false);
    loadGrid(activeSku);
    fetchCompanySurface(activeSku)
      .then((data) => setSurfacePoints(data.points))
      .catch(() => setError("Couldn't build the 3D profit surface."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSku]);

  async function loadGrid(sku) {
    setGridLoading(true);
    try {
      const data = await fetchCompanyGridSearch(sku);
      setGridCurve(data.curve);
      setGridBest(data.best);
    } catch {
      setError("Couldn't calculate the profit curve — try picking the product again.");
    } finally {
      setGridLoading(false);
    }
  }

  function runAgent(sku) {
    esRef.current?.close();
    setAgentProbes([]);
    setAgentFinal(null);
    setAgentRunning(true);

    esRef.current = streamCompanyAgent(sku, {
      onEvent: (event) => {
        if (event.type === "tool_call") {
          if (!event.result.error) {
            setAgentProbes((prev) => [...prev, { discount: event.input.discount, ...event.result }]);
          }
        } else if (event.type === "final") {
          esRef.current?.close();
          const { discount, profit, reasoning } = parseFinal(event.text);
          setAgentFinal({ discount, profit, reasoning, toolCallsMade: event.tool_calls_made });
          setAgentRunning(false);
        } else if (event.type === "error") {
          esRef.current?.close();
          setError("The AI hit an error: " + event.message);
          setAgentRunning(false);
        }
      },
      onError: (msg) => {
        esRef.current?.close();
        setError(msg);
        setAgentRunning(false);
      },
    });
  }

  function handleRun() {
    if (!activeSku) return;
    if (mode === "quick") {
      loadGrid(activeSku);
    } else {
      runAgent(activeSku);
    }
  }

  const activeProduct = products.find((p) => p.sku === activeSku);
  const deepest = gridCurve && gridCurve.length > 0 ? gridCurve[gridCurve.length - 1] : null;
  const baselineUnits = gridCurve && gridCurve.length > 0 ? gridCurve[0].gross_promo_units : 0;
  const kpis = computeKpis(gridCurve, gridBest);

  const primary =
    mode === "agent" && agentFinal
      ? { discount: agentFinal.discount, profit: agentFinal.profit }
      : gridBest
      ? { discount: gridBest.discount, profit: gridBest.incremental_profit }
      : null;

  const compareMessage =
    mode === "agent" && agentFinal && agentFinal.profit !== null
      ? comparisonMessage(agentFinal.profit, gridBest, agentFinal.toolCallsMade)
      : "";

  const showResults = Boolean(gridCurve) || agentProbes.length > 0 || agentRunning;

  return (
    <div className="page">
      <Header />
      <div className="container">
        <Banner message={error} onDismiss={() => setError("")} />
        <IntroPanel />

        {products.length > 0 && <ProductRail products={products} activeSku={activeSku} onSelect={setActiveSku} />}

        <ViewTabs view={view} onChange={setView} />

        {view === "catalog" && (
          <CatalogOverview
            summary={catalogSummary}
            activeProduct={activeProduct}
            activeSku={activeSku}
            onSelectSku={setActiveSku}
            onProductAdded={handleProductAdded}
          />
        )}

        {view === "optimizer" && <KpiRow kpis={kpis} />}

        {view === "optimizer" && (
          <RunPanel mode={mode} onModeChange={setMode} onRun={handleRun} running={agentRunning || gridLoading} />
        )}

        {view === "optimizer" && showResults && (
          <div className="dashboard-grid">
            <div className="dashboard-col-main">
              {primary && (
                <Headline
                  discount={primary.discount}
                  profit={primary.profit}
                  eyebrow={mode === "agent" && agentFinal ? "What the AI found" : "The exact answer"}
                />
              )}

              <div className="card">
                <div className="chart-title">The profit curve</div>
                <p className="help-text">Every discount from 0% to 60%, tested automatically.</p>
                <ProfitCurveChart curve={gridCurve} best={gridBest} agentProbes={agentProbes} />
                <div className="legend">
                  <span>
                    <i className="dot" style={{ background: "var(--profit)" }} /> profitable
                  </span>
                  <span>
                    <i className="dot" style={{ background: "var(--loss)" }} /> loses money
                  </span>
                  <span>
                    <i className="dot" style={{ background: "var(--profit)", boxShadow: "0 0 0 2px var(--bg-elevated), 0 0 0 3px var(--profit)" }} /> the
                    exact best one
                  </span>
                  {agentProbes.length > 0 && (
                    <span>
                      <i className="dot" style={{ background: "var(--accent)" }} /> discounts the AI tried
                    </span>
                  )}
                </div>
              </div>

              {deepest && (
                <div className="card">
                  <div className="chart-title">The key insight</div>
                  <UnitsVsProfitBars deepest={deepest} baselineUnits={baselineUnits} />
                </div>
              )}

              <Explanation best={gridBest} deepest={deepest} />

              {mode === "agent" && (
                <AgentCards probes={agentProbes} final={agentFinal} compareMessage={compareMessage} running={agentRunning} />
              )}

              {activeSku && <ExperimentSlider sku={activeSku} />}
            </div>

            <div className="dashboard-col-side">
              <div className="card">
                <div className="chart-title">Profit across discount &amp; promo length</div>
                <p className="help-text">Every combination tested at once — two levers, not just one.</p>
                <ProfitHeatmap points={surfacePoints} best={gridBest} />
              </div>

              {activeProduct && (
                <div className="card">
                  <div className="chart-title">SKU detail</div>
                  <ProductTicker product={activeProduct} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

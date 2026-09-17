import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
  Tooltip,
} from "recharts";
import { fmtMoney, fmtPct } from "../format";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload.find((p) => p.dataKey === "incremental_profit")?.payload;
  if (!point) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-discount">{fmtPct(point.discount)} off</div>
      <div className={"chart-tooltip-profit " + (point.incremental_profit >= 0 ? "good" : "bad")}>
        {fmtMoney(point.incremental_profit)}
      </div>
    </div>
  );
}

export default function ProfitCurveChart({ curve, best, agentProbes }) {
  if (!curve || curve.length === 0) {
    return <div className="chart-placeholder">Calculating the profit curve…</div>;
  }

  const profits = curve.map((p) => p.incremental_profit).concat(agentProbes.map((p) => p.incremental_profit));
  const yMax = Math.max(0, ...profits);
  const yMin = Math.min(0, ...profits);
  const zeroOffset = yMax === yMin ? 0.5 : yMax / (yMax - yMin);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={curve} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="profitSplit" x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor="var(--profit)" stopOpacity={0.28} />
            <stop offset={zeroOffset} stopColor="var(--profit)" stopOpacity={0.03} />
            <stop offset={zeroOffset} stopColor="var(--loss)" stopOpacity={0.06} />
            <stop offset={1} stopColor="var(--loss)" stopOpacity={0.28} />
          </linearGradient>
          <linearGradient id="profitLineSplit" x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor="var(--profit)" />
            <stop offset={zeroOffset} stopColor="var(--profit)" />
            <stop offset={zeroOffset} stopColor="var(--loss)" />
            <stop offset={1} stopColor="var(--loss)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="discount"
          type="number"
          domain={[0, "dataMax"]}
          tickFormatter={fmtPct}
          tick={{ fontFamily: "var(--font-body)", fontSize: 12, fill: "var(--text-faint)" }}
          axisLine={{ stroke: "var(--border-strong)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => fmtMoney(v)}
          tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--text-faint)" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="3 3" />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--text-faint)", strokeDasharray: "3 3" }} />
        <Area
          type="monotone"
          dataKey="incremental_profit"
          stroke="none"
          fill="url(#profitSplit)"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="incremental_profit"
          stroke="url(#profitLineSplit)"
          strokeWidth={2.25}
          dot={false}
          isAnimationActive={false}
        />
        {agentProbes.length > 0 && (
          <Scatter data={agentProbes} dataKey="incremental_profit" fill="var(--accent)" isAnimationActive={false} />
        )}
        {best && (
          <ReferenceDot
            x={best.discount}
            y={best.incremental_profit}
            r={6}
            fill="var(--profit)"
            stroke="var(--bg-elevated)"
            strokeWidth={2}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

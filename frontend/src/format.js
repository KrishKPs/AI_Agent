export function fmtMoney(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function fmtSignedMoney(n) {
  return (n >= 0 ? "+" : "-") + fmtMoney(Math.abs(n));
}

export function fmtPct(discount) {
  return Math.round(discount * 100) + "%";
}

export function fmtUnits(n) {
  return Math.round(n).toLocaleString();
}

export function fmtCompact(n) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function fmtCompactMoney(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + fmtCompact(Math.abs(n));
}

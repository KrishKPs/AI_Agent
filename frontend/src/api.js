const BASE = "/api";

async function getJSON(path, params) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${BASE}${path}${qs}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export function fetchCatalog() {
  return getJSON("/catalog");
}

export function fetchSimulate(sku, discount, horizonWeeks = 4) {
  return getJSON("/simulate", { sku, discount, horizon_weeks: horizonWeeks });
}

export function fetchGridSearch(sku) {
  return getJSON("/grid_search", { sku });
}

export function fetchCompanyProducts() {
  return getJSON("/company/products");
}

export function fetchCatalogSummary() {
  return getJSON("/company/analytics/summary");
}

export async function addCompanyProduct(data) {
  const res = await fetch(`${BASE}/company/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.detail || message;
    } catch {
      // no JSON body -- fall back to the generic message
    }
    throw new Error(message);
  }
  return res.json();
}

export function fetchCompanySimulate(sku, discount, horizonWeeks = 4) {
  return getJSON("/company/simulate", { sku, discount, horizon_weeks: horizonWeeks });
}

export function fetchCompanyGridSearch(sku) {
  return getJSON("/company/grid_search", { sku });
}

export function fetchCompanySurface(sku) {
  return getJSON("/company/surface", { sku });
}

/** Opens an SSE connection for agent mode. Returns the EventSource so the
 * caller can close it early (e.g. on unmount or SKU change). */
function _streamAgent(path, sku, { onEvent, onError }) {
  const es = new EventSource(`${BASE}${path}?${new URLSearchParams({ sku })}`);
  es.onmessage = (evt) => {
    try {
      onEvent(JSON.parse(evt.data));
    } catch {
      onError("The AI sent back something we couldn't read.");
    }
  };
  es.onerror = () => onError("Lost connection while the AI was working.");
  return es;
}

export function streamAgent(sku, handlers) {
  return _streamAgent("/agent/stream", sku, handlers);
}

export function streamCompanyAgent(sku, handlers) {
  return _streamAgent("/company/agent/stream", sku, handlers);
}

const MENU_JSON_URL = import.meta.env.VITE_MENU_JSON_URL?.trim();
const RUNTIME_CONFIG_URL = "/config.json";

let runtimeConfigPromise;

function cleanUrlPart(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function getHostnameFromValue(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  try {
    return new URL(rawValue).hostname;
  } catch {
    return rawValue.split("/")[0].split(":")[0];
  }
}

function getConfiguredMenuHost(config = {}) {
  const explicitHost =
    config.menuHost ||
    config.menuUrl ||
    import.meta.env.VITE_MENU_HOST ||
    import.meta.env.VITE_MENU_HUB_APP_BASE_URL;

  const configuredHost = getHostnameFromValue(explicitHost);
  if (configuredHost) return configuredHost;

  if (typeof window !== "undefined") {
    return window.location.hostname;
  }

  return "";
}

function buildMenuDbName(config = {}) {
  const configuredDb = cleanUrlPart(config.menuDb);

  if (configuredDb && configuredDb !== "auto") {
    return configuredDb;
  }

  const host = getConfiguredMenuHost(config)
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return host ? `menu_${host}` : "";
}

function buildCouchMenuUrl(config = {}) {
  const couchBaseUrl = String(config.couchBaseUrl || "").trim();
  const menuDb = buildMenuDbName(config);
  const menuDoc = String(config.menuDoc || "").trim();

  if (!couchBaseUrl || !menuDb || !menuDoc) return "";

  return [
    couchBaseUrl.replace(/\/+$/g, ""),
    encodeURIComponent(menuDb),
    encodeURIComponent(menuDoc),
  ].join("/");
}

async function loadRuntimeConfig() {
  if (runtimeConfigPromise) return runtimeConfigPromise;

  runtimeConfigPromise = fetch(RUNTIME_CONFIG_URL, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  })
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}));

  return runtimeConfigPromise;
}

function normalizeMenuPayload(payload, config = {}) {
  if (!payload || typeof payload !== "object") return payload;

  const menuField = config.menuField || "menu";

  if (payload[menuField]) return payload[menuField];
  if (payload.content) return payload.content;
  if (payload.menu) return payload.menu;
  if (payload.data) return payload.data;
  if (payload.doc?.[menuField]) return payload.doc[menuField];

  return payload;
}

async function fetchMenuJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }

  return res.json();
}

export async function getMenuData() {
  const runtimeConfig = await loadRuntimeConfig();
  const couchMenuUrl = buildCouchMenuUrl(runtimeConfig);
  const configMenuUrl = String(runtimeConfig.menuJsonUrl || "").trim();
  const primaryUrl = MENU_JSON_URL || configMenuUrl || couchMenuUrl;

  if (!primaryUrl) {
    console.error("getMenuData error: CouchDB menu URL is not configured");
    return undefined;
  }

  try {
    return normalizeMenuPayload(await fetchMenuJson(primaryUrl), runtimeConfig);
  } catch (error) {
    console.error("getMenuData error:", error);
    return undefined;
  }
}





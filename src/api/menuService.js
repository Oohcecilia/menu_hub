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

function getProductsDbName(menuDb) {
  const match = String(menuDb || "").match(/^pos_([a-z0-9]+)_config_[0-9]+$/i);

  return match ? `pos_${match[1]}_products` : "";
}

function buildCouchDbUrl(config = {}, dbName = "") {
  const couchBaseUrl = String(config.couchBaseUrl || "").trim();
  const cleanDbName = cleanUrlPart(dbName);

  if (!couchBaseUrl || !cleanDbName) return "";

  return [
    couchBaseUrl.replace(/\/+$/g, ""),
    encodeURIComponent(cleanDbName),
  ].join("/");
}

function withCacheBuster(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_=${Date.now()}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
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

function buildAttachmentUrl(documentUrl, attachmentName) {
  const cleanAttachmentName = String(attachmentName || "").trim();

  if (!documentUrl || !cleanAttachmentName) return "";

  return [
    documentUrl.replace(/[?#].*$/g, "").replace(/\/+$/g, ""),
    encodeURIComponent(cleanAttachmentName),
  ].join("/");
}

function getUsableLogoUrl(value) {
  const logoUrl = String(value || "").trim();

  if (!logoUrl || logoUrl.startsWith("data/")) return "";

  return logoUrl;
}

function isCacheableBoImageUrl(value) {
  const imageUrl = String(value || "").trim();

  return imageUrl.startsWith("/bo/") || imageUrl.startsWith("bo/");
}

function addImageCacheKey(value, cacheKey) {
  const imageUrl = String(value || "").trim();
  if (!isCacheableBoImageUrl(imageUrl)) return value;

  const [urlWithoutHash, hash = ""] = imageUrl.split("#");
  const separator = urlWithoutHash.includes("?") ? "&" : "?";
  const hashSuffix = hash ? `#${hash}` : "";

  return `${urlWithoutHash}${separator}_img=${encodeURIComponent(cacheKey)}${hashSuffix}`;
}

function applyMenuImageCacheKeys(value, cacheKey) {
  if (!value || typeof value !== "object") return;

  if (typeof value.image === "string") {
    value.image = addImageCacheKey(value.image, cacheKey);
  }

  for (const child of Object.values(value)) {
    applyMenuImageCacheKeys(child, cacheKey);
  }
}

function getBranchId(payload, config = {}) {
  const hostMatch = getConfiguredMenuHost(config).match(/^[a-z0-9]+-([0-9]+)\.m\.posstar\.ph$/i);

  return Number(
    payload?.branch_id ??
    payload?.branchId ??
    payload?.buid ??
    hostMatch?.[1]
  );
}

function getProductUid(product) {
  const uid = product?.product_uid ?? product?.uid ?? product?.puid ?? product?.bo_uid ?? product?.bo_puid ?? product?.id;

  return uid == null ? "" : String(uid);
}

function isMenuProductNode(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    getProductUid(value) &&
    typeof value.name === "string" &&
    (
      Array.isArray(value.prices) ||
      typeof value.image === "string" ||
      value.product_uid != null ||
      value.puid != null ||
      value.bo_puid != null
    )
  );
}

function collectMenuProducts(value, productsByUid = new Map()) {
  if (!value || typeof value !== "object") return productsByUid;

  if (isMenuProductNode(value)) {
    const uid = getProductUid(value);
    const products = productsByUid.get(uid) || [];
    products.push(value);
    productsByUid.set(uid, products);
  }

  for (const child of Object.values(value)) {
    collectMenuProducts(child, productsByUid);
  }

  return productsByUid;
}

function getBranchProductPrice(productDoc, branchId) {
  if (!Array.isArray(productDoc?.prices)) return null;

  return productDoc.prices.find((price) => String(price?.branch_id) === String(branchId)) || null;
}

function hasProductAttachment(productDoc) {
  return Boolean(productDoc?._attachments?.image || productDoc?.image_source_url);
}

function getProductImageVersion(productDoc) {
  const imageAttachment = productDoc?._attachments?.image;
  return (
    imageAttachment?.digest ||
    imageAttachment?.revpos ||
    productDoc?.updated_at ||
    Date.now()
  );
}

function hasExplicitFlag(value) {
  return value === true || value === false || value === 1 || value === 0 || value === "1" || value === "0";
}

function normalizePictureFlag(value) {
  return value === true || value === 1 || value === "1" ? 1 : 0;
}

function isTruthyFlag(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function getComponentPrice(item, branchId) {
  const branchPrice = Array.isArray(item?.prices)
    ? item.prices.find((price) => String(price?.branch_id) === String(branchId))
    : null;
  const price = branchPrice?.price ?? item?.price;

  return Number.isFinite(Number(price)) ? Number(price) : 0;
}

function normalizeComponents(components, type, branchId) {
  const items = components?.[type];
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    ...item,
    uid: item.uid ?? item.product_uid ?? item.bo_uid ?? item.id,
    name: item.name,
    translations: item.translations || { def: item.name || "" },
    price: getComponentPrice(item, branchId),
  }));
}

function normalizeBaseProductName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getVariantLabel(product) {
  const name = String(product?.name || "").trim();
  const basename = String(product?.basename || "").trim();
  const existingLabel = product?.price_label || product?.prices?.[0]?.label || product?.price_options?.[0]?.label;

  if (existingLabel) return existingLabel;
  if (!name || !basename) return "";

  const lowerName = name.toLowerCase();
  const lowerBase = basename.toLowerCase();

  if (!lowerName.startsWith(lowerBase)) return "";

  return name.slice(basename.length).replace(/^[\s\-()]+|[\s\-()]+$/g, "");
}

function getUniquePriceOptions(priceOptions) {
  const seen = new Set();

  return priceOptions.filter((priceOption) => {
    const labelKey = normalizeBaseProductName(priceOption?.label);
    const priceKey = Number(priceOption?.price);
    const key = `${labelKey}|${Number.isFinite(priceKey) ? priceKey : ""}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeMatchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function collectMatchTextValues(value) {
  if (!value) return [];
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(collectMatchTextValues);
  if (typeof value !== "object") return [];

  return Object.entries(value)
    .filter(([key]) => !["visible", "active", "website", "catalog"].includes(key))
    .flatMap(([, entry]) => collectMatchTextValues(entry));
}

function getLocalizedNameForMatch(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";

  return value.def || value.en || Object.values(value).find((entry) => typeof entry === "string" && entry) || "";
}

function getGroupMatchNames(group) {
  return [
    group?.name,
    getLocalizedNameForMatch(group?.translations),
    getLocalizedNameForMatch(group?.properties?.name),
  ]
    .map(normalizeMatchText)
    .filter(Boolean);
}

function normalizeProductCategoryUid(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  const match = rawValue.match(/(\d+)$/);
  return match ? match[1] : rawValue;
}

function getProductCategoryUids(productDoc) {
  const values = [
    productDoc?.category_uid,
    productDoc?.category_id,
    productDoc?.product_category_uid,
    productDoc?.product_category_id,
    ...(Array.isArray(productDoc?.category_uids) ? productDoc.category_uids : []),
  ];

  return [...new Set(values.map(normalizeProductCategoryUid).filter(Boolean))];
}

function getCategoryMatchNames(categoryDoc) {
  return [
    categoryDoc?.name,
    getLocalizedNameForMatch(categoryDoc?.translations),
    getLocalizedNameForMatch(categoryDoc?.translations?.name),
    getLocalizedNameForMatch(categoryDoc?.properties?.name),
  ]
    .map(normalizeMatchText)
    .filter(Boolean);
}

function getProductMatchNames(productDoc, productCategoriesByUid = new Map()) {
  const groups = Array.isArray(productDoc?.all_product_groups)
    ? productDoc.all_product_groups
    : String(productDoc?.all_product_groups || productDoc?.all_product_groups_label || "")
        .split(",")
        .map((value) => value.trim());

  const categoryNames = getProductCategoryUids(productDoc)
    .flatMap((uid) => getCategoryMatchNames(productCategoriesByUid.get(uid)));

  return [
    productDoc?.category,
    productDoc?.group,
    productDoc?.group_name,
    productDoc?.product_group,
    productDoc?.properties?.Category,
    productDoc?.properties?.category,
    ...groups,
    ...categoryNames,
  ]
    .flatMap(collectMatchTextValues)
    .map(normalizeMatchText)
    .filter(Boolean);
}

function getGroupCategoryUid(group) {
  return normalizeProductCategoryUid(
    group?.product_group_uid ||
    group?.category_uid ||
    group?.uid ||
    group?.id
  );
}

function isProductAllowedForBranch(productDoc, branchId) {
  if (!productDoc || productDoc.active === false) return false;

  const branchPrice = getBranchProductPrice(productDoc, branchId);
  if (!branchPrice) return false;

  return branchPrice.catalog !== false && branchPrice.website !== false;
}

function makeMenuProductFromProductDoc(productDoc) {
  const uid = getProductUid(productDoc);

  return {
    uid,
    product_uid: uid,
    name: productDoc?.name || productDoc?.basename || uid,
    translations: productDoc?.translations || { def: productDoc?.name || productDoc?.basename || uid },
    details: productDoc?.details || productDoc?.description || {},
    category_uid: productDoc?.category_uid || productDoc?.category_id || productDoc?.product_category_uid || productDoc?.product_category_id || null,
    category_uids: getProductCategoryUids(productDoc),
    properties: {
      name: productDoc?.translations || { def: productDoc?.name || productDoc?.basename || uid },
      details: productDoc?.details || productDoc?.description || {},
    },
  };
}

function overlayProductFromProductsDb(menuProduct, productDoc, branchId, productCategoriesByUid = new Map()) {
  const uid = getProductUid(menuProduct);
  const branchPrice = getBranchProductPrice(productDoc, branchId);
  const hasImage = hasProductAttachment(productDoc);
  const productCategoryUids = getProductCategoryUids(productDoc);

  if (productDoc?.name) menuProduct.name = productDoc.name;
  if (productDoc?.basename) menuProduct.basename = productDoc.basename;
  menuProduct.category_uid = productDoc?.category_uid || productDoc?.category_id || productDoc?.product_category_uid || productDoc?.product_category_id || menuProduct.category_uid;
  menuProduct.category_uids = productCategoryUids.length ? productCategoryUids : menuProduct.category_uids;
  menuProduct.product_categories = productCategoryUids
    .map((categoryUid) => productCategoriesByUid.get(categoryUid))
    .filter(Boolean);
  if (productDoc?.translations) {
    menuProduct.translations = productDoc.translations;
  } else if (productDoc?.name) {
    const existingTranslations =
      menuProduct.translations && typeof menuProduct.translations === "object"
        ? menuProduct.translations
        : {};

    menuProduct.translations = {
      ...existingTranslations,
      def: productDoc.name,
    };
  }
  if (menuProduct.properties && typeof menuProduct.properties === "object" && productDoc?.name) {
    const existingName =
      menuProduct.properties.name && typeof menuProduct.properties.name === "object"
        ? menuProduct.properties.name
        : {};

    menuProduct.properties = {
      ...menuProduct.properties,
      name: productDoc.translations || { ...existingName, def: productDoc.name },
    };
  }
  const productDetails = productDoc?.details ?? productDoc?.description;
  if (productDetails != null) {
    menuProduct.details = typeof productDetails === "object"
      ? productDetails
      : {
          ...(typeof menuProduct.details === "object" ? menuProduct.details : {}),
          def: productDetails,
        };
  }

  if (branchPrice) {
    menuProduct.catalog = branchPrice.catalog !== false;
    menuProduct.website = branchPrice.website !== false;
    if (Number.isFinite(Number(branchPrice.price))) {
      menuProduct.price = Number(branchPrice.price);
      menuProduct.prices = [{
        uid,
        price: Number(branchPrice.price),
        label: branchPrice.label || "",
      }];
      menuProduct.price_options = menuProduct.prices;
    }
  }

  if (productDoc?.active === false) {
    menuProduct.active = false;
    menuProduct.catalog = false;
    menuProduct.website = false;
  }

  if (hasExplicitFlag(branchPrice?.picture)) {
    menuProduct.picture = normalizePictureFlag(branchPrice.picture);
  } else if (hasExplicitFlag(productDoc?.picture)) {
    menuProduct.picture = normalizePictureFlag(productDoc.picture);
  }
  if (hasExplicitFlag(branchPrice?.website_picture)) {
    menuProduct.website_picture = normalizePictureFlag(branchPrice.website_picture);
  } else if (hasExplicitFlag(productDoc?.website_picture)) {
    menuProduct.website_picture = normalizePictureFlag(productDoc.website_picture);
  }
  if (hasImage) {
    menuProduct.image = `/images/products/${uid}?v=${encodeURIComponent(getProductImageVersion(productDoc))}`;
  }

  if (productDoc?.components) {
    menuProduct.addons = normalizeComponents(productDoc.components, "addons", branchId);
    menuProduct.removables = normalizeComponents(productDoc.components, "removables", branchId);
  }
}

function combineProductVariantsByBasename(content) {
  if (!content || typeof content !== "object") return;

  for (const section of Object.values(content)) {
    if (!Array.isArray(section?.groups)) continue;

    for (const group of section.groups) {
      const products = Array.isArray(group.products)
        ? group.products
        : Object.values(group.products || {});

      if (products.length < 2) continue;

      const combined = [];
      const byBaseName = new Map();

      for (const product of products) {
        const baseName = String(product?.basename || "").trim();
        const baseKey = normalizeBaseProductName(baseName);

        if (!baseKey) {
          combined.push(product);
          continue;
        }

        const existing = byBaseName.get(baseKey);
        if (!existing) {
          byBaseName.set(baseKey, product);
          combined.push(product);
          continue;
        }

        const variantLabel = getVariantLabel(product);
        const existingLabel = getVariantLabel(existing);
        const nextPrices = getUniquePriceOptions([
          ...(Array.isArray(existing.price_options) ? existing.price_options : existing.prices || []),
          ...(Array.isArray(product.price_options) ? product.price_options : product.prices || []),
        ].map((priceOption) => ({
          ...priceOption,
          label: priceOption.label || (String(priceOption.uid) === getProductUid(product) ? variantLabel : existingLabel),
        })));

        existing.price_options = nextPrices;
        existing.prices = nextPrices;
        existing.name = baseName;
        existing.default_name = baseName;
        existing.base_name = baseName;
        existing.translations = existing.translations || product.translations;
        existing.properties = {
          ...(existing.properties || {}),
          name: existing.translations || { def: baseName },
        };

        if ((!existing.image || isTruthyFlag(product.website_picture)) && product.image) {
          existing.image = product.image;
        }
        if (!isTruthyFlag(existing.website_picture) && hasExplicitFlag(product.website_picture)) {
          existing.website_picture = product.website_picture;
        }
        if (!isTruthyFlag(existing.picture) && hasExplicitFlag(product.picture)) {
          existing.picture = product.picture;
        }
        existing.category_uids = [...new Set([
          ...(Array.isArray(existing.category_uids) ? existing.category_uids : []),
          ...(Array.isArray(product.category_uids) ? product.category_uids : []),
        ])];
        existing.product_categories = [
          ...(Array.isArray(existing.product_categories) ? existing.product_categories : []),
          ...(Array.isArray(product.product_categories) ? product.product_categories : []),
        ].filter((category, index, categories) => {
          const uid = normalizeProductCategoryUid(category?.uid || category?._id);
          return uid && categories.findIndex((entry) => normalizeProductCategoryUid(entry?.uid || entry?._id) === uid) === index;
        });
      }

      group.products = combined;
    }
  }
}

async function fetchProductsByUid(config, menuDb, uids) {
  const productsDbUrl = buildCouchDbUrl(config, getProductsDbName(menuDb));
  const uniqueUids = [...new Set(uids.filter(Boolean))];

  if (!productsDbUrl || !uniqueUids.length) return new Map();

  const res = await fetchWithTimeout(withCacheBuster(`${productsDbUrl}/_all_docs`), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    body: JSON.stringify({
      include_docs: true,
      keys: uniqueUids.map((uid) => `products/${uid}`),
    }),
  }, 2500);

  if (!res.ok) {
    throw new Error(`Product DB HTTP error: ${res.status}`);
  }

  const payload = await res.json();
  const productsByUid = new Map();

  for (const row of payload.rows || []) {
    if (!row.doc || row.error) continue;
    if (row.doc.doc_type && row.doc.doc_type !== "product") continue;
    if (row.doc.type && row.doc.type !== "product") continue;
    productsByUid.set(getProductUid(row.doc), row.doc);
  }

  return productsByUid;
}

async function fetchAllBranchProducts(config, menuDb, branchId) {
  const productsDbUrl = buildCouchDbUrl(config, getProductsDbName(menuDb));

  if (!productsDbUrl || !branchId) return [];

  const res = await fetchWithTimeout(withCacheBuster(`${productsDbUrl}/_all_docs?include_docs=true`), {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
  }, 7000);

  if (!res.ok) {
    throw new Error(`Product DB HTTP error: ${res.status}`);
  }

  const payload = await res.json();

  return (payload.rows || [])
    .map((row) => row.doc)
    .filter((doc) => {
      if (!doc) return false;
      if (doc.doc_type && doc.doc_type !== "product") return false;
      if (doc.type && doc.type !== "product") return false;
      return isProductAllowedForBranch(doc, branchId);
    });
}

async function fetchProductCategories(config, menuDb) {
  const productsDbUrl = buildCouchDbUrl(config, getProductsDbName(menuDb));

  if (!productsDbUrl) return new Map();

  const startKey = encodeURIComponent(JSON.stringify("product_category:"));
  const endKey = encodeURIComponent(JSON.stringify("product_category:\ufff0"));
  const res = await fetchWithTimeout(withCacheBuster(`${productsDbUrl}/_all_docs?startkey=${startKey}&endkey=${endKey}&include_docs=true`), {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
  }, 5000);

  if (!res.ok) {
    throw new Error(`Product category DB HTTP error: ${res.status}`);
  }

  const payload = await res.json();
  const categoriesByUid = new Map();

  for (const row of payload.rows || []) {
    const doc = row.doc;
    if (!doc) continue;
    if (doc.doc_type && doc.doc_type !== "product_category") continue;
    if (doc.type && doc.type !== "product_category") continue;

    const uid = normalizeProductCategoryUid(doc.uid || doc.id || row.id);
    if (uid) categoriesByUid.set(uid, doc);
  }

  return categoriesByUid;
}

function compareMenuProductsByName(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { sensitivity: "base" });
}

function fillMenuGroupsFromProductsDb(content, productDocs, branchId, productCategoriesByUid = new Map()) {
  if (!content || typeof content !== "object" || !Array.isArray(productDocs)) return;

  for (const section of Object.values(content)) {
    if (!Array.isArray(section?.groups)) continue;

    for (const group of section.groups) {
      const groupCategoryUid = getGroupCategoryUid(group);
      const groupNames = getGroupMatchNames(group);
      if (!groupCategoryUid && !groupNames.length) continue;

      const existingProducts = Array.isArray(group.products)
        ? group.products
        : Object.values(group.products || {});
      const existingByUid = new Map();

      for (const product of existingProducts) {
        const uid = getProductUid(product);
        if (uid) existingByUid.set(uid, product);
      }

      for (const productDoc of productDocs) {
        const uid = getProductUid(productDoc);
        if (!uid || existingByUid.has(uid)) continue;

        const productCategoryUids = getProductCategoryUids(productDoc);
        const hasCategoryUidMatch = groupCategoryUid && productCategoryUids.includes(groupCategoryUid);
        const productNames = hasCategoryUidMatch ? [] : getProductMatchNames(productDoc, productCategoriesByUid);

        if (!hasCategoryUidMatch && !productNames.some((name) => groupNames.includes(name))) continue;

        existingByUid.set(uid, makeMenuProductFromProductDoc(productDoc));
      }

      const nextProducts = [...existingByUid.values()];
      const existingOrder = new Map(existingProducts.map((product, index) => [getProductUid(product), index]));

      nextProducts.sort((a, b) => {
        const aOrder = existingOrder.has(getProductUid(a)) ? existingOrder.get(getProductUid(a)) : Number.MAX_SAFE_INTEGER;
        const bOrder = existingOrder.has(getProductUid(b)) ? existingOrder.get(getProductUid(b)) : Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return compareMenuProductsByName(a, b);
      });

      group.products = nextProducts;
    }
  }
}

async function refreshMenuProductsFromProductsDb(content, payload, config = {}) {
  const menuDb = buildMenuDbName(config);
  const branchId = getBranchId(payload, config);
  const [branchProducts, productCategoriesByUid] = await Promise.all([
    fetchAllBranchProducts(config, menuDb, branchId),
    fetchProductCategories(config, menuDb),
  ]);

  fillMenuGroupsFromProductsDb(content, branchProducts, branchId, productCategoriesByUid);

  const menuProductsByUid = collectMenuProducts(content);
  const productDocsByUid = new Map(branchProducts.map((productDoc) => [getProductUid(productDoc), productDoc]));
  const missingUids = [...menuProductsByUid.keys()].filter((uid) => !productDocsByUid.has(uid));

  for (const [uid, productDoc] of await fetchProductsByUid(config, menuDb, missingUids)) {
    productDocsByUid.set(uid, productDoc);
  }

  if (!branchId || productDocsByUid.size === 0) return;

  for (const [uid, menuProducts] of menuProductsByUid.entries()) {
    const productDoc = productDocsByUid.get(uid);
    if (!productDoc) continue;

    for (const menuProduct of menuProducts) {
      overlayProductFromProductsDb(menuProduct, productDoc, branchId, productCategoriesByUid);
    }
  }

  combineProductVariantsByBasename(content);
}

async function normalizeMenuDocument(payload, config = {}, documentUrl = "") {
  if (!payload || typeof payload !== "object") {
    return {
      content: payload,
      theme: null,
      themeCss: "",
      logo: "",
      raw: payload,
    };
  }

  const content = normalizeMenuPayload(payload, config);
  try {
    await refreshMenuProductsFromProductsDb(content, payload, config);
  } catch (error) {
    console.warn("Menu product refresh skipped:", error);
  }
  applyMenuImageCacheKeys(content, Date.now());

  const theme = payload.theme && typeof payload.theme === "object" ? payload.theme : null;
  const themeCss = String(payload.theme_css || theme?.css || "").trim();
  const primaryMenu = Array.isArray(payload.menus) ? payload.menus[0] : null;
  const logoAttachment = payload.logo_attachment || primaryMenu?.logo_attachment;
  const logo = String(
    buildAttachmentUrl(documentUrl, logoAttachment) ||
    getUsableLogoUrl(payload.logo) ||
    getUsableLogoUrl(theme?.logo) ||
    ""
  ).trim();

  return {
    content,
    theme,
    themeCss,
    logo,
    raw: payload,
  };
}

async function fetchMenuJson(url) {
  const res = await fetch(withCacheBuster(url), {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }

  return res.json();
}

export async function getMenuData() {
  const menuDocument = await getMenuDocument();
  return menuDocument?.content;
}

export async function getMenuDocument() {
  const runtimeConfig = await loadRuntimeConfig();
  const couchMenuUrl = buildCouchMenuUrl(runtimeConfig);
  const configMenuUrl = String(runtimeConfig.menuJsonUrl || "").trim();
  const primaryUrl = MENU_JSON_URL || configMenuUrl || couchMenuUrl;

  if (!primaryUrl) {
    console.error("getMenuDocument error: CouchDB menu URL is not configured");
    return undefined;
  }

  try {
    return await normalizeMenuDocument(await fetchMenuJson(primaryUrl), runtimeConfig, primaryUrl);
  } catch (error) {
    console.error("getMenuDocument error:", error);
    return undefined;
  }
}

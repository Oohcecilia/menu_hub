export function getLocalizedObject(entity, field = "name") {
  const translations = entity?.translations;

  if (translations?.[field] && typeof translations[field] === "object") {
    return translations[field];
  }

  if (field === "name" && translations && typeof translations === "object") {
    return translations;
  }

  const propertyValue = entity?.properties?.[field];
  if (propertyValue && typeof propertyValue === "object") {
    return propertyValue;
  }

  const directValue = entity?.[field];
  if (directValue && typeof directValue === "object") {
    return directValue;
  }

  return null;
}

export function getDefaultLocalizedText(value, fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") return value || fallback;

  return (
    value.en ||
    value.def ||
    Object.values(value).find(Boolean) ||
    fallback
  );
}

export function getMenuCategoryUid(section, fallback) {
  return String(
    section?.uid ||
    section?.id ||
    section?.groups?.find((group) => group?.uid)?.uid ||
    fallback
  );
}

export function getMenuCategoryLabel(section, fallback) {
  return (
    section?.label ||
    section?.title ||
    getDefaultLocalizedText(getLocalizedObject(section, "name"), section?.name || fallback)
  );
}

export function getMenuCategoryName(section, fallback) {
  return getLocalizedObject(section, "name") || { en: getMenuCategoryLabel(section, fallback) };
}

export function getProductList(products) {
  if (Array.isArray(products)) return products;
  if (products && typeof products === "object") return Object.values(products);

  return [];
}

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isTruthyFlag(value) {
  if (value === true || value === 1) return true;
  if (typeof value !== "string") return false;

  return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
}

export function isSpecialProduct(product) {
  return (
    isTruthyFlag(product?.special) ||
    isTruthyFlag(product?.special_flag) ||
    isTruthyFlag(product?.is_special) ||
    isTruthyFlag(product?.properties?.special) ||
    isTruthyFlag(product?.properties?.special_flag) ||
    isTruthyFlag(product?.properties?.is_special)
  );
}

function getBaseProductName(product, fallback) {
  const translatedName = getLocalizedObject(product, "name");

  if (typeof translatedName === "string") return translatedName;
  if (translatedName?.en) return translatedName.en;
  if (translatedName?.def) return translatedName.def;

  return product?.name || product?.default_name || fallback;
}

function getFallbackPrice(product) {
  const salesPrices = product?.properties?.sales_prices;

  if (product?.price != null) return product.price;
  if (salesPrices?.PHP != null) return salesPrices.PHP;

  return 0;
}

export function normalizeProductPrices(product) {
  const parsedPrices = parseMaybeJson(product?.prices);

  if (Array.isArray(parsedPrices) && parsedPrices.length > 0) {
    return parsedPrices.map((price, index) => ({
      uid: price?.uid != null ? String(price.uid) : null,
      price: parseFloat(price?.price) || 0,
      label: price?.label || price?.name || "",
      index,
    }));
  }

  return [
    {
      uid: null,
      price: parseFloat(getFallbackPrice(product)) || 0,
      label: product?.label || "",
      index: 0,
    },
  ];
}

export function normalizeProduct(product, fallbackId) {
  const productUid = product?.uid ?? product?.puid ?? product?.id ?? fallbackId;
  const baseName = getBaseProductName(product, String(productUid));
  const prices = normalizeProductPrices(product);
  const firstPrice = prices[0];

  return {
    ...product,
    id: String(productUid),
    uid: productUid,
    product_uid: String(productUid),
    price_uid: firstPrice?.uid || String(productUid),
    price_label: firstPrice?.label || "",
    price: firstPrice?.price || 0,
    price_options: prices,
    prices,
    name: baseName,
    default_name: baseName,
    base_name: baseName,
  };
}

export function getDisplayPrices(product) {
  if (Array.isArray(product?.price_options) && product.price_options.length > 0) {
    return product.price_options;
  }

  return normalizeProductPrices(product);
}

export function selectProductPrice(product, priceOption) {
  const productUid = product?.product_uid || product?.uid || product?.id;
  const priceUid = priceOption?.uid || productUid;
  const baseName = product?.base_name || product?.default_name || product?.name || String(productUid);
  const label = priceOption?.label || "";

  return {
    ...product,
    id: String(priceUid),
    uid: productUid,
    product_uid: String(productUid),
    price_uid: String(priceUid),
    price_label: label,
    price: parseFloat(priceOption?.price) || 0,
    price_options: priceOption ? [priceOption] : getDisplayPrices(product).slice(0, 1),
    name: label ? `${baseName} ${label}` : baseName,
    default_name: label ? `${baseName} ${label}` : baseName,
    base_name: baseName,
  };
}

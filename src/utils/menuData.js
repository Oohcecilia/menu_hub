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
    getDefaultLocalizedText(value.en, "") ||
    getDefaultLocalizedText(value.def, "") ||
    Object.values(value).map((entry) => getDefaultLocalizedText(entry, "")).find(Boolean) ||
    fallback
  );
}

function normalizeLabel(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function formatProductName(value) {
  const label = normalizeLabel(value);
  const letters = label.replace(/[^A-Za-z]/g, "");

  if (!letters || letters !== letters.toUpperCase()) return label;

  return label
    .toLocaleLowerCase()
    .replace(/(^|[\s(/-])([A-Za-z])/g, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase()}`);
}

export function getMenuProductTitle(product, getLocalizedField) {
  const translated = formatProductName(
    getLocalizedField?.(product, "translations") ||
    getLocalizedField?.(product, "name") ||
    product?.default_name ||
    product?.name
  );
  const original = formatProductName(
    product?.basename ||
    product?.original_name ||
    product?.bo_name ||
    product?.properties?.basename
  );

  if (!translated) return original;
  if (!original || translated.toLowerCase() === original.toLowerCase()) return translated;

  return `${translated} (${original})`;
}

function collectTextValues(value) {
  if (!value) return [];
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(collectTextValues);
  if (typeof value === "object") return Object.values(value).flatMap(collectTextValues);

  return [];
}

function hasVegetarianCategoryUid(product) {
  const categoryUids = [
    product?.category_uid,
    product?.category_id,
    product?.product_category_uid,
    product?.product_category_id,
    ...(Array.isArray(product?.category_uids) ? product.category_uids : []),
  ].map((value) => String(value || "").trim().toLowerCase());

  return categoryUids.some((value) => value === "123" || value === "product_category:123");
}

export function isVegetarianProduct(product) {
  if (hasVegetarianCategoryUid(product)) {
    return true;
  }

  const categoryText = [
    product?.category,
    product?.category_name,
    product?.group,
    product?.group_name,
    product?.properties?.category,
    product?.properties?.Category,
    ...(Array.isArray(product?.product_categories) ? product.product_categories : []),
  ].flatMap(collectTextValues);

  return categoryText.some((value) => /\bvegetarian\b/i.test(value));
}

export function getProductCategorySearchText(product) {
  const values = [
    product?.category_uid,
    product?.category_id,
    product?.product_category_uid,
    product?.product_category_id,
    ...(Array.isArray(product?.category_uids) ? product.category_uids : []),
    product?.category,
    product?.category_name,
    product?.group,
    product?.group_name,
    product?.properties?.category,
    product?.properties?.Category,
    ...(Array.isArray(product?.product_categories) ? product.product_categories : []),
  ].flatMap(collectTextValues);

  if (hasVegetarianCategoryUid(product)) {
    values.push("Vegetarian");
  }

  return values.join(" ");
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
  if (Array.isArray(products)) return products.filter(isProductVisible);
  if (products && typeof products === "object") return Object.values(products).filter(isProductVisible);

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

function isFalseFlag(value) {
  if (value === false || value === 0) return true;
  if (typeof value !== "string") return false;

  return ["0", "false", "no", "n"].includes(value.trim().toLowerCase());
}

export function isCatalogVisible(product) {
  return !(
    isFalseFlag(product?.catalog) ||
    isFalseFlag(product?.pb?.catalog) ||
    isFalseFlag(product?.product_branch?.catalog) ||
    isFalseFlag(product?.properties?.catalog)
  );
}

export function isWebsiteVisible(product) {
  return !(
    isFalseFlag(product?.website) ||
    isFalseFlag(product?.pb?.website) ||
    isFalseFlag(product?.product_branch?.website) ||
    isFalseFlag(product?.properties?.website)
  );
}

export function isProductVisible(product) {
  return isCatalogVisible(product) && isWebsiteVisible(product);
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

import {
  getDefaultLocalizedText,
  getLocalizedObject,
  getMenuCategoryLabel,
  getProductList,
  normalizeProduct,
} from '@/utils/menuData';

const DESSERT_RE = /dessert|cake|tiramisu|gelato|ice cream|panna cotta|sweet|dolce|dolci|crepe|brownie/i;
const BEVERAGE_RE = /beverage|drink|drinks|wine|beer|cocktail|coffee|espresso|latte|tea|juice|soda|water|softdrink|soft drink/i;
const COFFEE_RE = /coffee|espresso|americano|macchiato|latte|cappuccino|caffe|cafe/i;
const WATER_RE = /water|aqua|panna|san pellegrino/i;
const WINE_RE = /wine|vino|syrah|merlot|montepulciano|sangiovese|chardonnay|negroamaro|soave|prosecco|pinot|cabernet|sauvignon/i;
const BEER_RE = /beer|pilsen|heineken|asahi|tiger|red horse|brew kettle|san miguel/i;
const SODA_RE = /soda|coke|sprite|cola|softdrink|soft drink/i;
const APERITIF_RE = /aperitif|aperitivo|spritz|aperol|campari|prosecco|negroni|martini|vermouth|bellini/i;
const ALCOHOL_RE = /wine|vino|beer|pilsen|heineken|asahi|tiger|red horse|brew kettle|san miguel|cocktail|spritz|aperol|campari|prosecco|negroni|martini|vermouth|bellini/i;
const STARTER_RE = /starter|antipasti|appetizer|salad|soup|bread|focaccia|bruschetta/i;
const MAIN_RE = /pizza|pizze|pasta|risotto|steak|beef|chicken|fish|seafood|main/i;
const PIZZA_RE = /pizza|pizze|calzone|diavola|margherita|napoli|quattro/i;
const PASTA_RE = /pasta|spaghetti|tagliatelle|fettucine|tagliolini|tortelli|vongole|lasagna|ravioli/i;
const SEAFOOD_RE = /fish|seafood|shrimp|salmon|salmone|vongole|pescatore|tonno|scampi|gamber/i;
const MEAT_RE = /steak|beef|chicken|pollo|pork|maiale|manzo|salsiccia|porchetta|bistecca|scaloppine/i;
const LIGHT_RE = /salad|insalata|soup|minestrone|pomodoro|vegetariana|vegetable/i;

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  fil: 'Filipino',
};

const LOCAL_COPY = {
  en: {
    aperitifTitle: 'Start with an aperitif',
    aperitifMessage: (names) => `${names} would be a good before-meal choice while the kitchen prepares the food.`,
    beverageTitle: 'Pair the meal with a drink',
    beveragePrefix: 'No meal drink is selected yet.',
    dessertTitle: 'Finish with something sweet',
    dessertPrefix: 'No dessert is selected yet.',
    starterTitle: 'Before the main?',
    starterMessage: (names) => `${names} is a good starter while the main dishes are prepared.`,
    seafoodReason: (names) => `${names} works better with the seafood direction of this order.`,
    meatReason: (names) => `${names} can stand up to the richer meat dishes in this order.`,
    pastaReason: (names) => `${names} fits the pasta choices without feeling too heavy.`,
    pizzaReason: (names) => `${names} is a stronger match for pizza than coffee or espresso.`,
    defaultReason: (names) => `${names} would round out this order.`,
  },
  de: {
    aperitifTitle: 'Mit einem Aperitif starten',
    aperitifMessage: (names) => `${names} passt gut vor dem Essen, während die Küche vorbereitet.`,
    beverageTitle: 'Ein Getränk zum Essen',
    beveragePrefix: 'Es ist noch kein Getränk zum Essen ausgewählt.',
    dessertTitle: 'Etwas Süßes zum Abschluss',
    dessertPrefix: 'Es ist noch kein Dessert ausgewählt.',
    starterTitle: 'Vor dem Hauptgang?',
    starterMessage: (names) => `${names} ist ein guter Einstieg, während die Hauptgerichte vorbereitet werden.`,
    seafoodReason: (names) => `${names} passt besser zur Meeresfrüchte-Richtung dieser Auswahl.`,
    meatReason: (names) => `${names} hält mit den kräftigeren Fleischgerichten gut mit.`,
    pastaReason: (names) => `${names} passt zu den Pasta-Gerichten, ohne zu schwer zu wirken.`,
    pizzaReason: (names) => `${names} passt stärker zu Pizza als Kaffee oder Espresso.`,
    defaultReason: (names) => `${names} rundet diese Auswahl gut ab.`,
  },
  fr: {
    aperitifTitle: 'Commencer par un apéritif',
    aperitifMessage: (names) => `${names} convient bien avant le repas pendant que la cuisine prépare les plats.`,
    beverageTitle: 'Associer un verre au repas',
    beveragePrefix: "Aucune boisson pour le repas n'est encore sélectionnée.",
    dessertTitle: 'Finir avec une touche sucrée',
    dessertPrefix: "Aucun dessert n'est encore sélectionné.",
    starterTitle: 'Avant le plat principal ?',
    starterMessage: (names) => `${names} est une bonne entrée pendant la préparation des plats principaux.`,
    seafoodReason: (names) => `${names} accompagne mieux l'orientation fruits de mer de cette commande.`,
    meatReason: (names) => `${names} tient bien face aux plats de viande plus riches.`,
    pastaReason: (names) => `${names} accompagne les pâtes sans alourdir le repas.`,
    pizzaReason: (names) => `${names} convient mieux à la pizza que le café ou l'espresso.`,
    defaultReason: (names) => `${names} complète bien cette commande.`,
  },
  it: {
    aperitifTitle: 'Inizia con un aperitivo',
    aperitifMessage: (names) => `${names} è una buona scelta prima del pasto mentre la cucina prepara i piatti.`,
    beverageTitle: 'Abbina una bevanda al pasto',
    beveragePrefix: 'Non è ancora stata scelta una bevanda per il pasto.',
    dessertTitle: 'Concludi con qualcosa di dolce',
    dessertPrefix: 'Non è ancora stato scelto un dessert.',
    starterTitle: 'Prima del piatto principale?',
    starterMessage: (names) => `${names} è un buon antipasto mentre vengono preparati i piatti principali.`,
    seafoodReason: (names) => `${names} segue meglio la direzione di pesce di questo ordine.`,
    meatReason: (names) => `${names} regge bene i piatti di carne più ricchi.`,
    pastaReason: (names) => `${names} accompagna la pasta senza appesantire.`,
    pizzaReason: (names) => `${names} si abbina alla pizza meglio di caffè o espresso.`,
    defaultReason: (names) => `${names} completa bene questo ordine.`,
  },
};

function localizedText(value, language = 'en', fallback = '') {
  if (!value) return fallback;
  if (typeof value === 'string') return value || fallback;

  return (
    value[language] ||
    value.en ||
    value.def ||
    Object.values(value).find(Boolean) ||
    fallback
  );
}

function languageCopy(language = 'en') {
  return LOCAL_COPY[language] || LOCAL_COPY.en;
}

function labelForGroup(group, fallback = '', language = 'en') {
  return localizedText(getLocalizedObject(group, 'name'), language, group?.name || fallback);
}

function hasText(entry, regex) {
  return regex.test([entry.category, entry.group, entry.name].filter(Boolean).join(' '));
}

function entryText(entry) {
  return [entry.category, entry.group, entry.name, entry.description].filter(Boolean).join(' ');
}

function compactProduct(product, category, group, language = 'en') {
  const normalized = normalizeProduct(product, product?.uid || product?.id || product?.name);
  const name = localizedText(getLocalizedObject(product, 'name'), language, normalized.base_name || normalized.name);

  return {
    id: String(normalized.id),
    product_uid: String(normalized.product_uid || normalized.uid || normalized.id),
    name,
    category,
    group,
    description: localizedText(getLocalizedObject(product, 'details'), language, product?.details || ''),
    prices: (normalized.price_options || []).map((price) => ({
      uid: price.uid ? String(price.uid) : null,
      label: price.label || '',
      price: price.price || 0,
    })),
  };
}

function collectGroupProducts(group, category, inheritedGroup = '', language = 'en') {
  const groupName = labelForGroup(group, inheritedGroup, language);
  const products = getProductList(group?.products).map((product) =>
    compactProduct(product, category, groupName, language)
  );

  const childProducts = (group?.children || []).flatMap((child) =>
    collectGroupProducts(child, category, labelForGroup(child, groupName, language), language)
  );

  return [...products, ...childProducts];
}

function flattenMenu(menu, language = 'en') {
  if (!menu || typeof menu !== 'object') return [];

  return Object.entries(menu).flatMap(([categoryKey, section]) => {
    const category = localizedText(getLocalizedObject(section, 'name'), language, getMenuCategoryLabel(section, categoryKey));
    return (section?.groups || []).flatMap((group) => collectGroupProducts(group, category, '', language));
  });
}

function selectedProductForItem(item, productMap, menuItems) {
  const productId = String(item.product_id);
  const product = productMap.get(productId) || productMap.get(Number(productId));
  const productUid = String(item.product_uid || product?.product_uid || product?.uid || product?.id || productId);
  const menuMatch = menuItems.find(
    (entry) =>
      entry.id === productId ||
      entry.product_uid === productUid ||
      (entry.prices || []).some((price) => String(price.uid) === productId)
  );
  const baseName = product?.base_name || product?.default_name || product?.name || menuMatch?.name || productId;
  const label = product?.price_label || '';

  return {
    product_id: productId,
    product_uid: productUid,
    name: label && !String(baseName).includes(label) ? `${baseName} ${label}` : baseName,
    base_name: baseName,
    label,
    quantity: item.quantity || 1,
    note: item.note || '',
    category: menuMatch?.category || '',
    group: menuMatch?.group || '',
  };
}

function rankCandidate(entry, regex) {
  const text = entryText(entry);
  if (regex.test(entry.name || '')) return 0;
  if (regex.test(entry.group || '')) return 1;
  if (regex.test(text)) return 2;
  return 9;
}

function findCandidates(menuItems, regex, selectedUids, limit = 2, filter = () => true) {
  return menuItems
    .filter((entry) => !selectedUids.has(entry.product_uid) && hasText(entry, regex) && filter(entry))
    .sort((a, b) => rankCandidate(a, regex) - rankCandidate(b, regex) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function getSelectedCategories(selected = []) {
  return new Set(selected.map((item) => item.category).filter(Boolean));
}

function isAllowedCategory(entry, selectedCategories) {
  return !entry.category || !selectedCategories.has(entry.category);
}

function productNames(products) {
  return products.map((product) => product.name).filter(Boolean).join(' or ');
}

function analyzeSelection(selected) {
  const texts = selected.map((item) => entryText(item));
  const hasDessert = texts.some((text) => DESSERT_RE.test(text));
  const hasBeverage = texts.some((text) => BEVERAGE_RE.test(text));
  const hasCoffee = texts.some((text) => COFFEE_RE.test(text));
  const hasMealBeverage = texts.some((text) => BEVERAGE_RE.test(text) && !COFFEE_RE.test(text));
  const hasAperitif = texts.some((text) => APERITIF_RE.test(text) || (ALCOHOL_RE.test(text) && !COFFEE_RE.test(text)));
  const hasStarter = texts.some((text) => STARTER_RE.test(text));
  const hasMain = texts.some((text) => MAIN_RE.test(text));
  const hasPizza = texts.some((text) => PIZZA_RE.test(text));
  const hasPasta = texts.some((text) => PASTA_RE.test(text));
  const hasSeafood = texts.some((text) => SEAFOOD_RE.test(text));
  const hasMeat = texts.some((text) => MEAT_RE.test(text));
  const hasLight = texts.some((text) => LIGHT_RE.test(text)) && !hasMain;

  return {
    hasDessert,
    hasBeverage,
    hasCoffee,
    hasMealBeverage,
    hasAperitif,
    hasStarter,
    hasMain,
    hasPizza,
    hasPasta,
    hasSeafood,
    hasMeat,
    hasLight,
  };
}

function aperitifScore(entry, profile) {
  const text = entryText(entry);
  let score = 0;

  if (APERITIF_RE.test(text)) score += 80;
  if (/prosecco|spritz|aperol/i.test(text)) score += 30;
  if (/white wine|soave|chardonnay/i.test(text)) score += 22;
  if (/beer|pilsen|heineken|asahi/i.test(text) && profile.hasPizza) score += 16;
  if (/red wine|syrah|merlot|montepulciano|sangiovese|negroamaro/i.test(text) && profile.hasMeat) score += 12;
  if (WATER_RE.test(text) || SODA_RE.test(text) || COFFEE_RE.test(text)) score -= 100;

  return score;
}

function findAperitifs(menuItems, selectedUids, profile, selectedCategories, limit = 1) {
  return menuItems
    .filter((entry) => {
      if (selectedUids.has(entry.product_uid)) return false;
      if (!isAllowedCategory(entry, selectedCategories)) return false;
      const text = entryText(entry);
      return hasText(entry, BEVERAGE_RE) && ALCOHOL_RE.test(text) && !COFFEE_RE.test(text);
    })
    .map((entry) => ({ entry, score: aperitifScore(entry, profile) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limit)
    .map((item) => item.entry);
}

function beverageScore(entry, profile) {
  const text = entryText(entry);

  if (COFFEE_RE.test(text)) return -100;
  if (WATER_RE.test(text)) return 40;

  let score = 0;

  if (profile.hasPizza) {
    if (BEER_RE.test(text)) score += 34;
    if (SODA_RE.test(text)) score += 20;
    if (WINE_RE.test(text)) score += 14;
  }

  if (profile.hasPasta) {
    if (WINE_RE.test(text)) score += 34;
    if (WATER_RE.test(text)) score += 18;
  }

  if (profile.hasSeafood) {
    if (/white wine|soave|chardonnay/i.test(text)) score += 38;
    if (/red wine|merlot|syrah/i.test(text)) score -= 12;
  }

  if (profile.hasMeat) {
    if (/red wine|syrah|merlot|montepulciano|sangiovese|negroamaro/i.test(text)) score += 36;
    if (BEER_RE.test(text)) score += 12;
  }

  if (profile.hasLight) {
    if (WATER_RE.test(text)) score += 24;
    if (SODA_RE.test(text)) score += 12;
  }

  if (!profile.hasMain) {
    if (WATER_RE.test(text)) score += 18;
    if (SODA_RE.test(text)) score += 8;
  }

  return score;
}

function findMealBeverages(menuItems, selectedUids, profile, selectedCategories, limit = 2) {
  return menuItems
    .filter((entry) => {
      if (selectedUids.has(entry.product_uid)) return false;
      if (!isAllowedCategory(entry, selectedCategories)) return false;
      if (!hasText(entry, BEVERAGE_RE)) return false;
      return !COFFEE_RE.test(entryText(entry));
    })
    .map((entry) => ({ entry, score: beverageScore(entry, profile) }))
    .filter((item) => item.score > -50)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limit)
    .map((item) => item.entry);
}

function dessertScore(entry, profile) {
  const text = entryText(entry);
  let score = 0;

  if (/tiramisu/i.test(text)) score += profile.hasPasta || profile.hasPizza ? 24 : 12;
  if (/panna cotta|gelato/i.test(text)) score += profile.hasSeafood || profile.hasLight ? 22 : 10;
  if (/chocolate|cioccolato|nutella|cake|tortino/i.test(text)) score += profile.hasMeat ? 20 : 10;
  if (/cream cheese|graham/i.test(text)) score += 8;

  return score;
}

function findDesserts(menuItems, selectedUids, profile, selectedCategories, limit = 2) {
  return menuItems
    .filter((entry) =>
      !selectedUids.has(entry.product_uid) &&
      isAllowedCategory(entry, selectedCategories) &&
      hasText(entry, DESSERT_RE)
    )
    .map((entry) => ({ entry, score: dessertScore(entry, profile) }))
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limit)
    .map((item) => item.entry);
}

function suggestionReason(profile, products, language = 'en') {
  const copy = languageCopy(language);
  const names = productNames(products);

  if (profile.hasSeafood) return copy.seafoodReason(names);
  if (profile.hasMeat) return copy.meatReason(names);
  if (profile.hasPasta) return copy.pastaReason(names);
  if (profile.hasPizza) return copy.pizzaReason(names);

  return copy.defaultReason(names);
}

export function buildWaiterSuggestionContext({ cartItems = [], productMap = new Map(), menu, language = 'en' }) {
  const menuItems = flattenMenu(menu, language);
  const selected = cartItems.map((item) => selectedProductForItem(item, productMap, menuItems));

  return {
    language,
    language_name: LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en,
    selected,
    menu: menuItems,
  };
}

function buildWaiterSuggestionApiPayload(context) {
  return {
    language: context.language,
    language_name: context.language_name,
    selected: context.selected,
  };
}

export function getLocalWaiterSuggestions(context) {
  const language = context.language || 'en';
  const copy = languageCopy(language);
  const selectedUids = new Set(context.selected.map((item) => item.product_uid));
  const selectedCategories = getSelectedCategories(context.selected);
  const profile = analyzeSelection(context.selected);

  const suggestions = [];

  if (!profile.hasAperitif && (profile.hasMain || profile.hasStarter)) {
    const aperitifs = findAperitifs(context.menu, selectedUids, profile, selectedCategories);
    if (aperitifs.length) {
      suggestions.push({
        type: 'aperitif',
        title: copy.aperitifTitle,
        message: copy.aperitifMessage(productNames(aperitifs)),
        products: aperitifs,
      });
    }
  }

  if (!profile.hasMealBeverage) {
    const beverages = findMealBeverages(context.menu, selectedUids, profile, selectedCategories);
    if (beverages.length) {
      suggestions.push({
        type: 'beverage',
        title: copy.beverageTitle,
        message: `${copy.beveragePrefix} ${suggestionReason(profile, beverages, language)}`,
        products: beverages,
      });
    }
  }

  if (!profile.hasDessert && (profile.hasMain || profile.hasStarter)) {
    const desserts = findDesserts(context.menu, selectedUids, profile, selectedCategories);
    if (desserts.length) {
      suggestions.push({
        type: 'dessert',
        title: copy.dessertTitle,
        message: `${copy.dessertPrefix} ${suggestionReason(profile, desserts, language)}`,
        products: desserts,
      });
    }
  }

  if (!profile.hasStarter && profile.hasMain && suggestions.length < 2) {
    const starters = findCandidates(context.menu, STARTER_RE, selectedUids, 1, (entry) =>
      isAllowedCategory(entry, selectedCategories)
    );
    if (starters.length) {
      suggestions.push({
        type: 'starter',
        title: copy.starterTitle,
        message: copy.starterMessage(productNames(starters)),
        products: starters,
      });
    }
  }

  return suggestions.slice(0, 2);
}

export async function getWaiterSuggestions({ cartItems = [], productMap = new Map(), menu, language = 'en' }) {
  const context = buildWaiterSuggestionContext({ cartItems, productMap, menu, language });
  const endpoint = import.meta.env.VITE_WAITER_SUGGESTIONS_API_URL || '/api/waiter-suggestions';

  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildWaiterSuggestionApiPayload(context)),
      });

      if (response.ok) {
        const data = await response.json();
        const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
        if (suggestions.length) return { suggestions, context };
      }
    } catch (error) {
      console.warn('Waiter suggestion endpoint failed, using local suggestions.', error);
    }
  }

  return {
    suggestions: getLocalWaiterSuggestions(context),
    context,
  };
}

export async function prewarmWaiterMenu(menu, language = 'en') {
  if (import.meta.env.VITE_WAITER_PREWARM_FROM_BROWSER !== 'true') return;

  const endpoint = import.meta.env.VITE_WAITER_SUGGESTIONS_API_URL || '/api/waiter-suggestions';
  const context = buildWaiterSuggestionContext({ cartItems: [], productMap: new Map(), menu, language });

  if (!context.menu.length) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected: [],
        menu: context.menu,
        language: context.language,
        language_name: context.language_name,
        prewarm: true,
      }),
    });
  } catch (error) {
    console.warn('Waiter menu prewarm failed.', error);
  }
}

import fs from 'node:fs/promises';
import path from 'node:path';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.2';
const MAX_MENU_ITEMS = 180;
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

function trimMenu(menu = []) {
  return menu.slice(0, MAX_MENU_ITEMS).map((item) => ({
    id: String(item.id || item.product_uid || item.name || ''),
    product_uid: String(item.product_uid || item.id || item.name || ''),
    name: item.name || '',
    category: item.category || '',
    group: item.group || '',
    description: item.description || '',
    prices: Array.isArray(item.prices) ? item.prices.slice(0, 4) : [],
  }));
}

function getMenuCachePath(env = process.env) {
  return env.WAITER_MENU_CACHE_PATH || path.join('/tmp', 'menu-hub-waiter-menu.json');
}

async function readMenuCache(env = process.env) {
  try {
    const raw = await fs.readFile(getMenuCachePath(env), 'utf8');
    const parsed = JSON.parse(raw);
    const menu = Array.isArray(parsed?.menu) ? parsed.menu : parsed;
    return trimMenu(Array.isArray(menu) ? menu : []);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('Waiter menu cache could not be read.', error);
    }
    return [];
  }
}

async function writeMenuCache(menu, context, env = process.env) {
  const cachePath = getMenuCachePath(env);
  const cachedMenu = trimMenu(menu);
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(
    cachePath,
    JSON.stringify({
      updated_at: new Date().toISOString(),
      language: context.language || 'en',
      language_name: context.language_name || LANGUAGE_NAMES.en,
      menu: cachedMenu,
    }),
    'utf8'
  );
  return cachedMenu;
}

async function resolveMenu(context, env = process.env) {
  const incomingMenu = trimMenu(Array.isArray(context.menu) ? context.menu : []);

  if (context.prewarm && incomingMenu.length) {
    return writeMenuCache(incomingMenu, context, env);
  }

  if (incomingMenu.length) return incomingMenu;

  return readMenuCache(env);
}

function productKey(product) {
  return String(product?.product_uid || product?.id || product?.name || '').toLowerCase();
}

function menuItemMatchesSelection(menuItem, selectedItem) {
  const selectedProductId = String(selectedItem?.product_id || selectedItem?.id || '');
  const selectedProductUid = String(selectedItem?.product_uid || selectedItem?.uid || selectedProductId);
  const selectedName = String(selectedItem?.name || '').trim().toLowerCase();

  return (
    productKey(menuItem) === selectedProductUid.toLowerCase() ||
    String(menuItem.id || '') === selectedProductId ||
    String(menuItem.product_uid || '') === selectedProductId ||
    (selectedName && String(menuItem.name || '').trim().toLowerCase() === selectedName) ||
    (menuItem.prices || []).some((price) => String(price.uid) === selectedProductId)
  );
}

function getSelectedCategories(selected = [], menu = []) {
  return new Set(
    selected
      .flatMap((item) => {
        if (item.category) return [item.category];

        const menuMatch = menu.find((menuItem) => menuItemMatchesSelection(menuItem, item));
        return menuMatch?.category ? [menuMatch.category] : [];
      })
      .filter(Boolean)
  );
}

function normalizeSuggestions(rawSuggestions = [], menu = [], selected = []) {
  const byKey = new Map();
  const byName = new Map();
  const selectedCategories = getSelectedCategories(selected, menu);

  for (const item of menu) {
    byKey.set(productKey(item), item);
    if (item.name) byName.set(String(item.name).trim().toLowerCase(), item);
  }

  return rawSuggestions
    .filter((suggestion) => suggestion && typeof suggestion === 'object')
    .map((suggestion) => {
      const products = Array.isArray(suggestion.products) ? suggestion.products : [];
      const matchedProducts = products
        .map((product) => {
          const keyMatch = byKey.get(productKey(product));
          if (keyMatch) return keyMatch;

          const name = String(product?.name || '').trim().toLowerCase();
          return byName.get(name) || null;
        })
        .filter(Boolean)
        .filter((product) => !product.category || !selectedCategories.has(product.category))
        .slice(0, 2);

      return {
        type: String(suggestion.type || 'suggestion'),
        title: String(suggestion.title || "Chef's suggestion"),
        message: String(suggestion.message || ''),
        products: matchedProducts,
      };
    })
    .filter((suggestion) => suggestion.message && suggestion.products.length > 0)
    .slice(0, 2);
}

function buildPrompt(context) {
  const selected = Array.isArray(context.selected) ? context.selected : [];
  const menu = trimMenu(Array.isArray(context.menu) ? context.menu : []);
  const excludedCategories = [...getSelectedCategories(selected, menu)];
  const language = String(context.language || 'en').toLowerCase();
  const languageName = context.language_name || LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en;

  return [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: [
            'You are an experienced Italian restaurant chef advising guests on what to add to their order.',
            'Recommend only items that exist in the provided menu JSON.',
            'Never suggest a product from the same category as any selected product.',
            'Go deeper than generic category gaps: consider meal stage, richness, seafood/meat/pasta/pizza direction, balance, and whether the order feels incomplete.',
            'Do not recommend Americano, espresso, cappuccino, latte, macchiato, or coffee as a default upsell. Coffee is not a good automatic suggestion here.',
            'Suggest an aperitif only when the menu contains a real aperitif-style item, or a suitable before-meal wine/beer when no true aperitif exists.',
            'Prefer useful suggestions like aperitif, starter, meal drink, dessert, or dish complement.',
            `Write all suggestion titles and messages in ${languageName}.`,
            'Keep product names exactly as they appear in the provided menu JSON.',
            'Keep messages short, confident, and chef-like.',
            'Return strict JSON only.',
          ].join(' '),
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: JSON.stringify({
            menu,
            selected,
            language,
            language_name: languageName,
            request_kind: context.prewarm ? 'menu_prewarm' : 'suggestions',
            output_rules: {
              max_suggestions: 2,
              product_matching: 'Each product must include product_uid and name from the menu.',
              response_language: languageName,
              excluded_categories: excludedCategories,
              forbidden_default_suggestions: ['Americano', 'Espresso', 'Double Espresso', 'Cappuccino', 'Caffe Latte', 'Coffee'],
            },
          }),
        },
      ],
    },
  ];
}

function getOutputText(responseJson) {
  if (typeof responseJson?.output_text === 'string') return responseJson.output_text;

  return (responseJson?.output || [])
    .flatMap((item) => item?.content || [])
    .map((content) => content?.text || '')
    .filter(Boolean)
    .join('\n');
}

export async function createWaiterSuggestions(context, env = process.env) {
  const selected = Array.isArray(context.selected) ? context.selected : [];
  const menu = await resolveMenu(context, env);

  if (context.prewarm && !selected.length) {
    return {
      suggestions: [],
      cached_menu_items: menu.length,
    };
  }

  if (!menu.length) {
    const error = new Error('Waiter menu cache is empty');
    error.statusCode = 503;
    throw error;
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.statusCode = 501;
    throw error;
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_WAITER_MODEL || DEFAULT_MODEL,
      input: buildPrompt({ ...context, menu, selected }),
      text: {
        format: {
          type: 'json_schema',
          name: 'waiter_suggestions',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['suggestions'],
            properties: {
              suggestions: {
                type: 'array',
                maxItems: 2,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'title', 'message', 'products'],
                  properties: {
                    type: { type: 'string' },
                    title: { type: 'string' },
                    message: { type: 'string' },
                    products: {
                      type: 'array',
                      minItems: 1,
                      maxItems: 2,
                      items: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['product_uid', 'name'],
                        properties: {
                          product_uid: { type: 'string' },
                          name: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`OpenAI waiter suggestions failed: ${response.status} ${detail}`);
    error.statusCode = response.status;
    throw error;
  }

  const responseJson = await response.json();
  const outputText = getOutputText(responseJson);
  const parsed = JSON.parse(outputText || '{}');

  return {
    suggestions: normalizeSuggestions(parsed.suggestions, menu, selected),
  };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const result = await createWaiterSuggestions(request.body || {});
    response.status(200).json(result);
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: 'waiter_suggestions_failed',
      message: error.message,
    });
  }
}

// const API_BASE = "http://localhost:7777";
const API_BASE = window.location.origin + "/api";

export async function getMenuData(buid, order) {
  try {
    const res = await fetch(
      `${API_BASE}/product-groups?buid=${encodeURIComponent(buid)}`
    );


    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }

    const data = await res.json();

    const categories = formatCategories(data.categories, order);
    const products = formatProducts(data.products);

    return {categories: categories, products: products}

  } catch (error) {
    console.error("getCategories error:", error);
    return [];
  }
}

/**
 * Transform backend → UI format
 */
function formatCategories(apiData, order) {
  if (!Array.isArray(apiData)) return [];

  return apiData
    .filter((item) => item.website === 1)
    .map((item, index) => {
      let properties = {};

      try {
        properties =
          typeof item.properties === "string"
            ? JSON.parse(item.properties)
            : item.properties || {};
      } catch {
        properties = {};
      }

      const nameObj = properties?.name || {};
      const name = nameObj.en || nameObj.def || item.name || "";

      return {
        id: item.uid || index,
        name: {
          en: name,
          translation: nameObj,
        },
        is_active: true,
        raw_name: name,
      };
    })
    .sort((a, b) => {
      const aIndex = order.indexOf(a.raw_name);
      const bIndex = order.indexOf(b.raw_name);

      // unknown categories go to bottom
      const aRank = aIndex === -1 ? 999 : aIndex;
      const bRank = bIndex === -1 ? 999 : bIndex;

      return aRank - bRank;
    })
    .map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
}



function formatProducts(products = []) {
  return products
    .map((item) => {
      
      // if (item.website_picture)
      //   console.log(`ITEMS PICTURE`, item.website_picture);

      // ✅ HARD GUARD: skip invalid products immediately
      if (!item?.groupuids || (Array.isArray(item.groupuids) && item.groupuids.length === 0)) {
        return null;
      }


      let props = {};

      try {
        props = item.properties ? JSON.parse(item.properties) : {};
      } catch (e) {
        console.warn("Invalid JSON for product:", item.uid);
      }

      const name = props.name || {};
      const description = props.description || {};
      const details = props.details || {};
      const image = props.image || '';
      const variations = item.variations || [];

      const price =
        Number(props?.sales_prices?.PHP) ||
        Number((item.pricing || "").match(/\d+/)?.[0]) ||
        0;

      const categoryIds = Array.isArray(item.groupuids)
        ? item.groupuids
        : [item.groupuids];

      return {
        id: item.uid,
        name: name,
        description: details || description,
        price,
        image: image || "",
        category_id: categoryIds.map(String),
        is_available: true,
        branch: props.Branch || "",
        variations,
        sort_order: item.sort_order || 0,
        options: [],
        website_picture: item.website_picture
      };
    })
    .filter(Boolean); // remove skipped items
}
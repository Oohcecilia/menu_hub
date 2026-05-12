const API_BASE = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;


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
// function formatCategories(apiData, order) {
//   if (!Array.isArray(apiData)) return [];

//   const normalize = (str) => str?.toLowerCase().trim();

//   // map inconsistent API names → your desired order names
//   const categoryMap = {
//     "pasta": "Pasta E Risotti",
//     "pasta e risotti": "Pasta E Risotti",
//     "pizzas": "Pizze",
//     "pizza": "Pizze",
//     "soups": "Soup",
//     "soup": "Soup",
//   };

//   const normalizeName = (name) => {
//     const key = normalize(name);
//     return categoryMap[key] || name?.trim();
//   };

//   const orderNormalized = order.map(o => normalize(o));

//   return apiData
//     .filter((item) => item.website === 1)
//     .map((item, index) => {
//       let properties = {};

//       try {
//         properties =
//           typeof item.properties === "string"
//             ? JSON.parse(item.properties)
//             : item.properties || {};
//       } catch {
//         properties = {};
//       }


//       const nameObj = properties?.name || {};
//       const rawName = nameObj.en || nameObj.def || item.name || "";

//       return {
//         id: item.uid || index,
//         name: {
//           en: rawName,
//           translation: nameObj,
//         },
//         is_active: true,
//         raw_name: rawName,
//         normalized_name: normalizeName(rawName),
//         backend_sort: item.sort_order ?? null, // preserve backend sort
//       };
//     })
//     .sort((a, b) => {
//       // ✅ 1. prioritize backend sort if available
//       if (a.backend_sort != null && b.backend_sort != null) {
//         return a.backend_sort - b.backend_sort;
//       }

//       // ✅ 2. fallback to your custom order
//       const aIndex = orderNormalized.indexOf(normalize(a.normalized_name));
//       const bIndex = orderNormalized.indexOf(normalize(b.normalized_name));

//       const aRank = aIndex === -1 ? 999 : aIndex;
//       const bRank = bIndex === -1 ? 999 : bIndex;

//       return aRank - bRank;
//     })
//     .map((item, index) => ({
//       ...item,
//       sort_order: index + 1,
//     }));
// }

function formatCategories(apiData, order) {
  if (!Array.isArray(apiData)) return [];

  const normalize = (str) => str?.toLowerCase().trim();

  // map inconsistent API names → your desired order names
  const categoryMap = {
    "pasta": "Pasta E Risotti",
    "pasta e risotti": "Pasta E Risotti",
    "pizzas": "Pizze",
    "pizza": "Pizze",
    "soups": "Soup",
    "soup": "Soup",
  };

  const normalizeName = (name) => {
    const key = normalize(name);
    return categoryMap[key] || name?.trim();
  };

  const orderNormalized = order.map((o) => normalize(o));

  return apiData
    .map((item, index) => {


      const nameObj = item.properties?.name || {};
      const rawName = nameObj.en || nameObj.def || item.name || "";

      return {
        id: item.uid,
        name: {
          en: rawName,
          translation: nameObj,
        },
        raw_name: rawName,
        normalized_name: normalizeName(rawName),
      };
    })

    // ✅ only include categories found in order
    .filter((item) =>
      orderNormalized.includes(
        normalize(item.normalized_name)
      )
    )

    .sort((a, b) => {
      // ✅ prioritize backend sort if available

      // ✅ fallback to custom order
      const aIndex = orderNormalized.indexOf(
        normalize(a.normalized_name)
      );

      const bIndex = orderNormalized.indexOf(
        normalize(b.normalized_name)
      );

      return aIndex - bIndex;
    })

    .map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
}



function formatProducts(products = []) {

  
  return products
    .map((item) => {


      const name = item.properties.name || null;
      const description = item.properties.description || null;
      const details = item.properties.details || null;
      const variations = item.variations || [];


      const price = Number(item.price); 


      return {
        id: item.uid,
        default_name: item.name,
        name,
        description: details || description,
        price,
        image: `https://pp.d3.net/image.php?a=product-${item.uid}`,
        category_id: item.groupuid,
        is_available: true,
        variations,
        sort_order: item.sort_order || 0,
        options: [],
        website_picture: item.website_picture,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.price - b.price); // ✅ ascending price
}
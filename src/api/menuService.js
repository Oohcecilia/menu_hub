const API_BASE = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;




export async function getMenuData(host, order) {
  try {
    const res = await fetch(`${API_BASE}/product-groups`);

    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }

    const data = await res.json();

    const categories = formatCategories(data.categories);
    const subCategories = formatSubCategories(data.subCategories || []);
    const products = formatProducts(data.products);

    return {
      categories,
      subCategories,
      products,
    };
  } catch (error) {
    console.error("getMenuData error:", error);
    return {
      categories: [],
      subCategories: [],
      products: {},
    };
  }
}



function formatCategories(apiData = []) {
  if (!Array.isArray(apiData)) return [];

  return apiData.map((item) => ({
    id: String(item.id ?? item.uid),
    name: {
      en: item.name?.en || item.name,
      translation: item.name?.translation || {},
    },
    sort_order: item.sort_order ?? item.order ?? 0,
  }));
}



function formatSubCategories(apiData = []) {
  if (!Array.isArray(apiData)) return [];

  return apiData.map((item) => ({
    uid: item.uid,
    cuid: String(item.cuid), // link to category
    name: {
      en: item.properties?.name?.en || item.properties?.name?.def || "Unnamed",
      translation: item.properties?.name || {},
    },
    properties: item.properties || {},
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
        image: item.image,
        category_id: item.groupuid,
        is_available: true,
        variations,
        sort_order: item.sort_order || 0,
        options: [],
        website_picture: item.website_picture,
        productgroup: item.productgroup
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.price - b.price); // ✅ ascending price
}



















// export async function getMenuData(host, order) {



//   try {
//     const res = await fetch(
//       `${API_BASE}/product-groups`
//     );


//     if (!res.ok) {
//       throw new Error(`HTTP error: ${res.status}`);
//     }

//     const data = await res.json();

//     const categories = formatCategories(data.categories);
//     const subCategories = data?.subCategories || [];
//     const products = formatProducts(data.products);
    
//     return {categories: categories, subCategories: subCategories, products: products}

//   } catch (error) {
//     console.error("getCategories error:", error);
//     return [];
//   }
// }



// function formatCategories(apiData = []) {
//   if (!Array.isArray(apiData)) return [];

//   return apiData.map((item) => ({
//     id: item.uid,
//     name: {
//       en: item.name,
//       translation: {},
//     },
//     sort_order: item.order,
//   }));
// }




// function formatProducts(products = []) {
  
//   return products
//     .map((item) => {


//       const name = item.properties.name || null;
//       const description = item.properties.description || null;
//       const details = item.properties.details || null;
//       const variations = item.variations || [];


//       const price = Number(item.price); 


//       return {
//         id: item.uid,
//         default_name: item.name,
//         name,
//         description: details || description,
//         price,
//         image: item.image,
//         category_id: item.groupuid,
//         is_available: true,
//         variations,
//         sort_order: item.sort_order || 0,
//         options: [],
//         website_picture: item.website_picture,
//       };
//     })
//     .filter(Boolean)
//     .sort((a, b) => a.price - b.price); // ✅ ascending price
// }





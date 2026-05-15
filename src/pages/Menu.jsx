import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n.jsx';
import { useCart } from '@/lib/cartStore.jsx';
import { useBranch } from '@/lib/BranchContext.jsx';
import Header from '@/components/menu/Header.jsx';
import CategoryNav from '@/components/menu/CategoryNav.jsx';
import SearchBar from '@/components/menu/SearchBar.jsx';
import ProductGrid from '@/components/menu/ProductGrid.jsx';
import ProductModal from '@/components/menu/ProductModal.jsx';
import CartDrawer from '@/components/menu/CartDrawer.jsx';
import FloatingCartButton from '@/components/menu/FloatingCartButton.jsx';
import ScrollButtons from '@/components/menu/ScrollButtons.jsx';
import { Skeleton } from '@/components/ui/skeleton';




export default function Menu() {
  const { getLocalizedField } = useLanguage();
  const { isOpen, setIsOpen, items } = useCart();

  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const userClickedRef = useRef(false);

  const sectionRefs = useRef({});
  const { menu, loading, activeBranch } = useBranch();

  // ── 1. FLATTEN THE 3-TIER MENU STRUCTURE ────────────────────────────────
  const { categories, subcategories, products } = useMemo(() => {
    const parsedCategories = [];
    const parsedSubcategories = [];
    const parsedProducts = [];

    if (menu) {
      Object.entries(menu).forEach(([catKey, section]) => {
        const categoryId = String(section.uid || catKey);

        parsedCategories.push({
          id: categoryId,
          name: section.properties?.name || { en: section.name || catKey },
          sort_order: section.sort !== null ? section.sort : 0,
          translations:section?.translations
        });

        if (section.groups && Array.isArray(section.groups)) {
          section.groups.forEach((group) => {
            const subcategoryId = String(group.uid);

            parsedSubcategories.push({
              id: subcategoryId,
              category_id: categoryId,
              name: group.properties?.name || { en: group.name },
              sort_order: group.sort !== null ? group.sort : section.sort,
              translations: group.translations
            });

            if (group.products && typeof group.products === "object") {
              Object.entries(group.products).forEach(([prodKey, product]) => {
                const primaryPriceObj = product.prices?.[0] || {};
                const productId = String(primaryPriceObj.uid || product.uid || prodKey);
                const productPrice = parseFloat(primaryPriceObj.price) || 0;

                parsedProducts.push({
                  id: productId,
                  category_id: categoryId,
                  subcategory_id: subcategoryId,
                  default_name: product.name || prodKey,
                  name: product.properties?.name || { en: product.name || prodKey },
                  price: productPrice,
                  prices: product.prices || [], // Keep array intact for subcomponents
                  image: product.image,
                  details: product.details,
                  properties: {
                    ...product.properties,
                    name: product.properties?.name || { en: product.name || prodKey },
                    description: product.details,
                  }
                });
              });
            }
          });
        }
      });
    }

    return { categories: parsedCategories, subcategories: parsedSubcategories, products: parsedProducts };
  }, [menu]);

  // ── 2. FILTER & NORMALIZE THE NESTED MENU OBJECT FOR SEARCH ───────────
  const filteredMenu = useMemo(() => {
    if (!menu) return {};
    const search = searchQuery.toLowerCase().trim();
    const filtered = {};

    Object.entries(menu).forEach(([catKey, section]) => {
      const catName = (getLocalizedField(section.properties, "name") || section.name || catKey).toLowerCase();
      const catMatch = !search || catName.includes(search);

      const filteredGroups = (section.groups || [])
        .map((group) => {
          const groupName = (getLocalizedField(group.properties, "name") || group.name || "").toLowerCase();
          const groupMatch = !search || groupName.includes(search);

          const normalizedProductsArray = [];
          if (group.products && typeof group.products === "object") {
            Object.entries(group.products).forEach(([pKey, p]) => {
              const primaryPriceObj = p.prices?.[0] || {};
              normalizedProductsArray.push({
                ...p,
                id: String(primaryPriceObj.uid || p.uid || pKey),
                uid: primaryPriceObj.uid || p.uid || pKey,
                price: parseFloat(primaryPriceObj.price) || 0,
                prices: p.prices || [],
                properties: {
                  ...p.properties,
                  name: p.properties?.name || { en: p.name || pKey },
                  description: p.details,
                }
              });
            });
          }

          const filteredProducts = (search && !groupMatch)
            ? normalizedProductsArray.filter((p) => {
              const pName = (p.name || "").toLowerCase();
              const pDesc = (p.details?.def || p.details?.en || "").toLowerCase();
              return pName.includes(search) || pDesc.includes(search);
            })
            : normalizedProductsArray;

          return { ...group, products: filteredProducts };
        })
        .filter((group) => group.products && group.products.length > 0);

      if (catMatch || filteredGroups.length > 0) {
        filtered[catKey] = { ...section, groups: filteredGroups };
      }
    });

    return filtered;
  }, [menu, searchQuery, getLocalizedField]);

  // ── 3. DERIVE SORTED CATEGORIES ───────────────────────────────────────
  const sortedCategories = useMemo(() => {
    if (!menu) return [];
    return Object.entries(menu)
      .map(([key, section]) => ({
        id: String(section.uid || key),
        key: key,
        name: section.properties?.name || { en: section.name || key },
        sort_order: section.sort ?? 0,
        translations: section?.translations
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [menu]);

  // ── 4. AUTO-SCROLL & INTERSECTION EFFECT ──────────────────────────────
  useEffect(() => {
    const search = searchQuery.trim();
    if (search) {
      const firstMatch = sortedCategories.find((cat) => filteredMenu[cat.key]);
      if (firstMatch) {
        setActiveCategory((prev) => (prev === firstMatch.id ? prev : firstMatch.id));
        const section = sectionRefs.current[firstMatch.id];
        if (section) {
          const offset = 225;
          const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
      return;
    }

    const handleScroll = () => {
      if (userClickedRef.current) return;
      const scrollBottom = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;

      if (scrollBottom >= pageHeight - 20) {
        const lastCategory = sortedCategories[sortedCategories.length - 1];
        if (lastCategory) setActiveCategory(lastCategory.id);
        return;
      }

      const offset = 225;
      let currentCategory = null;

      for (const category of sortedCategories) {
        const section = sectionRefs.current[category.id];
        if (!section) continue;
        const rect = section.getBoundingClientRect();

        if (rect.top <= offset) {
          currentCategory = category.id;
        } else if (!currentCategory && rect.top > offset) {
          currentCategory = category.id;
          break;
        }
      }

      if (!currentCategory && sortedCategories.length) {
        currentCategory = sortedCategories[0].id;
      }
      if (currentCategory) setActiveCategory(currentCategory);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    requestAnimationFrame(handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sortedCategories, filteredMenu, searchQuery]);

  // ── 5. LOOKUP MAP FOR CART MATH ───────────────────────────────────────
  const productMap = useMemo(() => {
    return Object.fromEntries(products.map((p) => [String(p.id), p]));
  }, [products]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = productMap[String(item.product_id)];
      const price = product?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [items, productMap]);

  // ── Click handler: scroll to section ─────────────────────────
  const handleCategorySelect = useCallback((catId) => {
    const hasSearch = searchQuery?.trim()?.length > 0;
    if (hasSearch) setSearchQuery("");
    setActiveCategory(catId);
    userClickedRef.current = true;

    let tries = 0;
    const tryScroll = () => {
      const section = sectionRefs.current[catId];
      if (!section && tries < 10) {
        tries++;
        requestAnimationFrame(tryScroll);
        return;
      }
      if (!section) return;

      const offset = 225;
      const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });

      let timeout;
      const onScroll = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          userClickedRef.current = false;
          window.removeEventListener("scroll", onScroll);
        }, 100);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(tryScroll);
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header products={products} setIsOpen={setIsOpen} />

      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-border/30">
        <CategoryNav
          categories={sortedCategories}
          activeCategory={activeCategory}
          onSelect={handleCategorySelect}
        />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="space-y-3 mt-3">
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Skeleton className="col-span-2 h-64 rounded-2xl" />
              <div className="flex flex-col gap-3">
                <Skeleton className="flex-1 rounded-2xl" />
                <Skeleton className="flex-1 rounded-2xl" />
              </div>
            </div>
          </div>
        ) : (
          <ProductGrid
            menu={filteredMenu}
            onProductOpen={setSelectedProduct}
            sectionRefs={sectionRefs}
          />
        )}
      </main>

      {/* FIXED WINDOW FLAG TRIGGER */}
      {selectedProduct && (
        <ProductModal
          open={!!selectedProduct} 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CartDrawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        products={products}
        subtotal={subtotal}
        onProductOpen={setSelectedProduct}
      />
      <FloatingCartButton subtotal={subtotal} onClick={() => setIsOpen(true)} />
      <ScrollButtons />
    </div>
  );
}


// export default function Menu() {
//   const { getLocalizedField } = useLanguage();
//   const { isOpen, setIsOpen, items } = useCart();

//   const [activeCategory, setActiveCategory] = useState("");
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const userClickedRef = useRef(false);
//   const clickTimeoutRef = useRef(null); // Not explicitly used below, but kept from original

//   const sectionRefs = useRef({});
//   const { menu, loading, activeBranch } = useBranch();

//   // ── 1. FLATTEN THE 3-TIER MENU STRUCTURE (With Object-based Products) ──
//   const { categories, subcategories, products } = useMemo(() => {
//     const parsedCategories = [];
//     const parsedSubcategories = [];
//     const parsedProducts = [];

//     if (menu) {
//       Object.entries(menu).forEach(([catKey, section]) => {
//         const categoryId = String(section.uid || catKey);

//         parsedCategories.push({
//           id: categoryId,
//           name: section.properties?.name || { en: section.name || catKey },
//           sort_order: section.sort !== null ? section.sort : 0,
//         });

//         if (section.groups && Array.isArray(section.groups)) {
//           section.groups.forEach((group) => {
//             const subcategoryId = String(group.uid);

//             parsedSubcategories.push({
//               id: subcategoryId,
//               category_id: categoryId,
//               name: group.properties?.name || { en: group.name },
//               sort_order: group.sort !== null ? group.sort : section.sort,
//             });

//             // Parse products object safely into a flat list
//             if (group.products && typeof group.products === "object") {
//               Object.entries(group.products).forEach(([prodKey, product]) => {
//                 // Extract the first price tier object
//                 const primaryPriceObj = product.prices?.[0] || {};
//                 const productId = String(primaryPriceObj.uid || product.uid || prodKey);
//                 const productPrice = parseFloat(primaryPriceObj.price) || 0;


//                 parsedProducts.push({
//                   id: productId,
//                   category_id: categoryId,
//                   subcategory_id: subcategoryId,
//                   name: product.name || { en: product.name || prodKey },
//                   price: product.prices,
//                   image: product.image,
//                   details: product.details
//                 });

//               });
//             }
//           });
//         }
//       });
//     }

//     return {
//       categories: parsedCategories,
//       subcategories: parsedSubcategories,
//       products: parsedProducts,
//     };
//   }, [menu]);

//   // ── 2. FILTER & NORMALIZE THE NESTED MENU OBJECT FOR SEARCH ───────────
//   const filteredMenu = useMemo(() => {
//     if (!menu) return {};
//     const search = searchQuery.toLowerCase().trim();

//     const filtered = {};

//     Object.entries(menu).forEach(([catKey, section]) => {
//       const catName = (getLocalizedField(section.properties, "name") || section.name || catKey).toLowerCase();
//       const catMatch = !search || catName.includes(search);

//       const filteredGroups = (section.groups || [])
//         .map((group) => {
//           const groupName = (getLocalizedField(group.properties, "name") || group.name || "").toLowerCase();
//           const groupMatch = !search || groupName.includes(search);

//           // 1. Transform the products map into an array structure for ProductGrid compatibility
//           const normalizedProductsArray = [];
//           if (group.products && typeof group.products === "object") {
//             Object.entries(group.products).forEach(([pKey, p]) => {
//               const primaryPriceObj = p.prices?.[0] || {};
//               normalizedProductsArray.push({
//                 ...p,
//                 uid: primaryPriceObj.uid || p.uid || pKey,
//               });
//             });
//           }

//           // 2. Filter products based on search input
//           const filteredProducts = (search && !groupMatch)
//             ? normalizedProductsArray.filter((p) => {
//               const pName = (p.name || "").toLowerCase();
//               const pDesc = (p.details?.def || p.details?.en || "").toLowerCase();
//               return pName.includes(search) || pDesc.includes(search);
//             })
//             : normalizedProductsArray; // Keep all if parent subcategory matches target search

//           return { ...group, products: filteredProducts };
//         })
//         .filter((group) => group.products && group.products.length > 0);

//       if (catMatch || filteredGroups.length > 0) {
//         filtered[catKey] = {
//           ...section,
//           groups: filteredGroups,
//         };
//       }
//     });

//     return filtered;
//   }, [menu, searchQuery, getLocalizedField]);

//   // ── 3. DERIVE SORTED CATEGORIES ───────────────────────────────────────
//   const sortedCategories = useMemo(() => {
//     if (!menu) return [];
//     return Object.entries(menu)
//       .map(([key, section]) => ({
//         id: String(section.uid || key),
//         key: key,
//         name: section.properties?.name || { en: section.name || key },
//         sort_order: section.sort ?? 0,
//       }))
//       .sort((a, b) => a.sort_order - b.sort_order);
//   }, [menu]);

//   // ── 4. AUTO-SCROLL & INTERSECTION EFFECT ──────────────────────────────
//   useEffect(() => {
//     const search = searchQuery.trim();

//     if (search) {
//       const firstMatch = sortedCategories.find((cat) => filteredMenu[cat.key]);

//       if (firstMatch) {
//         setActiveCategory((prev) => (prev === firstMatch.id ? prev : firstMatch.id));

//         const section = sectionRefs.current[firstMatch.id];
//         if (section) {
//           const offset = 225;
//           const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
//           window.scrollTo({ top, behavior: "smooth" });
//         }
//       }
//       return;
//     }

//     const handleScroll = () => {
//       if (userClickedRef.current) return;

//       const scrollBottom = window.innerHeight + window.scrollY;
//       const pageHeight = document.documentElement.scrollHeight;

//       if (scrollBottom >= pageHeight - 20) {
//         const lastCategory = sortedCategories[sortedCategories.length - 1];
//         if (lastCategory) setActiveCategory(lastCategory.id);
//         return;
//       }

//       const offset = 225;
//       let currentCategory = null;

//       for (const category of sortedCategories) {
//         const section = sectionRefs.current[category.id];
//         if (!section) continue;
//         const rect = section.getBoundingClientRect();

//         if (rect.top <= offset) {
//           currentCategory = category.id;
//         } else if (!currentCategory && rect.top > offset) {
//           currentCategory = category.id;
//           break;
//         }
//       }

//       if (!currentCategory && sortedCategories.length) {
//         currentCategory = sortedCategories[0].id;
//       }

//       if (currentCategory) setActiveCategory(currentCategory);
//     };

//     window.addEventListener("scroll", handleScroll, { passive: true });
//     requestAnimationFrame(handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [sortedCategories, filteredMenu, searchQuery]);

//   // ── 5. LOOKUP MAP FOR CART MATH ───────────────────────────────────────
//   const productMap = useMemo(() => {
//     return Object.fromEntries(products.map((p) => [String(p.id), p]));
//   }, [products]);
 

//   const subtotal = useMemo(() => {
//     return items.reduce((sum, item) => {
//       const product = productMap[String(item.product_id)];
//       const price = product?.price || 0;

//       return sum + price * item.quantity;
//     }, 0);
//   }, [items, productMap]);

//   // ── Click handler: scroll to section ─────────────────────────
//   const handleCategorySelect = useCallback(
//     (catId) => {
//       const hasSearch = searchQuery?.trim()?.length > 0;

//       if (hasSearch) {
//         setSearchQuery("");
//       }

//       setActiveCategory(catId);
//       userClickedRef.current = true;

//       let tries = 0;

//       const tryScroll = () => {
//         const section = sectionRefs.current[catId];

//         if (!section && tries < 10) {
//           tries++;
//           requestAnimationFrame(tryScroll);
//           return;
//         }

//         if (!section) return;

//         const offset = 225;
//         const top =
//           section.getBoundingClientRect().top + window.pageYOffset - offset;

//         window.scrollTo({
//           top,
//           behavior: "smooth",
//         });

//         let timeout;

//         const onScroll = () => {
//           clearTimeout(timeout);

//           timeout = setTimeout(() => {
//             userClickedRef.current = false;
//             window.removeEventListener("scroll", onScroll);
//           }, 100);
//         };

//         window.addEventListener("scroll", onScroll, {
//           passive: true,
//         });
//       };

//       // wait for React to flush search reset + re-render
//       requestAnimationFrame(() => {
//         requestAnimationFrame(tryScroll);
//       });
//     },
//     [searchQuery]
//   );

//   return (
//     <div className="min-h-screen bg-background">
//       <Header products={products} setIsOpen={setIsOpen} />

//       <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-border/30">
//         <CategoryNav
//           categories={sortedCategories}
//           activeCategory={activeCategory}
//           onSelect={handleCategorySelect}
//         />
//         <SearchBar value={searchQuery} onChange={setSearchQuery} />
//       </div>

//       <main className="max-w-5xl mx-auto px-4 pb-16">
//         {loading ? (
//           <div className="space-y-3 mt-3">
//             <div className="grid grid-cols-3 gap-3 mt-2">
//               <Skeleton className="col-span-2 h-64 rounded-2xl" />
//               <div className="flex flex-col gap-3">
//                 <Skeleton className="flex-1 rounded-2xl" />
//                 <Skeleton className="flex-1 rounded-2xl" />
//               </div>
//             </div>
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
//               {Array.from({ length: 4 }).map((_, i) => (
//                 <Skeleton key={i} className="h-48 rounded-2xl" />
//               ))}
//             </div>
//           </div>
//         ) : (
//           <ProductGrid
//             menu={filteredMenu}
//             onProductOpen={setSelectedProduct}
//             sectionRefs={sectionRefs}
//           />
//         )}
//       </main>

//       {selectedProduct && (
//         <ProductModal
//           open={isOpen} // Check if this should be `!!selectedProduct` rather than `isOpen` (cart state) based on your needs
//           product={selectedProduct}
//           onClose={() => setSelectedProduct(null)}
//         />
//       )}

//       <CartDrawer
//         open={isOpen}
//         onClose={() => setIsOpen(false)}
//         products={products}
//         subtotal={subtotal}
//         onProductOpen={setSelectedProduct}
//       />
//       <FloatingCartButton subtotal={subtotal} onClick={() => setIsOpen(true)} />
//       <ScrollButtons />
//     </div>
//   );
// }

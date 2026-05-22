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
import { getDefaultLocalizedText, getDisplayPrices, getLocalizedObject, getMenuCategoryLabel, getMenuCategoryName, getMenuCategoryUid, getProductList, isSpecialProduct, normalizeProduct, selectProductPrice } from '@/utils/menuData';

const SPECIAL_CATEGORY_ID = "__special__";
const SPECIAL_CATEGORY_KEY = "__special__";

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSearchTokens(value) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function matchesSearchTokens(value, tokens) {
  const haystack = normalizeSearchText(value);
  return tokens.every((token) => haystack.includes(token));
}

export default function Menu() {
  const { getLocalizedField } = useLanguage();
  const { isOpen, setIsOpen, items } = useCart();

  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const userClickedRef = useRef(false);
  const clickTimeoutRef = useRef(null); // Not explicitly used below, but kept from original
  const categoryFocusHandledRef = useRef(false);

  const sectionRefs = useRef({});

  const { menu, loading, activeBranch } = useBranch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const suggestion = params.get("suggestion");
    const category = params.get("category");

    if (params.get("selection") === "1" || sessionStorage.getItem("openSelection") === "1") {
      setIsOpen(true);
      sessionStorage.removeItem("openSelection");
    }

    if (suggestion) {
      setSearchQuery(suggestion);
      return;
    }

    if (category) return;

    const storedSuggestion = sessionStorage.getItem("menuSuggestionFocus");
    if (!storedSuggestion) return;

    try {
      const parsed = JSON.parse(storedSuggestion);
      if (parsed?.name) setSearchQuery(parsed.name);
    } catch {
      sessionStorage.removeItem("menuSuggestionFocus");
    }
  }, [setIsOpen]);

  // ── 1. FLATTEN THE NEW DATA STRUCTURE ─────────────────────────
  // We extract 'groups' as categories and 'products' as a flat array 
  // so the rest of your existing logic works seamlessly.


  // ── 1. FLATTEN THE 3-TIER MENU STRUCTURE ─────────────────────────
  const { categories, subcategories, products } = useMemo(() => {
    const parsedCategories = [];
    const parsedSubcategories = [];
    const parsedProducts = [];

    if (menu) {
      // Iterate over the top-level menu keys (Categories)
      Object.entries(menu).forEach(([catKey, section]) => {
        const categoryId = getMenuCategoryUid(section, catKey);
        const categoryLabel = getMenuCategoryLabel(section, catKey);

        parsedCategories.push({
          id: categoryId,
          label: categoryLabel,
          name: getMenuCategoryName(section, catKey),
          sort_order: section.sort !== null ? section.sort : 0,
        });

        // Iterate over the groups (Subcategories)
        if (section.groups && Array.isArray(section.groups)) {
          section.groups.forEach((group) => {
            const subcategoryId = String(group.uid);

            parsedSubcategories.push({
              id: subcategoryId,
              category_id: categoryId, // Link back to the parent Category
              name: getLocalizedObject(group, "name") || { en: group.name },
              sort_order: group.sort !== null ? group.sort : section.sort,
            });

            // Iterate over the actual Products
            const groupProducts = getProductList(group.products);

            if (groupProducts.length > 0) {
              groupProducts.forEach((product, productIndex) => {
                parsedProducts.push({
                  ...normalizeProduct(product, `${subcategoryId}-${productIndex}`),
                  category_id: categoryId,       // Used for top-level filtering/scrolling
                  subcategory_id: subcategoryId, // Used if you want to group by subcat in the UI
                });
              });
            }
          });
        }
      });
    }

    return {
      categories: parsedCategories,
      subcategories: parsedSubcategories,
      products: parsedProducts
    };
  }, [menu]);

  // ── 2. EXISTING LOGIC (Now powered by the flattened data) ─────
  // ── 1. FILTER THE NESTED MENU OBJECT ───────────────────────────
  const searchFilteredMenu = useMemo(() => {
    if (!menu) return {};
    const searchTokens = getSearchTokens(searchQuery);
    if (searchTokens.length === 0) return menu;

    const filtered = {};

    Object.entries(menu).forEach(([catKey, section]) => {
      const catName = (
        getLocalizedField(section, 'translations') ||
        getLocalizedField(section, 'name') ||
        getDefaultLocalizedText(getLocalizedObject(section, "name"), section.name || catKey)
      );
      const catMatch = matchesSearchTokens(catName, searchTokens);

      // Filter the groups (subcategories)
      const filteredGroups = (section.groups || []).map(group => {
        const groupName = (
          getLocalizedField(group, 'translations') ||
          getLocalizedField(group, 'name') ||
          getDefaultLocalizedText(getLocalizedObject(group, "name"), group.name || "")
        );
        const groupMatch = matchesSearchTokens(`${catName} ${groupName}`, searchTokens);
        const groupProducts = getProductList(group.products);

        // If the group name matches, we keep ALL its products.
        // Otherwise, we filter the products by name.
        const filteredProducts = groupMatch
          ? groupProducts
          : groupProducts.filter(p => {
            const pName = (
              getLocalizedField(p, 'translations') ||
              getLocalizedField(p, 'name') ||
              getDefaultLocalizedText(getLocalizedObject(p, "name"), p.name || p.default_name || "")
            );
            const pDesc = (
              getLocalizedField(p?.properties, 'details') ||
              getLocalizedField(p, 'details') ||
              p?.details?.description ||
              p?.description ||
              ""
            );
            const productGroupNames = Array.isArray(p?.all_product_groups)
              ? p.all_product_groups.join(" ")
              : p?.all_product_groups_label || p?.all_product_groups || "";

            return matchesSearchTokens(`${catName} ${groupName} ${productGroupNames} ${pName} ${pDesc}`, searchTokens);
          });

        return { ...group, products: filteredProducts };
      }).filter(group => group.products && group.products.length > 0);

      // Keep the category if the title matches OR if it has matching products/groups
      if (catMatch || filteredGroups.length > 0) {
        filtered[catKey] = {
          ...section,
          // If the category title matched, show all its original groups.
          // Otherwise, only show the groups that had matches.
          groups: catMatch ? section.groups : filteredGroups
        };
      }
    });

    return filtered;
  }, [menu, searchQuery, getLocalizedField]);

  const specialMenu = useMemo(() => {
    if (!menu) return {};

    const specialGroups = [];

    Object.entries(menu).forEach(([catKey, section]) => {
      const categoryLabel = getMenuCategoryLabel(section, catKey);

      (section.groups || []).forEach((group, groupIndex) => {
        const specialProducts = getProductList(group.products).filter(isSpecialProduct);

        if (specialProducts.length === 0) return;

        specialGroups.push({
          ...group,
          uid: group.uid ?? `${catKey}-${groupIndex}`,
          name: group.name || categoryLabel,
          translations: group.translations,
          products: specialProducts,
        });
      });
    });

    if (specialGroups.length === 0) return {};

    return {
      [SPECIAL_CATEGORY_KEY]: {
        uid: SPECIAL_CATEGORY_ID,
        name: { en: "Specials" },
        label: "Specials",
        sort: -1,
        groups: specialGroups,
      },
    };
  }, [menu]);

  const hasSpecialProducts = Object.keys(specialMenu).length > 0;

  const filteredMenu = useMemo(() => {
    if (activeCategory === SPECIAL_CATEGORY_ID) {
      if (!searchQuery.trim()) return specialMenu;

      const specialSearchResult = {};
      const specialSection = specialMenu[SPECIAL_CATEGORY_KEY];
      const searchedSection = searchFilteredMenu[SPECIAL_CATEGORY_KEY];

      if (searchedSection) {
        specialSearchResult[SPECIAL_CATEGORY_KEY] = searchedSection;
      } else if (specialSection) {
        const searchTokens = getSearchTokens(searchQuery);
        const groups = (specialSection.groups || []).map((group) => {
          const products = getProductList(group.products).filter((product) => {
            const productName = (
              getLocalizedField(product, 'translations') ||
              getLocalizedField(product, 'name') ||
              getDefaultLocalizedText(getLocalizedObject(product, "name"), product.name || product.default_name || "")
            );
            const productDescription = (
              getLocalizedField(product?.properties, 'details') ||
              getLocalizedField(product, 'details') ||
              product?.details?.description ||
              product?.description ||
              ""
            );
            const productGroupNames = Array.isArray(product?.all_product_groups)
              ? product.all_product_groups.join(" ")
              : product?.all_product_groups_label || product?.all_product_groups || "";

            return matchesSearchTokens(`${group.name || ""} ${productGroupNames} ${productName} ${productDescription}`, searchTokens);
          });

          return { ...group, products };
        }).filter((group) => getProductList(group.products).length > 0);

        if (groups.length > 0) {
          specialSearchResult[SPECIAL_CATEGORY_KEY] = { ...specialSection, groups };
        }
      }

      return specialSearchResult;
    }

    return searchFilteredMenu;
  }, [activeCategory, getLocalizedField, searchFilteredMenu, searchQuery, specialMenu]);

  // ── 2. DERIVE SORTED CATEGORIES FROM FILTERED MENU ─────────────
  // This keeps your CategoryNav and Scroll logic in sync with search results
  // Always derive this from the full 'menu' so the Nav Bar stays complete
  const sortedCategories = useMemo(() => {
    if (!menu) return [];
    const menuCategories = Object.entries(menu)
      .map(([key, section]) => ({
        id: getMenuCategoryUid(section, key),
        key: key, // Keep the key to match against filteredMenu later
        label: getMenuCategoryLabel(section, key),
        name: getMenuCategoryName(section, key),
        sort_order: section.sort ?? 0
      }))
      .sort((a, b) => a.sort_order - b.sort_order);

    if (!hasSpecialProducts) return menuCategories;

    return [
      ...menuCategories,
      {
        id: SPECIAL_CATEGORY_ID,
        key: SPECIAL_CATEGORY_KEY,
        label: "Specials",
        name: { en: "Specials" },
        sort_order: Number.MAX_SAFE_INTEGER,
      },
    ];
  }, [hasSpecialProducts, menu]); // Dependent on 'menu', not 'filteredMenu'

  const activeCategoryId = activeCategory || sortedCategories[0]?.id || "";

  const scrollCategories = useMemo(() => {
    if (activeCategory === SPECIAL_CATEGORY_ID) {
      return sortedCategories.filter((category) => category.id === SPECIAL_CATEGORY_ID);
    }

    return sortedCategories.filter((category) => category.id !== SPECIAL_CATEGORY_ID);
  }, [activeCategory, sortedCategories]);

  const activeSubcategories = useMemo(() => {
    if (!activeCategoryId) return [];

    const active = sortedCategories.find((category) => category.id === activeCategoryId);
    const sourceMenu = activeCategoryId === SPECIAL_CATEGORY_ID ? specialMenu : filteredMenu;
    const section = active ? sourceMenu[active.key] || menu?.[active.key] : null;

    return (section?.groups || [])
      .map((group, index) => {
        const id = String(group.uid ?? `${activeCategoryId}-${index}`);
        const label =
          getLocalizedField(group, "translations") ||
          getLocalizedField(group, "name") ||
          getDefaultLocalizedText(getLocalizedObject(group, "name"), group.name || "");

        return {
          id,
          label,
          sort_order: group.sort ?? index,
          category_id: activeCategoryId,
          product_count: getProductList(group.products).length,
        };
      })
      .filter((group) => group.product_count > 0 && group.label)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [activeCategoryId, filteredMenu, getLocalizedField, menu, sortedCategories, specialMenu]);

  useEffect(() => {
    const search = searchQuery.trim();

    if (activeCategory === SPECIAL_CATEGORY_ID) return;

    // SEARCH MODE
    if (search) {
      // Find the first category in our full list that actually has search results
      const firstMatch = sortedCategories.find((cat) => filteredMenu[cat.key]);

      if (firstMatch) {
        setActiveCategory((prev) => (prev === firstMatch.id ? prev : firstMatch.id));
        
        // Optional: Auto-scroll to the first match during search
        const section = sectionRefs.current[firstMatch.id];
        if (section) {
          const offset = 225;
          const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
      return;
    }

    // NORMAL SCROLL MODE (Logic remains the same)
    const handleScroll = () => {
      if (userClickedRef.current) return;

      const scrollBottom = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;

      if (scrollBottom >= pageHeight - 20) {
        const lastCategory = scrollCategories[scrollCategories.length - 1];
        if (lastCategory) setActiveCategory(lastCategory.id);
        return;
      }

      const offset = 225;
      let currentCategory = null;

      for (const category of scrollCategories) {
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

      if (!currentCategory && scrollCategories.length) {
        currentCategory = scrollCategories[0].id;
      }

      if (currentCategory) setActiveCategory(currentCategory);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    requestAnimationFrame(handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeCategory, scrollCategories, filteredMenu, searchQuery]); 
// Added filteredMenu as a dependency so it re-checks matches as the user types
  // Dependency is now just sortedCategories (which reacts to filteredMenu) and searchQuery
  const cartProducts = useMemo(() => {
    return products.flatMap((product) => {
      const priceOptions = getDisplayPrices(product);

      return [
        product,
        ...priceOptions.map((priceOption) => selectProductPrice(product, priceOption)),
      ];
    });
  }, [products]);

  const productMap = useMemo(() => {
    return Object.fromEntries(cartProducts.map((p) => [String(p.id), p]));
  }, [cartProducts]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = productMap[String(item.product_id)];
      const price = product?.price || 0;

      return sum + price * item.quantity;
    }, 0);
  }, [items, productMap]);

  const handleProductOpen = useCallback((product, cartItem = null) => {
    setSelectedProduct(product);
    setSelectedCartItem(cartItem);
  }, []);

  const handleProductModalClose = useCallback(() => {
    setSelectedProduct(null);
    setSelectedCartItem(null);
  }, []);

  // ── Click handler: scroll to section ─────────────────────────
  const handleCategorySelect = useCallback(
    (catId) => {
      const hasSearch = searchQuery?.trim()?.length > 0;

      if (hasSearch) {
        setSearchQuery("");
      }

      setActiveCategory(catId);
      userClickedRef.current = true;
      window.setTimeout(() => {
        userClickedRef.current = false;
      }, 700);

      let tries = 0;

      const tryScroll = () => {
        const section = sectionRefs.current[catId];

        if (!section && tries < 10) {
          tries++;
          requestAnimationFrame(tryScroll);
          return;
        }

        if (!section) {
          userClickedRef.current = false;
          return;
        }

        const offset = 225;
        const top =
          section.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
          top,
          behavior: "smooth",
        });

        let timeout;

        const onScroll = () => {
          clearTimeout(timeout);

          timeout = setTimeout(() => {
            userClickedRef.current = false;
            window.removeEventListener("scroll", onScroll);
          }, 100);
        };

        window.addEventListener("scroll", onScroll, {
          passive: true,
        });
      };

      // wait for React to flush search reset + re-render
      requestAnimationFrame(() => {
        requestAnimationFrame(tryScroll);
      });
    },
    [searchQuery]
  );

  const handleSubcategorySelect = useCallback(
    (subcategory) => {
      const hasSearch = searchQuery?.trim()?.length > 0;

      if (hasSearch) {
        setSearchQuery("");
      }

      if (subcategory.category_id) {
        setActiveCategory(subcategory.category_id);
      }

      userClickedRef.current = true;

      let tries = 0;

      const tryScroll = () => {
        const section = document.getElementById(`subcat-section-${subcategory.id}`);

        if (!section && tries < 10) {
          tries++;
          requestAnimationFrame(tryScroll);
          return;
        }

        if (!section) return;

        const offset = 255;
        const top =
          section.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
          top,
          behavior: "smooth",
        });

        window.setTimeout(() => {
          userClickedRef.current = false;
        }, 450);
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(tryScroll);
      });
    },
    [searchQuery]
  );

  useEffect(() => {
    if (categoryFocusHandledRef.current || !sortedCategories.length) return;

    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category") || sessionStorage.getItem("menuCategoryFocus");
    if (!requestedCategory) return;

    const normalizedCategory = requestedCategory.toLowerCase();
    const match = sortedCategories.find((category) =>
      String(category.id).toLowerCase() === normalizedCategory ||
      String(category.label || "").toLowerCase() === normalizedCategory
    );

    if (!match) return;

    categoryFocusHandledRef.current = true;
    sessionStorage.removeItem("menuCategoryFocus");
    setSearchQuery("");
    handleCategorySelect(match.id);
  }, [handleCategorySelect, sortedCategories]);

  return (
    <div className="min-h-screen bg-background">
      <Header products={products} setIsOpen={setIsOpen} />

      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-border/30">
        <CategoryNav
          categories={sortedCategories}
          activeCategory={activeCategoryId}
          onSelect={handleCategorySelect}
          subcategories={activeSubcategories}
          onSubcategorySelect={handleSubcategorySelect}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <ProductGrid
            menu={filteredMenu}
            onProductOpen={handleProductOpen}
            sectionRefs={sectionRefs}
          />
        )}
      </main>

      {selectedProduct && (
        <ProductModal
          open={isOpen} // Check if this should be `!!selectedProduct` rather than `isOpen` (cart state) based on your needs
          product={selectedProduct}
          onClose={handleProductModalClose}
          cart_id={selectedCartItem?.cart_id || ""}
          cartItem={selectedCartItem}
        />
      )}

      <CartDrawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        products={cartProducts}
        subtotal={subtotal}
        onProductOpen={handleProductOpen}
      />
      <FloatingCartButton subtotal={subtotal} onClick={() => setIsOpen(true)} />
      <ScrollButtons />
    </div>
  );
}

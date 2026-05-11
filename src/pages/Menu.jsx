import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  const clickTimeoutRef = useRef(null);

  const sectionRefs = useRef({});

  const { products, categories, loading, activeBranch } = useBranch();


  const sortedCategories = useMemo(() => {
    return categories
      .filter(c => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  // console.log(`CAT ${JSON.stringify(sortedCategories)}`);


  // const filteredProducts = useMemo(() => {

  //   return products.filter(p => {
  //     // ---- 1. Branch Match ----
  //     // Checks if no branch is selected, or if the product belongs to the active branch
  //     const matchBranch = !activeBranch ||
  //       !p.branch_ids?.length ||
  //       p.branch_ids.includes(activeBranch.id);

  //     // ---- 2. Category Normalization & Match ----
  //     let groupIds = [];
  //     try {
  //       groupIds = typeof p.category_id === "string"
  //         ? JSON.parse(p.category_id)
  //         : Array.isArray(p.category_id)
  //           ? p.category_id
  //           : [p.category_id]; // Fallback for single numbers
  //     } catch {
  //       groupIds = [];
  //     }

  //     // ---- 3. Search Match ----
  //     const search = searchQuery.toLowerCase();
  //     const name = getLocalizedField(p, "name")?.toLowerCase() || "";
  //     const description = getLocalizedField(p, "description")?.toLowerCase() || "";

  //     const matchSearch = !search ||
  //       name.includes(search) ||
  //       description.includes(search);

  //     // Only return true if all conditions pass
  //     return matchBranch && matchSearch;
  //   });
  // }, [products, activeBranch, activeCategory, searchQuery, getLocalizedField]);


  const groupedProducts = useMemo(() => {
    const groups = {};

    sortedCategories.forEach(category => {
      groups[category.id] = [];
    });

    products.forEach(product => {
      // Branch filter
      const matchBranch =
        !activeBranch ||
        !product.branch_ids?.length ||
        product.branch_ids.includes(activeBranch.id);

      if (!matchBranch) return;

      // Search filter
      const search = searchQuery.toLowerCase();

      const name =
        getLocalizedField(product, "name")?.toLowerCase() || "";

      const description =
        getLocalizedField(product, "description")?.toLowerCase() || "";

      const matchSearch =
        !search ||
        name.includes(search) ||
        description.includes(search);

      if (!matchSearch) return;

      // Normalize categories
      let categoryIds = [];

      try {
        categoryIds =
          typeof product.category_id === "string"
            ? JSON.parse(product.category_id)
            : Array.isArray(product.category_id)
              ? product.category_id
              : [product.category_id];
      } catch {
        categoryIds = [];
      }

      categoryIds.forEach(catId => {
        if (groups[catId]) {
          groups[catId].push(product);
        }
      });
    });

    return groups;
  }, [
    products,
    sortedCategories,
    activeBranch,
    searchQuery,
    getLocalizedField,
  ]);


  useEffect(() => {
    if (searchQuery) return;

    const handleScroll = () => {
      if (userClickedRef.current) return;

      // Detect bottom of page
      const scrollBottom =
        window.innerHeight + window.scrollY;

      const pageHeight =
        document.documentElement.scrollHeight;

      // If near bottom → activate last category
      if (scrollBottom >= pageHeight - 20) {
        const lastCategory =
          sortedCategories[
          sortedCategories.length - 1
          ];

        if (lastCategory) {
          setActiveCategory(prev =>
            prev === lastCategory.id
              ? prev
              : lastCategory.id
          );
        }

        return;
      }

      const offset = 200;

      let currentCategory = null;

      for (const category of sortedCategories) {
        const section =
          sectionRefs.current[category.id];

        if (!section) continue;

        const rect =
          section.getBoundingClientRect();

        // Section crossed sticky header
        if (rect.top <= offset) {
          currentCategory = category.id;
        }

        // First visible section fallback
        else if (
          !currentCategory &&
          rect.top > offset
        ) {
          currentCategory = category.id;
          break;
        }
      }

      // Final fallback
      if (
        !currentCategory &&
        sortedCategories.length
      ) {
        currentCategory =
          sortedCategories[0].id;
      }

      setActiveCategory(prev =>
        prev === currentCategory
          ? prev
          : currentCategory
      );
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    // Delay ensures refs are mounted
    requestAnimationFrame(handleScroll);

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [
    sortedCategories,
    groupedProducts,
    searchQuery,
  ]);


  const productMap = useMemo(() => {
    return Object.fromEntries(
      products.map(p => [String(p.id), p])
    );
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
    setActiveCategory(catId);

    userClickedRef.current = true;

    const section =
      sectionRefs.current[catId];

    if (!section) return;

    const offset = 200;

    const top =
      section.getBoundingClientRect().top +
      window.pageYOffset -
      offset;

    window.scrollTo({
      top,
      behavior: "smooth",
    });

    let timeout;

    const onScroll = () => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        userClickedRef.current = false;

        window.removeEventListener(
          "scroll",
          onScroll
        );
      }, 100);
    };

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );
  }, []);



  return (
    <div className="min-h-screen bg-background">
      <Header products={products} />
      {/* <CoverHero /> */}

      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <CategoryNav categories={sortedCategories} activeCategory={activeCategory} onSelect={handleCategorySelect} />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="space-y-3">
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
            products={groupedProducts}
            categories={sortedCategories}
            onProductOpen={setSelectedProduct}
            sectionRefs={sectionRefs}
          />
        )}
      </main>

      {selectedProduct && (
        <ProductModal
          open={isOpen}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CartDrawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        products={products}
        subtotal={subtotal}
      />
      <FloatingCartButton
        subtotal={subtotal}
        onClick={() => setIsOpen(true)}
      />
      <ScrollButtons />
    </div>
  );
}
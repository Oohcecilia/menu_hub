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
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  const groupedProducts = useMemo(() => {
    const groups = {};

    sortedCategories.forEach((category) => {
      groups[category.id] = [];
    });

    const search = searchQuery.toLowerCase().trim();

    products.forEach((product) => {
      const name =
        getLocalizedField(product, "name")?.toLowerCase() ||
        product.default_name?.toLowerCase() ||
        "";


      // Find category of product
      const category = sortedCategories.find(
        (c) => String(c.id) === String(product.category_id)
      );

      const categoryName =
        getLocalizedField(category, "name")?.toLowerCase() ||
        category?.default_name?.toLowerCase() ||
        "";

      const matchSearch =
        !search ||
        name.includes(search) ||
        categoryName.includes(search);

      if (!matchSearch) return;

      if (groups[product.category_id]) {
        groups[product.category_id].push(product);
      }
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
    // SEARCH MODE
    if (searchQuery) {
      const firstMatchedCategory = sortedCategories.find(
        (category) =>
          groupedProducts[category.id] &&
          groupedProducts[category.id].length > 0
      );

      if (firstMatchedCategory) {
        setActiveCategory((prev) =>
          prev === firstMatchedCategory.id
            ? prev
            : firstMatchedCategory.id
        );
      }

      return;
    }

    // NORMAL SCROLL MODE
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
          setActiveCategory((prev) =>
            prev === lastCategory.id
              ? prev
              : lastCategory.id
          );
        }

        return;
      }

      const offset = 225;

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

      setActiveCategory((prev) =>
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
    const hasSearch = searchQuery?.trim()?.length > 0;

    if (hasSearch) {
      setSearchQuery("");
    }

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
  }, [searchQuery]);


  return (
    <div className="min-h-screen bg-background">
      <Header products={products} />
      {/* <CoverHero /> */}

      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-border/30">
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
        onProductOpen={setSelectedProduct}
      />
      <FloatingCartButton
        subtotal={subtotal}
        onClick={() => setIsOpen(true)}
      />
      <ScrollButtons />
    </div>
  );
}
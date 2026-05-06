import { useState, useMemo, useEffect } from 'react';
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

  const [activeCategory, setActiveCategory] = useState("__all__");
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { products, categories, loading, activeBranch } = useBranch();

  const ALL = "__all__";

  // ✅ now categories come from backend
  const sortedCategories = useMemo(() => {
    return categories
      .filter(c => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);




  // const filteredProducts = useMemo(() => {
  //   const active =
  //     activeCategory === ALL ? ALL : Number(activeCategory);

  //   return products.filter(p => {
  //     // ---- normalize category ids ----
  //     let groupIds = [];

  //     try {
  //       groupIds =
  //         typeof p.category_id === "string"
  //           ? JSON.parse(p.category_id)
  //           : Array.isArray(p.category_id)
  //             ? p.category_id
  //             : [];
  //     } catch {
  //       groupIds = [];
  //     }

  //     const normalizedGroups = groupIds.map(Number);

  //     // ---- category match ----
  //     const matchCat =
  //       active === ALL ||
  //       normalizedGroups.includes(active);

  //     // ---- search match ----
  //     const search = searchQuery.toLowerCase();

  //     const matchSearch =
  //       !search ||
  //       getLocalizedField(p, "name")?.toLowerCase().includes(search) ||
  //       getLocalizedField(p, "description")?.toLowerCase().includes(search);

  //     return matchCat && matchSearch;
  //   });
  // }, [products, activeCategory, searchQuery, getLocalizedField]);


  const filteredProducts = useMemo(() => {
    // 1. Pre-process the active category to ensure numerical comparison
    const active = activeCategory === ALL ? ALL : Number(activeCategory);

    return products.filter(p => {
      // ---- 1. Branch Match ----
      // Checks if no branch is selected, or if the product belongs to the active branch
      const matchBranch = !activeBranch ||
        !p.branch_ids?.length ||
        p.branch_ids.includes(activeBranch.id);

      // ---- 2. Category Normalization & Match ----
      let groupIds = [];
      try {
        groupIds = typeof p.category_id === "string"
          ? JSON.parse(p.category_id)
          : Array.isArray(p.category_id)
            ? p.category_id
            : [p.category_id]; // Fallback for single numbers
      } catch {
        groupIds = [];
      }

      const normalizedGroups = groupIds.map(Number);
      const matchCat = active === ALL || normalizedGroups.includes(active);

      // ---- 3. Search Match ----
      const search = searchQuery.toLowerCase();
      const name = getLocalizedField(p, "name")?.toLowerCase() || "";
      const description = getLocalizedField(p, "description")?.toLowerCase() || "";

      const matchSearch = !search ||
        name.includes(search) ||
        description.includes(search);

      // Only return true if all conditions pass
      return matchBranch && matchCat && matchSearch;
    });
  }, [products, activeBranch, activeCategory, searchQuery, getLocalizedField]);


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



  return (
    <div className="min-h-screen bg-background">
      <Header products={products} />
      {/* <CoverHero /> */}

      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <CategoryNav
          categories={sortedCategories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-28">
        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
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
          <ProductGrid products={filteredProducts} activeCategory={activeCategory} categories={sortedCategories} onProductOpen={setSelectedProduct} />
        )}
      </main>

      {selectedProduct && (
        <ProductModal
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
import React from 'react';
import { motion } from 'framer-motion';
import FeaturedSection from './FeaturedSection.jsx';
import ProductCard from './ProductCard.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useCart } from '@/lib/cartStore.jsx';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext.jsx';
import { getCategoryIcon } from '@/utils/icons';
import { useLocation } from 'react-router-dom'


const map = {
  1: "py-1",
  2: "py-2",
  3: "py-3",
  4: "py-4",
  5: "py-5",
  6: "py-6",
  8: "py-8",
  10: "py-10",
};


function getCategoryIds(category_id) {
  let ids = [];

  if (Array.isArray(category_id)) {
    ids = category_id;
  } else if (typeof category_id === "string") {
    try {
      const parsed = JSON.parse(category_id);
      ids = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      ids = [category_id];
    }
  } else if (category_id != null) {
    ids = [category_id];
  }

  // normalize everything to string
  return ids.map(String);
}

function hasCategory(product, categoryId) {
  return getCategoryIds(product.category_id).includes(String(categoryId));
}

function SpaceY({ y = 4 }) {
  return <div className={map[y] || "py-4"} />;
}

function ListBanner() {
  return (
    <div className="flex items-center">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/50" />
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/50" />
    </div>
  );
}

function ListSpace({ spacing = 2 }) {
  return (
    <div className={`flex items-center ${map[spacing]} gap-3`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />

      <div className="flex items-center justify-center shrink-0">
        <span className="flex items-center font-xl gap-1 text-primary">
          <span>&#10171;</span>
          <span className="inline-block scale-x-[-1]">
            &#10171;
          </span>
        </span>
      </div>

      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
    </div>
  );
}



function CategoryBanner({ category, icon: Icon }) {

  const { getLocalizedField } = useLanguage();

  return (
    <div className="flex items-center justify-center gap-5 mt-24 mb-4">

      <span
        className="
            flex items-center gap-4
            font-serif font-bold capitalize
            tracking-[0.15em]
            text-primary
            text-3xl sm:text-3xl lg:text-4xl
          "
      >
        {/* {Icon && (
          <Icon
            size={28}
            className="text-current shrink-0 lg:w-7 lg:h-7"
          />
        )} */}

        {category?.name || ''}
      </span>
    </div>
  );
}

/* ─── Text list item (no-image products) ──*/
function TextListItem({ product, onOpen, delay = 0 }) {
  const { getLocalizedField } = useLanguage();
  const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
  const qty = getProductQuantity(product.id);
  const name = getLocalizedField(product?.properties, 'name') || product.name;
  const desc = getLocalizedField(product?.properties, 'details');
  const location = useLocation();

  const handleMinus = (e) => {
    e.stopPropagation();
    const cartItems = items.filter(i => i.product_id === product.id);
    if (!cartItems.length) return;
    const last = cartItems[cartItems.length - 1];
    const lastIndex = items.findIndex(i => i === last);
    last.quantity > 1 ? updateQuantity(lastIndex, last.quantity - 1) : removeItem(lastIndex);
  };
  const handlePlus = (e) => { e.stopPropagation(); addItem(product, 1); };

  return (
    <motion.div
      onClick={() => onOpen(product)}
      className="
      w-full
      grid grid-cols-1 sm:grid-cols-[1fr_auto]
      gap-3 sm:gap-4
      items-start sm:items-center
      px-4 py-4
      cursor-pointer
      group
      hover:bg-primary/[0.025]
      transition-colors duration-300
    "
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left: Name + Description */}
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">

          {/* Left Content */}
          <div className="min-w-0 flex items-start gap-2">

            {/* Product Name */}
            <p className="font-serif capitalize font-medium leading-snug line-clamp-2 text-foreground group-hover:text-foreground/75 transition-colors duration-300 break-words">
              {name}

              {location.pathname.startsWith("/debug") && (
                <span className="text-muted-foreground">
                  {" "} - {product.id}
                </span>
              )}
            </p>


            {qty > 0 && (
              <div
                className=" flex-shrink-0 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
                {qty}
              </div>
            )}
          </div>

          {/* Price */}
          <span
            className="
        text-primary font-light tracking-widest
        text-base whitespace-nowrap flex-shrink-0
      "
          >
            {product.price}
          </span>
        </div>

        {/* Description */}
        {desc && (
          <p
            className=" font-sans
        text-sm text-muted-foreground
        mt-1 line-clamp-2
        leading-relaxed font-light
      "
          >
            {desc}
          </p>
        )}
      </div>


    </motion.div>
  );
}

/* ─── 2-col on sm+, 1-col on mobile, last lone item centered ─── */
function TextList({ products, onProductOpen }) {
  const isOdd = products.length % 2 !== 0;

  return (
    <div className="rounded-lg  overflow-hidden ">
      {/* Mobile: single column, all items stacked */}
      <ListBanner />
      <div className="sm:hidden  divide-y divide-border/25 ">
        {products.map((p, i) => (
          <TextListItem key={p.id} product={p} onOpen={onProductOpen} delay={i * 0.04} />
        ))}
      </div>

      {/* sm+: 2-col rows with vertical divider, last lone item centered */}
      <div className="hidden sm:block">
        {Array.from({ length: Math.ceil(products.length / 2) }, (_, rowIdx) => {
          const a = products[rowIdx * 2];
          const b = products[rowIdx * 2 + 1];
          const isSingle = !b;

          return (
            <div
              key={rowIdx}
              className="flex"
            >
              {isSingle ? (
                <div className="w-1/2 mx-auto">
                  {products.length > 1 && <ListSpace spacing={2} />}
                  <TextListItem product={a} onOpen={onProductOpen} delay={rowIdx * 2 * 0.04} />
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0 flex justify-center">
                    <TextListItem product={a} onOpen={onProductOpen} delay={rowIdx * 2 * 0.04} />
                  </div>
                  <div className="w-px bg-primary/20 flex-shrink-0 my-3" />
                  <div className="flex-1 min-w-0 flex justify-center">
                    <TextListItem product={b} onOpen={onProductOpen} delay={(rowIdx * 2 + 1) * 0.04} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <ListBanner />
    </div>
  );
}

/* ─── Renders one category section ───────────────────────────── */
function CategorySection({ products, onProductOpen }) {

  const withImage = products.filter(
    p =>
      (p.image?.length ?? 0) > 0 && (p.website_picture)
  );
  const activeCategory = '';

  return (
    <div className="space-y-5">
      {withImage.length > 0 && (
        <FeaturedSection
          products={withImage}
          activeCategory={activeCategory}
          onProductOpen={onProductOpen}
        />
      )}
      {products.length > 0 && (
        <TextList products={products} onProductOpen={onProductOpen} />
      )}
    </div>
  );
}








export default function ProductGrid({
  menu,
  onProductOpen,
  sectionRefs,
}) {
  const { t, getLocalizedField } = useLanguage();
  const { activeBranch } = useBranch();
  const noImage = activeBranch?.no_image;

  // Check if menu has any data
  const hasContent = menu && Object.keys(menu).length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center">
        <img
          src={noImage}
          alt="no-image"
          className="h-10 w-10 opacity-60 dark:opacity-20"
        />
        <p className="text-base font-medium tracking-wide mt-3">
          {t("noResults")}
        </p>
      </div>
    );
  }

  // Sort the top-level categories by their 'sort' property
  const sortedCategories = Object.entries(menu).sort(
    ([, a], [, b]) => (a.sort || 0) - (b.sort || 0)
  );

  return (
    <div className="space-y-12">
      {sortedCategories.map(([key, section]) => {
        const catId = String(section.uid || key);
        
        // Get icon based on category name
        const cNameEn = section.properties?.name?.en || section.name || key;
        const icon = getCategoryIcon(cNameEn);

        // A category is visible if it has groups with products
        const groups = section.groups || [];
        const hasVisibleProducts = groups.some(
          (group) => group.products && group.products.length > 0
        );

        if (!hasVisibleProducts) return null;

        return (
          <section
            key={catId}
            ref={(el) => {
              if (el) sectionRefs.current[catId] = el;
            }}
            data-category={catId}
            id={`cat-section-${catId}`}
          >
            {/* 1. The Main Category Header */}
            <CategoryBanner 
              category={{ 
                id: catId, 
                name: section.name || { en: section.name || key } 
              }} 
              icon={icon} 
            />

            {/* 2. Iterate through Groups (Subcategories) */}
            {groups.map((group) => {
              const subProducts = (group.products || []).map(p => ({
                ...p,
                id: String(p.uid), // Ensure ID is a string for the components
                price: parseFloat(p.price) || 0
              }));

              if (subProducts.length === 0) return null;

              const subName = getLocalizedField(group?.properties, "name") || group.name;
              
              // Hide subcategory title if it's identical to the main category name
              const shouldShowSubTitle = 
                subName && 
                subName.trim().toLowerCase() !== cNameEn.trim().toLowerCase();


              return (
                <div key={group.uid} className="mt-6">
                  {shouldShowSubTitle && (
                    <h4 className="w-full text-center font-serif font-semibold my-2 text-primary px-2 py-1 rounded capitalize text-1xl sm:text-1xl lg:text-2xl">
                      {subName}
                    </h4>
                  )}

                  {/* 3. Render the products for this subcategory */}
                  <CategorySection
                    products={subProducts}
                    onProductOpen={onProductOpen}
                  />
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import FeaturedSection from './FeaturedSection.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useCart } from '@/lib/cartStore.jsx';
import { useBranch } from '@/lib/BranchContext.jsx';
import { useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react';
import { getDefaultLocalizedText, getLocalizedObject, getMenuCategoryLabel, getMenuCategoryUid, getMenuProductTitle, getProductList, isSpecialProduct, isVegetarianProduct, normalizeProduct } from '@/utils/menuData';
import PriceOptions from './PriceOptions.jsx';


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

function hasProductImage(product) {
  const hasWebsitePictureFlag =
    product?.website_picture === 1 ||
    product?.website_picture === true ||
    product?.website_picture === "1" ||
    product?.picture === 1 ||
    product?.picture === true ||
    product?.picture === "1";

  return (
    typeof product?.image === "string" &&
    product.image.trim().length > 0 &&
    hasWebsitePictureFlag
  );
}

function SpecialBadge() {
  return (
    <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full bg-red-600 px-2 py-0.5 align-middle text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-sm">
      special
    </span>
  );
}

function VegetarianLeaf() {
  return (
    <Leaf className="ml-1.5 inline-block h-4 w-4 translate-y-[-1px] fill-green-500/20 text-green-600" aria-label="Vegetarian" />
  );
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

function getSortPrice(product) {
  const prices = Array.isArray(product?.price_options) && product.price_options.length > 0
    ? product.price_options
    : Array.isArray(product?.prices)
      ? product.prices
      : [];

  const numericPrices = prices
    .map((price) => Number(price?.price))
    .filter((price) => Number.isFinite(price));

  if (numericPrices.length > 0) {
    return Math.min(...numericPrices);
  }

  const fallback = Number(product?.price);
  return Number.isFinite(fallback) ? fallback : Number.MAX_SAFE_INTEGER;
}

function sortProductsByPrice(products) {
  return [...products].sort((a, b) => {
    const priceDiff = getSortPrice(a) - getSortPrice(b);
    if (priceDiff !== 0) return priceDiff;

    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });
}



function CategoryBanner({ category }) {

  const { getLocalizedField } = useLanguage();
  const label = getLocalizedField(category, "name") || category?.label || category?.name || "";

  return (
    <div className="flex items-center justify-center gap-5 mt-24 mb-4">

      <span
        className="
            flex items-center gap-4
            font-serif font-bold capitalize
            tracking-[0.15em]
            text-primary
            bg-transparent
            text-3xl sm:text-3xl lg:text-4xl
          "
      >
        {label}
      </span>
    </div>
  );
}

function ProductTextThumbnail({ product, name }) {
  if (!hasProductImage(product)) return null;

  return (
    <div className="relative z-10 mt-0.5 flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-transparent sm:ml-3 sm:h-[4.5rem] sm:w-[4.5rem] sm:overflow-visible sm:hover:z-50">
      <img
        src={product.image}
        alt={name}
        className="relative z-10 max-h-full max-w-full origin-left object-contain transition-transform duration-300 ease-out sm:hover:scale-[6] sm:hover:drop-shadow-2xl"
        loading="lazy"
      />
    </div>
  );
}

/* ─── Text list item ──*/
function TextListItem({ product, onOpen, delay = 0 }) {
  const { getLocalizedField } = useLanguage();
  const { getProductQuantity, addItem, items, updateQuantity, removeItem, itemMatchesProduct } = useCart();
  const qty = getProductQuantity(product);
  const name = getMenuProductTitle(product, getLocalizedField);
  const desc =
    getLocalizedField(product?.properties, 'details') ||
    getLocalizedField(product, 'details') ||
    getDefaultLocalizedText(product?.details?.description, "");
  const location = useLocation();

  const handleMinus = (e) => {
    e.stopPropagation();
    const cartItems = items.filter(i => itemMatchesProduct(i, product));
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
      flex
      items-start
      gap-3
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
      <ProductTextThumbnail product={product} name={name} />

      {/* Left: Name + Description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">

          {/* Left Content */}
          <div className="min-w-0 flex items-start gap-2">

            {/* Product Name */}
            <p className="font-serif capitalize font-medium leading-snug line-clamp-2 text-foreground group-hover:text-foreground/75 transition-colors duration-300 break-words">
              {name}
              {isVegetarianProduct(product) && <VegetarianLeaf />}
              {isSpecialProduct(product) && <SpecialBadge />}

              {location.pathname.startsWith("/debug") && (
                <span className="text-muted-foreground">
                  {" "} - {product.id}
                </span>
              )}
            </p>
            {qty > 0 && (
              <span className="mt-0.5 inline-flex min-w-5 h-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-semibold leading-none text-white shadow-sm">
                {qty}
              </span>
            )}
          </div>

          <PriceOptions product={product} className="flex-shrink-0 max-w-[45%]" />
        </div>

        {/* Description */}
        {desc && (
          <p
            className=" font-sans
        text-sm text-muted-foreground
        mt-1
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

/* ─── 2-col on sm+, 1-col on mobile ─── */
function TextList({ products, onProductOpen }) {
  const sortedProducts = sortProductsByPrice(products);
  const leftCount = Math.ceil(sortedProducts.length / 2);
  const leftProducts = sortedProducts.slice(0, leftCount);
  const rightProducts = sortedProducts.slice(leftCount);

  return (
    <div className="rounded-lg overflow-visible">
      {/* Mobile: single column, all items stacked */}
      <ListBanner />
      <div className="sm:hidden  divide-y divide-border/25 ">
        {sortedProducts.map((p, i) => (
          <TextListItem key={p.id} product={p} onOpen={onProductOpen} delay={i * 0.04} />
        ))}
      </div>

      {/* sm+: sorted by price, then continued into the right column */}
      <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
        <div className="min-w-0">
          {leftProducts.map((p, i) => (
            <TextListItem key={p.id} product={p} onOpen={onProductOpen} delay={i * 0.04} />
          ))}
        </div>
        <div className="my-3 bg-primary/20" />
        <div className="min-w-0">
          {rightProducts.map((p, i) => (
            <TextListItem key={p.id} product={p} onOpen={onProductOpen} delay={(leftCount + i) * 0.04} />
          ))}
        </div>
      </div>
      <ListBanner />
    </div>
  );
}

/* ─── Renders one category section ───────────────────────────── */
function CategorySection({ products, onProductOpen }) {

  const withImage = products.filter(hasProductImage);
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
        const catId = getMenuCategoryUid(section, key);
        const categoryLabel = getMenuCategoryLabel(section, key);
        
        // A category is visible if it has groups with products
        const groups = section.groups || [];
        const hasVisibleProducts = groups.some(
          (group) => getProductList(group.products).length > 0
        );

        if (!hasVisibleProducts) return null;

        return (
          <section
            key={catId}
            ref={(el) => {
              if (el) {
                sectionRefs.current[catId] = el;
              } else {
                delete sectionRefs.current[catId];
              }
            }}
            data-category={catId}
            id={`cat-section-${catId}`}
          >
            {/* 1. The Main Category Header */}
            <CategoryBanner 
              category={{ 
                id: catId, 
                label: categoryLabel,
                name: getLocalizedObject(section, "name") || { en: categoryLabel },
              }}
            />

            {/* 2. Iterate through Groups (Subcategories) */}
            {groups.map((group, groupIndex) => {
              const subcategoryId = String(group.uid ?? `${catId}-${groupIndex}`);
              const subProducts = getProductList(group.products).flatMap((p, productIndex) =>
                normalizeProduct(p, `${subcategoryId}-${productIndex}`)
              );

              if (subProducts.length === 0) return null;

              const subName =
                getLocalizedField(group, "translations") ||
                getLocalizedField(group, "name") ||
                getDefaultLocalizedText(getLocalizedObject(group, "name"), group.name);
              const categoryName =
                getLocalizedField(section, "translations") ||
                getLocalizedField(section, "name") ||
                categoryLabel;
              
              // Hide subcategory title if it's identical to the main category name
              const shouldShowSubTitle = 
                subName && 
                subName.trim().toLowerCase() !== String(categoryName).trim().toLowerCase();


              return (
                <div
                  key={subcategoryId}
                  id={`subcat-section-${subcategoryId}`}
                  data-subcategory={subcategoryId}
                  className="mt-6 scroll-mt-56 bg-transparent"
                >
                  {shouldShowSubTitle && (
                    <h4 className="w-full bg-transparent text-center font-serif font-semibold my-2 text-primary capitalize text-1xl sm:text-1xl lg:text-2xl">
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

import React from 'react';
import { motion } from 'framer-motion';
import FeaturedSection from './FeaturedSection.jsx';
import ProductCard from './ProductCard.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useCart } from '@/lib/cartStore.jsx';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext.jsx';
// import { json } from 'node:stream/consumers';



/* ─── Category header divider ─────────────────────────────────── */
function CategoryBanner({ icon, label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
      <span className="text-md font-serif font-bold uppercase tracking-[0.35em] text-foreground/50 text-primary">
        {icon && <span className="mr-1">{icon}</span>}{label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
    </div>
  );
}

function EndBanner() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
      <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">
        ✦ ✦ ✦
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
    </div>
  );
}

export function getCategoryIds(category_id) {
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

export function hasCategory(product, categoryId) {
  return getCategoryIds(product.category_id).includes(String(categoryId));
}


function TextListItem({ product, onOpen }) {
  const { getLocalizedField } = useLanguage();
  const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();

  const qty = getProductQuantity(product.id);
  const name = getLocalizedField(product, 'name');
  const desc = getLocalizedField(product, 'description');

  const handleMinus = (e) => {
    e.stopPropagation();
    const cartItems = items.filter(i => i.product_id === product.id);
    if (!cartItems.length) return;
    const last = cartItems[cartItems.length - 1];
    const lastIndex = items.findIndex(i => i === last);
    last.quantity > 1 ? updateQuantity(lastIndex, last.quantity - 1) : removeItem(lastIndex);
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    addItem(product, 1);
  };

  // return (
  //   <motion.div
  //     onClick={() => onOpen(product)}
  //     initial={{ opacity: 0, y: 15 }}
  //     animate={{ opacity: 1, y: 0 }}
  //     whileHover={{ y: -5 }}
  //     className="group relative flex flex-row items-center gap-4 p-5 rounded-3xl cursor-pointer
  //                bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]
  //                dark:bg-zinc-900/40 dark:border-zinc-800/50 dark:backdrop-blur-md
  //                transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]
  //                dark:hover:bg-zinc-800/60 dark:hover:border-primary/20"
  //   >
  //     {/* Left Decoration (High-end Detail) */}
  //     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-transparent group-hover:bg-primary transition-all duration-300" />

  //     <div className="flex-1 min-w-0">
  //       {/* Header: Name and Price */}
  //       <div className="flex justify-between items-baseline gap-3 mb-1">
  //         <h3 className="font-serif text-[16px] font-medium leading-tight tracking-tight text-slate-900 dark:text-zinc-100 truncate">
  //           {name}
  //         </h3>
  //         <div className="flex-shrink-0">
  //           <span className="text-[15px] font-semibold text-primary tracking-tight">
  //             {product.price?.toFixed(2)}
  //           </span>
  //         </div>
  //       </div>

  //       {/* Description */}
  //       {desc && (
  //         <p className="text-[12.5px] leading-relaxed text-slate-500 dark:text-zinc-400 line-clamp-1 group-hover:line-clamp-none transition-all duration-300 italic opacity-80">
  //           {desc}
  //         </p>
  //       )}
  //     </div>

  //     {/* Right Side: Action Area */}
  //     <div className="flex-shrink-0 ml-2">
  //       {qty === 0 ? (
  //         <button
  //           onClick={handlePlus}
  //           className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95"
  //         >
  //           <Plus className="h-3 w-3" />
  //         </button>
  //       ) : (
  //         <div className="flex items-center gap-1">
  //           <button onClick={handleMinus} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
  //             <Minus className="h-3 w-3" />
  //           </button>
  //           <span className="text-sm font-bold w-4 text-center">{qty}</span>
  //           <button onClick={handlePlus} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
  //             <Plus className="h-3 w-3" />
  //           </button>
  //         </div>
  //       )}
  //     </div>
  //   </motion.div>
  // );
  return (
    <motion.div
      onClick={() => onOpen(product)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="
      relative flex items-center gap-3 p-4 cursor-pointer
      bg-white dark:bg-zinc-900/40
      border-b border-r border-slate-200/60 dark:border-zinc-800/60
      active:bg-slate-50 dark:active:bg-zinc-800/40
      transition-colors
    "
    >
      {/* subtle luxury accent line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-40" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + Price */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="
          text-[14px] font-medium tracking-tight
          text-slate-900 dark:text-zinc-100
          leading-snug line-clamp-2
        ">
            {name}
          </h3>

          <span className="
          text-[13px] font-semibold text-primary
          whitespace-nowrap
        ">
            {product.price?.toFixed(2)}
          </span>
        </div>

        {/* Description */}
        {desc && (
          <p className="
          text-[11.5px] text-slate-500 dark:text-zinc-400
          mt-1 line-clamp-1
        ">
            {desc}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0">
        {qty === 0 ? (
          <button
            onClick={handlePlus}
            className="
            h-7 w-7 rounded-full
            bg-primary text-white
            flex items-center justify-center
            active:scale-90
          "
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleMinus}
              className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="text-[13px] font-semibold w-4 text-center">
              {qty}
            </span>

            <button
              onClick={handlePlus}
              className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Text-only list row for products without images ──────────── */
// function TextListItem({ product, onOpen }) {
//   const { getLocalizedField } = useLanguage();
//   const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
//   const qty = getProductQuantity(product.id);
//   const name = getLocalizedField(product, 'name');
//   const desc = getLocalizedField(product, 'description');

//   const handleMinus = (e) => {
//     e.stopPropagation();
//     const cartItems = items.filter(i => i.product_id === product.id);
//     if (!cartItems.length) return;
//     const last = cartItems[cartItems.length - 1];
//     const lastIndex = items.findIndex(i => i === last);
//     last.quantity > 1 ? updateQuantity(lastIndex, last.quantity - 1) : removeItem(lastIndex);
//   };
//   const handlePlus = (e) => { e.stopPropagation(); addItem(product, 1); };

//   return (
//     <motion.div
//       onClick={() => onOpen(product)}
//       className="flex items-center justify-between gap-3 py-3 px-1 border-b border-border/40 cursor-pointer hover:bg-muted/30 rounded-lg px-2 transition-colors"
//       initial={{ opacity: 0, x: -8 }}
//       animate={{ opacity: 1, x: 0 }}
//     >
//       <div className="flex-1 min-w-0">
//         <p className="font-medium text-sm leading-tight">{name}</p>
//         {desc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{desc}</p>}
//       </div>
//       <div className="flex items-center gap-2 flex-shrink-0">
//         <span className="font-bold text-primary text-sm">${product.price?.toFixed(2)}</span>
// {qty === 0 ? (
//   <button
//     onClick={handlePlus}
//     className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95"
//   >
//     <Plus className="h-3 w-3" />
//   </button>
// ) : (
//   <div className="flex items-center gap-1">
//     <button onClick={handleMinus} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
//       <Minus className="h-3 w-3" />
//     </button>
//     <span className="text-sm font-bold w-4 text-center">{qty}</span>
//     <button onClick={handlePlus} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
//       <Plus className="h-3 w-3" />
//     </button>
//   </div>
// )}
//       </div>
//     </motion.div>
//   );
// }

/* ─── Renders one category section ───────────────────────────── */
function CategorySection({ products, onProductOpen, catDelay = 0 }) {

  console.log(JSON.stringify(products));
  const withImage = products.filter(
    p =>
      (p.image?.length ?? 0) > 0 && (p.website_picture)
  );
  const withoutImage = products.filter(p => !p.image.length);
  const activeCategory = '';

  return (
    <div className="space-y-3">
      {withImage.length > 0 && (
        <FeaturedSection
          products={withImage}
          activeCategory={activeCategory}
          onProductOpen={onProductOpen}
        />
      )}
      {products.length > 0 && (
        <div className="grid grid-cols-2 border-t border-l border-slate-200/60 dark:border-zinc-800/60 rounded-md overflow-hidden">
          {products.map((product, index) => {
            const isLast = index === products.length - 1;
            const isOdd = products.length % 2 !== 0;

            return (
              <div
                key={product.id}
                className={`
            ${isOdd && isLast ? "col-span-2" : ""}
          `}
              >
                <TextListItem
                  product={product}
                  onOpen={onProductOpen}
                  centered={isOdd && isLast} // pass this down
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────── */
export default function ProductGrid({ products, activeCategory, categories = [], onProductOpen }) {
  const { t, getLocalizedField } = useLanguage();

  if (products.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p className="text-5xl mb-4">🍽️</p>
        <p className="text-sm font-medium tracking-wide">{t('noResults')}</p>
      </div>
    );
  }

  const showGrouped = activeCategory == "__all__" && categories.length > 0;

  if (showGrouped) {
    return (
      <div className="space-y-10">
        {categories.map((cat, ci) => {

          const catProducts = products.filter(p => hasCategory(p, cat.id));

          const catName = cat.name?.en;

          if (catProducts.length === 0) return null;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: ci * 0.05 }}
            >
              <CategoryBanner icon={cat.icon} label={catName} />
              <CategorySection products={catProducts} onProductOpen={onProductOpen} catDelay={ci * 2} />
              <EndBanner />
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Single filtered category view
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <CategorySection products={products} onProductOpen={onProductOpen} />
    </motion.div>
  );
}

















// /* ─── Category header divider ─────────────────────────────────── */
// function CategoryBanner({ icon, label }) {
//   return (
//     <div className="flex items-center gap-3 mb-4">
//       <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
//       <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-foreground/50">
//         {icon && <span className="mr-1">{icon}</span>}✦ {label}
//       </span>
//       <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
//     </div>
//   );
// }

// /* ─── Text-only list row for products without images ──────────── */
// function TextListItem({ product, onOpen }) {
//   const { getLocalizedField } = useLanguage();
//   const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
//   const qty = getProductQuantity(product.id);
//   const name = getLocalizedField(product, 'name');
//   const desc = getLocalizedField(product, 'description');

//   const handleMinus = (e) => {
//     e.stopPropagation();
//     const cartItems = items.filter(i => i.product_id === product.id);
//     if (!cartItems.length) return;
//     const last = cartItems[cartItems.length - 1];
//     const lastIndex = items.findIndex(i => i === last);
//     last.quantity > 1 ? updateQuantity(lastIndex, last.quantity - 1) : removeItem(lastIndex);
//   };
//   const handlePlus = (e) => { e.stopPropagation(); addItem(product, 1); };

//   return (
//     <motion.div
//       onClick={() => onOpen(product)}
//       className="flex items-center justify-between gap-3 py-3 px-1 border-b border-border/40 cursor-pointer hover:bg-muted/30 rounded-lg px-2 transition-colors"
//       initial={{ opacity: 0, x: -8 }}
//       animate={{ opacity: 1, x: 0 }}
//     >
//       <div className="flex-1 min-w-0">
//         <p className="font-medium text-sm leading-tight">{name}</p>
//         {desc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{desc}</p>}
//       </div>
//       <div className="flex items-center gap-2 flex-shrink-0">
//         <span className="font-bold text-primary text-sm">${product.price?.toFixed(2)}</span>
//         {qty === 0 ? (
//           <button
//             onClick={handlePlus}
//             className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95"
//           >
//             <Plus className="h-3 w-3" />
//           </button>
//         ) : (
//           <div className="flex items-center gap-1">
//             <button onClick={handleMinus} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
//               <Minus className="h-3 w-3" />
//             </button>
//             <span className="text-sm font-bold w-4 text-center">{qty}</span>
//             <button onClick={handlePlus} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
//               <Plus className="h-3 w-3" />
//             </button>
//           </div>
//         )}
//       </div>
//     </motion.div>
//   );
// }

// /* ─── Renders one category section ───────────────────────────── */
// function CategorySection({ products, onProductOpen, catDelay = 0 }) {

//   const isFeatured = (product) => product.image;
//   const withImage = products.filter(isFeatured);
//   // const withImage = products.filter(p => p.images?.length > 0);
//   const withoutImage = products.filter(p => !p.images?.length);

//   return (
//     <div className="space-y-3">
//       {withImage.length > 0 && (
//         <div className="grid grid-cols-2 gap-3">
//           {withImage.map((product, i) => (
//             <motion.div
//               key={product.id}
//               initial={{ opacity: 0, y: 12 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: (catDelay + i) * 0.04, duration: 0.3 }}
//             >
//               <ProductCard product={product} onOpen={onProductOpen} />
//             </motion.div>
//           ))}
//         </div>
//       )}
//       {withoutImage.length > 0 && (
//         <div className="mt-1">
//           {withoutImage.map((product) => (
//             <TextListItem key={product.id} product={product} onOpen={onProductOpen} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ─── Main export ─────────────────────────────────────────────── */
// export default function ProductGrid({ products, activeCategory, categories = [], onProductOpen }) {
//   const { t, getLocalizedField } = useLanguage();

//   if (products.length === 0) {
//     return (
//       <div className="text-center py-24 text-muted-foreground">
//         <p className="text-5xl mb-4">🍽️</p>
//         <p className="text-sm font-medium tracking-wide">{t('noResults')}</p>
//       </div>
//     );
//   }

//   const showGrouped = !activeCategory && categories.length > 0;

//   if (showGrouped) {
//     return (
//       <div className="space-y-10">
//         {categories.map((cat, ci) => {
//           const catProducts = products.filter(p => p.category_id === cat.id);
//           if (catProducts.length === 0) return null;
//           return (
//             <motion.div
//               key={cat.id}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ duration: 0.4, delay: ci * 0.05 }}
//             >
//               <CategoryBanner icon={cat.icon} label={getLocalizedField(cat, 'name')} />
//               <CategorySection products={catProducts} onProductOpen={onProductOpen} catDelay={ci * 2} />
//             </motion.div>
//           );
//         })}
//       </div>
//     );
//   }

//   // Single filtered category view
//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
//       <CategorySection products={products} onProductOpen={onProductOpen} />
//     </motion.div>
//   );
// }


import React from 'react';
import { motion } from 'framer-motion';
import FeaturedSection from './FeaturedSection.jsx';
import ProductCard from './ProductCard.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useCart } from '@/lib/cartStore.jsx';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext.jsx';
import { getCategoryIcon } from '@/utils/icons';


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

function ListBanner({ spacing = 2, start = false }) {

  return (
    <div className={`flex items-center ${map[spacing]} gap-3`}>
      <span className="text-lg text-primary">
        &#10171;
      </span>

      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />

      <div className="flex items-center justify-center shrink-0">
        <span className="flex items-center gap-1 text-primary text-xl">
          <span>&#10171;</span>

          {start ? (
            <span className='text-2xl'>&#9737;</span>
          ) : (
            <span className='text-md'>&#9737;</span>
          )}

          <span className="inline-block scale-x-[-1] ">
            &#10171;
          </span>
        </span>
      </div>

      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />

      <span className="text-lg inline-block scale-x-[-1] text-primary">
        &#10171;
      </span>
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

function EndBanner() {
  return (
    <div className="flex items-center pt-8 gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
      <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">
        ✦ ✦ ✦
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
    </div>
  );
}


function CategoryBanner({ icon: Icon, label }) {

  return (
    <div className="flex items-center justify-center gap-5 mt-24 mb-4">

      {/* <span className="text-primary text-2xl" >&#10170;</span> */}
      <span className="flex items-center gap-4 text-2xl font-serif font-bold uppercase tracking-[0.15em] text-primary">
        {Icon && <Icon size={24} className="text-current" />}
        {label}
      </span>
      {/* <span className="inline-block scale-x-[-1] text-2xl text-primary " >&#10170;</span> */}
    </div>
  );
}

/* ─── Text list item (no-image products) ──────────────────────── */
function TextListItem({ product, onOpen, delay = 0 }) {
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
        <p className="font-serif uppercase font-medium  leading-snug line-clamp-2 text-foreground group-hover:text-foreground/75 transition-colors duration-300">
          {name}
        </p>

        {desc && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-light">
            {desc}
          </p>
        )}
      </div>

      {/* Right: Price + Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:min-w-[110px]">
        <span className="text-primary font-light tracking-widest text-base whitespace-nowrap">
          {product.price?.toFixed(2)}
        </span>

        <div onClick={(e) => e.stopPropagation()}>
          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handlePlus}
              className="
              h-6 w-6 rounded-full
              border border-primary/35
              text-primary
              flex items-center justify-center
              hover:bg-primary hover:text-primary-foreground
              transition-all duration-200
            "
            >
              <Plus className="h-3 w-3" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleMinus}
                className="
                h-6 w-6 rounded-full
                bg-secondary
                flex items-center justify-center
                hover:bg-secondary/80
                transition-colors
              "
              >
                <Minus className="h-2.5 w-2.5" />
              </button>

              <span className="text-xs font-bold w-4 text-center">
                {qty}
              </span>

              <button
                onClick={handlePlus}
                className="
                h-6 w-6 rounded-full
                bg-primary text-primary-foreground
                flex items-center justify-center
                hover:bg-primary/90
                transition-colors
              "
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
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
      <ListBanner spacing={6} start={true} />
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
                  <ListSpace spacing={2} />
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
      <ListBanner spacing={6} />
    </div>
  );
}

/* ─── Renders one category section ───────────────────────────── */
function CategorySection({ products, onProductOpen }) {
  // const withImage = products.filter(p => p.images?.length > 0);
  // const withoutImage = products.filter(p => !p.images?.length);

  const withImage = products.filter(
    p =>
      (p.image?.length ?? 0) > 0 && (p.website_picture)
  );
  // const withoutImage = products.filter(p => !p.image.length);
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





/* ─── Main export ─────────────────────────────────────────────── */
export default function ProductGrid({ products, activeCategory, categories = [], onProductOpen }) {
  const { t, getLocalizedField } = useLanguage();
  const { activeBranch } = useBranch();

  const noImage = activeBranch?.no_image;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-center">
        <img
          src={noImage}
          alt="no-image"
          className="h-10 w-10 opacity-60 dark:opacity-20"
        />

        <p className="text-base font-medium tracking-wide mt-3">
          {t('noResults')}
        </p>
      </div>
    );
  }

  const showGrouped = activeCategory == "__all__" && categories.length > 0;

  if (showGrouped) {
    return (
      <div className="space-y-12">
        {categories.map((cat, ci) => {
          const catProducts = products.filter(p => hasCategory(p, cat.id));
          const catName = cat.name?.en;

          const icon = getCategoryIcon(catName);

          if (catProducts.length === 0) return null;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: ci * 0.05 }}
            >
              <CategoryBanner icon={icon} label={catName} />
              <CategorySection products={catProducts} onProductOpen={onProductOpen} />
            </motion.div>
          );
        })}
        {/* <EndBanner />  */}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <SpaceY y={4} />
      <CategorySection products={products} onProductOpen={onProductOpen} />
      {/* <EndBanner />  */}
    </motion.div>
  );
}




















































// /* ─── Category header divider ─────────────────────────────────── */
// function CategoryBanner({ icon, label }) {
//   return (
//     <div className="flex items-center gap-3 mb-4">
//       <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
//       <span className="text-md font-serif font-bold uppercase tracking-[0.35em] text-foreground/50 text-primary">
//         {icon && <span className="mr-1">{icon}</span>}{label}
//       </span>
//       <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
//     </div>
//   );
// }

// function EndBanner() {
//   return (
//     <div className="flex items-center gap-3 my-4">
//       <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
//       <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">
//         ✦ ✦ ✦
//       </span>
//       <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
//     </div>
//   );
// }


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

//   const handlePlus = (e) => {
//     e.stopPropagation();
//     addItem(product, 1);
//   };

//   return (
//     <motion.div
//       onClick={() => onOpen(product)}
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="
//       relative flex items-center gap-3 p-4 cursor-pointer
//       bg-white dark:bg-zinc-900/40
//       border-b border-r border-slate-200/60 dark:border-zinc-800/60
//       active:bg-slate-50 dark:active:bg-zinc-800/40
//       transition-colors
//     "
//     >
//       {/* subtle luxury accent line */}
//       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-40" />

//       {/* Content */}
//       <div className="flex-1 min-w-0">
//         {/* Name + Price */}
//         <div className="flex justify-between items-start gap-2">
//           <h3 className="
//           text-[14px] font-medium tracking-tight
//           text-slate-900 dark:text-zinc-100
//           leading-snug line-clamp-2
//         ">
//             {name}
//           </h3>

//           <span className="
//           text-[13px] font-semibold text-primary
//           whitespace-nowrap
//         ">
//             {product.price?.toFixed(2)}
//           </span>
//         </div>

//         {/* Description */}
//         {desc && (
//           <p className="
//           text-[11.5px] text-slate-500 dark:text-zinc-400
//           mt-1 line-clamp-1
//         ">
//             {desc}
//           </p>
//         )}
//       </div>

//       {/* Controls */}
//       <div className="flex-shrink-0">
//         {qty === 0 ? (
//           <button
//             onClick={handlePlus}
//             className="
//             h-7 w-7 rounded-full
//             bg-primary text-white
//             flex items-center justify-center
//             active:scale-90
//           "
//           >
//             <Plus className="h-3.5 w-3.5" />
//           </button>
//         ) : (
//           <div className="flex items-center gap-1">
//             <button
//               onClick={handleMinus}
//               className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center"
//             >
//               <Minus className="h-3.5 w-3.5" />
//             </button>

//             <span className="text-[13px] font-semibold w-4 text-center">
//               {qty}
//             </span>

//             <button
//               onClick={handlePlus}
//               className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center"
//             >
//               <Plus className="h-3.5 w-3.5" />
//             </button>
//           </div>
//         )}
//       </div>
//     </motion.div>
//   );
// }
// /* ─── Renders one category section ───────────────────────────── */
// function CategorySection({ products, onProductOpen, catDelay = 0 }) {

//   console.log(JSON.stringify(products));
//   const withImage = products.filter(
//     p =>
//       (p.image?.length ?? 0) > 0 && (p.website_picture)
//   );
//   const withoutImage = products.filter(p => !p.image.length);
//   const activeCategory = '';

//   return (
//     <div className="space-y-3">
//       {withImage.length > 0 && (
// <FeaturedSection
//   products={withImage}
//   activeCategory={activeCategory}
//   onProductOpen={onProductOpen}
// />
//       )}
//       {products.length > 0 && (
//         <div className="grid grid-cols-2 border-t border-l border-slate-200/60 dark:border-zinc-800/60 rounded-md overflow-hidden">
//           {products.map((product, index) => {
//             const isLast = index === products.length - 1;
//             const isOdd = products.length % 2 !== 0;

//             return (
//               <div
//                 key={product.id}
//                 className={`
//             ${isOdd && isLast ? "col-span-2" : ""}
//           `}
//               >
//                 <TextListItem
//                   product={product}
//                   onOpen={onProductOpen}
//                   centered={isOdd && isLast} // pass this down
//                 />
//               </div>
//             );
//           })}
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
//         <p className="text-base font-medium tracking-wide">{t('noResults')}</p>
//       </div>
//     );
//   }

//   const showGrouped = activeCategory == "__all__" && categories.length > 0;

//   if (showGrouped) {
//     return (
//       <div className="space-y-10">
//         {categories.map((cat, ci) => {

//           const catProducts = products.filter(p => hasCategory(p, cat.id));

//           const catName = cat.name?.en;

//           if (catProducts.length === 0) return null;
// return (
//   <motion.div
//     key={cat.id}
//     initial={{ opacity: 0 }}
//     animate={{ opacity: 1 }}
//     transition={{ duration: 0.4, delay: ci * 0.05 }}
//   >
//     <CategoryBanner icon={cat.icon} label={catName} />
//     <CategorySection products={catProducts} onProductOpen={onProductOpen} catDelay={ci * 2} />
//     <EndBanner />
//   </motion.div>
// );
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
//         <p className="font-medium text-base leading-tight">{name}</p>
//         {desc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{desc}</p>}
//       </div>
//       <div className="flex items-center gap-2 flex-shrink-0">
//         <span className="font-bold text-primary text-base">${product.price?.toFixed(2)}</span>
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
//             <span className="text-base font-bold w-4 text-center">{qty}</span>
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
//         <p className="text-base font-medium tracking-wide">{t('noResults')}</p>
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


import React from 'react';
import { motion } from 'framer-motion';
import FeaturedSection from './FeaturedSection.jsx';
import ProductCard from './ProductCard.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useCart } from '@/lib/cartStore.jsx';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext.jsx';


function CategoryBanner({ icon, label }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
      <span className="font-serif text-md font-bold uppercase tracking-[0.35em] text-primary/70">
        {icon && <span className="mr-1">{icon}</span>}{label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
    </div>
  );
}



function MoreBanner({ icon, label }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
      <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary/70">
        {icon && <span className="mr-1">{icon}</span>}✦ {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
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
      <div className="flex flex-col items-center justify-center text-center py-24 text-muted-foreground">
        <img
          src={noImage}
          alt="no-image"
          className="w-16 h-16 object-contain mb-2"
        />
        <p className="text-sm font-medium tracking-wide">
          {t("noResults")}
        </p>
      </div>
    );
  }


  // When viewing "All" categories, group the "rest" products by category
  const showGrouped = activeCategory === "__all__" && categories.length > 0;


  const isFeatured = (product) => Number(product.website_picture) === 1 && product.image;
  const featured = products.filter(isFeatured);
  const rest = products.filter(product => !isFeatured(product));

  const renderGrid = (items, startDelay = 0) => (
    <div className="grid grid-cols-2 gap-4 auto-rows-fr md:grid-cols-3 lg:grid-cols-4">
      {items.map((product, i) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (startDelay + i) * 0.04, duration: 0.3 }}
        >
          <ProductCard product={product} onOpen={onProductOpen} />
        </motion.div>
      ))}
    </div>
  );

  return (
    <div>
      <FeaturedSection
        products={featured}
        activeCategory={activeCategory}
        onProductOpen={onProductOpen}
      />

      {rest.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-10"
        >
          {showGrouped ? (
            // Group by category
            categories.map((cat) => {
              const catProducts = rest.filter(p => {
                let groupIds = [];

                try {
                  groupIds =
                    typeof p.category_id === "string"
                      ? JSON.parse(p.category_id)
                      : Array.isArray(p.category_id)
                        ? p.category_id
                        : [];
                } catch {
                  groupIds = [];
                }

                const normalizedGroups = groupIds.map(Number);

                return normalizedGroups.includes(Number(cat.id));
              });

              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id}>
                  <CategoryBanner
                    icon={cat.icon}
                    label={getLocalizedField(cat, 'name')}
                  />
                  {renderGrid(catProducts)}

                  <div className="flex items-center gap-4 mt-8">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70">
                      ✦ ✦ ✦
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
                  </div>
                </div>
              );
            })
          ) : (
            // Single "More" section for filtered categories
            <div>
              <MoreBanner label="More" />
              {renderGrid(rest)}

              <div className="flex items-center gap-4 mt-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70">
                  ✦ ✦ ✦
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
              </div>
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}




















/* ─── Cart controls ───────────────────────────────────────────── */
// function RowCartControls({ product }) {
//   const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
//   const qty = getProductQuantity(product.id);

//   const handleMinus = (e) => {
//     e.stopPropagation();
//     const cartItems = items.filter(i => i.product_id === product.id);
//     if (!cartItems.length) return;
//     const last = cartItems[cartItems.length - 1];
//     const lastIndex = items.findIndex(i => i === last);
//     last.quantity > 1 ? updateQuantity(lastIndex, last.quantity - 1) : removeItem(lastIndex);
//   };
//   const handlePlus = (e) => { e.stopPropagation(); addItem(product, 1); };

//   if (qty === 0) {
//     return (
//       <motion.button
//         whileTap={{ scale: 0.82 }}
//         whileHover={{ scale: 1.1 }}
//         onClick={handlePlus}
//         className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:shadow-primary/30 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex-shrink-0"
//       >
//         <Plus className="h-3.5 w-3.5" />
//       </motion.button>
//     );
//   }

//   return (
//     <div className="flex items-center gap-1.5 flex-shrink-0">
//       <motion.button whileTap={{ scale: 0.85 }} onClick={handleMinus}
//         className="h-7 w-7 rounded-full bg-secondary border border-border/50 flex items-center justify-center hover:bg-muted transition-colors">
//         <Minus className="h-3 w-3 text-foreground/70" />
//       </motion.button>
//       <span className="text-xs font-bold w-5 text-center text-foreground tabular-nums">{qty}</span>
//       <motion.button whileTap={{ scale: 0.85 }} onClick={handlePlus}
//         className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/85 transition-colors shadow-sm">
//         <Plus className="h-3 w-3" />
//       </motion.button>
//     </div>
//   );
// }

// /* ─── Product row ─────────────────────────────────────────────── */
// function ProductListRow({ product, onOpen, index, isLast }) {
//   const { getLocalizedField } = useLanguage();
//   const name = getLocalizedField(product, 'name');
//   const desc = getLocalizedField(product, 'description');

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: -8 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ delay: index * 0.04, duration: 0.32, ease: 'easeOut' }}
//       onClick={() => onOpen(product)}
//       className="group relative flex items-center gap-2.5 px-3 py-3 cursor-pointer transition-colors duration-200 hover:bg-accent/25 bg-card/60 backdrop-blur-md"
//     >
//       {/* Left accent bar */}
//       <motion.div
//         className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary origin-center"
//         initial={{ scaleY: 0 }}
//         whileHover={{ scaleY: 1 }}
//         transition={{ duration: 0.18 }}
//       />

//       {/* Thumbnail */}
//       <motion.div
//         whileHover={{ scale: 1.06 }}
//         transition={{ duration: 0.22 }}
//         className="flex-shrink-0 h-[3.75rem] w-[3.75rem] rounded-xl overflow-hidden bg-muted border border-border/40 flex items-center justify-center shadow-sm"
//       >
//         {product.images?.[0] ? (
//           <img
//             src={product.images[0]}
//             alt={name}
//             className="w-full h-full object-contain p-1.5"
//             loading="lazy"
//           />
//         ) : (
//           <span className="text-2xl">🍽️</span>
//         )}
//       </motion.div>

//       {/* Text */}
//       <div className="flex-1 min-w-0">
//         <div className="flex items-center gap-2 flex-wrap">
//           <p className="font-serif font-medium text-sm text-foreground group-hover:text-primary transition-colors duration-200 leading-snug">
//             {name}
//           </p>
//           {product.is_popular && (
//             <span className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-[0.14em] uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
//               <Sparkles className="h-2 w-2" /> Popular
//             </span>
//           )}
//         </div>
//         {desc && (
//           <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-light leading-relaxed">
//             {desc}
//           </p>
//         )}
//         {/* Option hint */}
//         {product.option_groups?.length > 0 && (
//           <p className="text-[10px] text-muted-foreground/60 mt-0.5 tracking-wide">
//             {product.option_groups.length} variation{product.option_groups.length > 1 ? 's' : ''}
//           </p>
//         )}
//       </div>

//       {/* Price + CTA */}
//       <div className="flex items-center gap-3 flex-shrink-0">
//         <span className="font-bold text-sm text-primary tabular-nums tracking-tight">
//           ${product.price?.toFixed(2)}
//         </span>
//         <RowCartControls product={product} />
//       </div>


//     </motion.div>
//   );
// }

// /* ─── Decorative section divider ──────────────────────────────── */
// function MoreSectionBanner() {
//   return (
//     <div className="flex items-center gap-3 mb-5">
//       <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
//       <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-foreground/50">
//         ✦ More
//       </span>
//       <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
//     </div>
//   );
// }

// /* ─── Main grid ──────────────────────────────────────────────── */
// export default function ProductGrid({ products, activeCategory, onProductOpen }) {
//   const { t } = useLanguage();
//   const { activeBranch } = useBranch();
//   const noImage = activeBranch?.no_image;

//   if (products.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center text-center py-24 text-muted-foreground">
//         <img
//           src={noImage}
//           alt="no-image"
//           className="w-16 h-16 object-contain mb-2"
//         />
//         <p className="text-sm font-medium tracking-wide">
//           {t("noResults")}
//         </p>
//       </div>
//     );
//   }


//   const isAll = activeCategory === "__all__";

//   const isFeatured = (product) => Number(product.website_picture) === 1;
//   const featured = products.filter(isFeatured);
//   const lists = products.filter(product => !isFeatured(product));




//   return (
//     <div>
//       <FeaturedSection
//         products={featured}
//         activeCategory={activeCategory}
//         onProductOpen={onProductOpen}
//       />

//       {lists.length > 0 && (
//         <motion.section
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.4, delay: 0.2 }}
//         >
//           <MoreSectionBanner />

//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//             {lists.map((product, i) => (
//               <motion.div
//                 key={product.id}
//                 initial={{ opacity: 0, y: 12 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: i * 0.04, duration: 0.3 }}
//               >
//                 <ProductCard product={product} onOpen={onProductOpen} />
//               </motion.div>
//             ))}
//           </div>
//         </motion.section>
//       )}
//     </div>
//   );

// }
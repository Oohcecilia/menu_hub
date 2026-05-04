import React from 'react';
import { motion } from 'framer-motion';
import FeaturedSection from './FeaturedSection.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useCart } from '@/lib/cartStore.jsx';
import { Plus, Minus, Flame, Sparkles } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext.jsx';

/* ─── Cart controls for list row ─────────────────────────────── */
function RowCartControls({ product }) {
  const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
  const qty = getProductQuantity(product.id);

  const handleMinus = (e) => {
    e.stopPropagation();
    const cartItems = items.filter(i => i.product_id === product.id);
    if (!cartItems.length) return;
    const last = cartItems[cartItems.length - 1];
    const lastIndex = items.findIndex(i => i === last);
    last.quantity > 1 ? updateQuantity(lastIndex, last.quantity - 1) : removeItem(lastIndex);
  };
  const handlePlus = (e) => { e.stopPropagation(); addItem(product, 1); };

  if (qty === 0) {
    return (
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={handlePlus}
        className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/85 transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <Plus className="h-3.5 w-3.5" />
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={handleMinus}
        className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
        <Minus className="h-3 w-3 text-foreground/70" />
      </button>
      <span className="text-xs font-bold w-4 text-center text-foreground">{qty}</span>
      <button onClick={handlePlus}
        className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/85 transition-colors">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ─── Premium list row ───────────────────────────────────────── */
function ProductListRow({ product, onOpen, index, isLast }) {
  const { getLocalizedField } = useLanguage();
  const name = getLocalizedField(product, 'name');
  const desc = getLocalizedField(product, 'description');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.35, ease: 'easeOut' }}
      onClick={() => onOpen(product)}
      className="group relative flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-all duration-200 hover:bg-accent/30"
    >
      {/* Left accent bar on hover */}
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />


      {/* Text block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-serif font-medium text-sm text-foreground group-hover:text-primary transition-colors duration-200 leading-snug">
            {name}
          </p>
          {product.is_popular && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-[0.15em] uppercase text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
              <Sparkles className="h-2.5 w-2.5" /> Popular
            </span>
          )}
        </div>
        {desc && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 font-light leading-relaxed">
            {desc}
          </p>
        )}
      </div>

      {/* Price + action */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-semibold text-sm text-primary tabular-nums tracking-tight">
          ${product.price?.toFixed(2)}
        </span>
        <RowCartControls product={product} />
      </div>

      {/* Row divider — hidden on last item */}
      {!isLast && (
        <div className="absolute bottom-0 left-[4.5rem] right-4 h-px bg-border/40" />
      )}
    </motion.div>
  );
}

/* ─── Main grid ──────────────────────────────────────────────── */
export default function ProductGrid({ products, activeCategory, onProductOpen }) {
  const { t } = useLanguage();
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


  return (
    <div>
      <FeaturedSection
        products={products}
        activeCategory={activeCategory}
        onProductOpen={onProductOpen}
      />

      {products.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {/* Section label */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70">
              ✦ {t("more")} ✦
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
          </div>

          {/* Bordered card container */}
          {/* <div className=" grid grid-cols-1 sm:grid-cols-2 rounded-2xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm divide-y-0">
            {rest.map((product, i) => (
              <ProductListRow
                key={product.id}
                product={product}
                onOpen={onProductOpen}
                index={i}
                isLast={i === rest.length - 1}
              />
            ))}
          </div> */}


          <div className="premium-glow">
            <div className="inner bg-card/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 overflow-hidden bg-card/50 backdrop-blur-sm divide-y-0">
                {products.map((product, i) => (
                  <ProductListRow
                    key={product.id}
                    product={product}
                    onOpen={onProductOpen}
                    index={i}
                    isLast={i === products.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70">
              ✦ ✦ ✦
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
          </div>
        </motion.section>
      )}
    </div>
  );
}
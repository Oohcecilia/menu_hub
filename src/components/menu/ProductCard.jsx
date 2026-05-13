import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext.jsx';

export default function ProductCard({ product, onOpen }) {
  const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
  const { t, getLocalizedField } = useLanguage();
  const qty = getProductQuantity(product.id);
  const { activeBranch } = useBranch();

  const noImage = activeBranch?.no_image;

  const handleMinus = (e) => {
    e.stopPropagation();
    const cartItems = items.filter(i => i.product_id === product.id);
    if (cartItems.length === 0) return;
    const last = cartItems[cartItems.length - 1];
    const lastIndex = items.findIndex(i => i === last);
    if (last.quantity > 1) {
      updateQuantity(lastIndex, last.quantity - 1);
    } else {
      removeItem(lastIndex);
    }
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    addItem(product, 1);
  };

  
  const fitCategories = new Set(["[13]", "[5]"]);

  const imageStyle = fitCategories.has(product.category_id)
    ? "object-contain"
    : "object-cover";

    
  return (
    <div
      onClick={() => onOpen(product)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
    >
      {/* Image Container */}
    <div className="relative aspect-square min-h-[150px] w-full overflow-hidden bg-muted/30 flex items-center justify-center">
      {product.image ? (
        <img
          src={product.image}
          alt={getLocalizedField(product, "name")}
          className={`h-full w-full transition-transform  duration-500 ease-out group-hover:scale-110 ${imageStyle}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2">
          <img src={noImage} alt="no-image" className="h-8 w-8 opacity-50 dark:opacity-20" />
        </div>
      )}
    </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground">
            {getLocalizedField(product, 'name')}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
            {getLocalizedField(product, 'description')}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary">
              {product.price}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">

            {qty === 0 ? (
              <button
                onClick={handlePlus}
                className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={handleMinus} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors active:scale-95">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-5 text-center">{qty}</span>
                <button onClick={handlePlus} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
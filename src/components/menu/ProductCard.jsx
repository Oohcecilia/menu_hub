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

  return (
    <div
      onClick={() => onOpen(product)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/30 p-4">
        {product.image ? (
          <img
            src={product.image}
            alt={getLocalizedField(product, 'name')}
            className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <img src={noImage} alt="no-image" className="h-10 w-10 opacity-20" />
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
              {product.price?.toFixed(2)}
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

  // return (
  //   <div
  //     onClick={() => onOpen(product)}
  //     className="bg-card rounded-2xl overflow-hidden border border-border/50 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group flex flex-col"
  //   >
  //     {/* Image — contain, no crop */}
  //     <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
  //       {product.image ? (
  //         <img
  //           src={product.image}
  //           alt={getLocalizedField(product, 'name')}
  //           className="w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform duration-300"
  //         />
  //       ) : (
  //         <img
  //           src={noImage}
  //           alt="no-image"
  //           className="w-8 h-8 object-contain"
  //         />
  //       )}
  //     </div>

  //     {/* Info */}
  //     <div className="p-3 flex flex-col flex-1">
  //       <p className="font-semibold text-sm leading-tight line-clamp-1">{getLocalizedField(product, 'name')}</p>
  //       <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 flex-1">{getLocalizedField(product, 'description')}</p>

  // <div className="flex items-center justify-between mt-2">
  //   <span className="font-bold text-primary text-sm">{product.price?.toFixed(2)}</span>

  //   {qty === 0 ? (
  //     <button
  //       onClick={handlePlus}
  //       className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors active:scale-95"
  //     >
  //       <Plus className="h-3.5 w-3.5" />
  //     </button>
  //   ) : (
  //     <div className="flex items-center gap-1">
  //       <button onClick={handleMinus} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors active:scale-95">
  //         <Minus className="h-3 w-3" />
  //       </button>
  //       <span className="text-sm font-bold w-5 text-center">{qty}</span>
  //       <button onClick={handlePlus} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95">
  //         <Plus className="h-3 w-3" />
  //       </button>
  //     </div>
  //   )}
  // </div>
  //     </div>
  //   </div>
  // );
}
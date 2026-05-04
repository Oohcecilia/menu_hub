// import React from 'react';
// import { Plus, Minus } from 'lucide-react';
// import { useCart } from '@/lib/cartStore.jsx';
// import { useLanguage } from '@/lib/i18n.jsx';
// import { useBranch } from '@/lib/BranchContext.jsx';
// import { act } from 'react';

// export default function ProductCard({ product, onOpen }) {
//   const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
//   const { getLocalizedField } = useLanguage();
//   const qty = getProductQuantity(product.id);
//   const { activeBranch } = useBranch();

//   const noImage = activeBranch?.no_image;

//   const handleMinus = (e) => {
//     e.stopPropagation();
//     const cartItems = items.filter(i => i.product_id === product.id);
//     if (cartItems.length === 0) return;
//     const last = cartItems[cartItems.length - 1];
//     const lastIndex = items.findIndex(i => i === last);
//     if (last.quantity > 1) {
//       updateQuantity(lastIndex, last.quantity - 1);
//     } else {
//       removeItem(lastIndex);
//     }
//   };

//   const handlePlus = (e) => {
//     e.stopPropagation();
//     addItem(product, 1);
//   };

//   return (
//     <div
//       onClick={() => onOpen(product)}
//       className="bg-card rounded-2xl overflow-hidden border border-border/50 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group flex flex-col"
//     >
//       {/* Image — contain, no crop */}
//       <div className="relative w-full aspect-square   flex items-center justify-center overflow-hidden">
//         {product.image ? (
//           <img
//             src={product.image}
//             alt={getLocalizedField(product, 'name')}
//             className="w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform duration-300"
//           />
//         ) : (
//           <img
//             src={noImage}
//             alt="no-image"
//             className="w-8 h-8 object-contain"
//           />
//         )}
//         {product.is_popular && (
//           <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
//             ⭐ Popular
//           </span>
//         )}
//       </div>

//       {/* Info */}
//       <div className="p-3 flex flex-col flex-1 bg-muted">

//         {/* NAME */}
//         <div className="flex flex-col">
//           <p className="font-semibold text-sm leading-tight line-clamp-1">
//             {getLocalizedField(product, "name")}
//           </p>

//           {product?.name?.def &&
//             product?.name?.def !== getLocalizedField(product, "name") && (
//               <span className="text-[11px] text-muted-foreground line-clamp-1">
//                 {product.name.def}
//               </span>
//             )}
//         </div>

//         {/* DESCRIPTION */}
//         <div className="flex flex-col mt-0.5 flex-1">
//           <p className="text-xs text-muted-foreground line-clamp-1">
//             {getLocalizedField(product, "description")}
//           </p>
//         </div>

//         <div className="flex items-center justify-between mt-2">
//           <span className="font-bold text-primary text-sm">${product.price?.toFixed(2)}</span>

//           {qty === 0 ? (
//             <button
//               onClick={handlePlus}
//               className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors active:scale-95"
//             >
//               <Plus className="h-3.5 w-3.5" />
//             </button>
//           ) : (
//             <div className="flex items-center gap-1">
//               <button onClick={handleMinus} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors active:scale-95">
//                 <Minus className="h-3 w-3" />
//               </button>
//               <span className="text-sm font-bold w-5 text-center">{qty}</span>
//               <button onClick={handlePlus} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95">
//                 <Plus className="h-3 w-3" />
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }




import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext.jsx';

export default function ProductCard({ product, onOpen }) {
  const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
  const { getLocalizedField } = useLanguage();
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
      className="bg-card rounded-2xl overflow-hidden border border-border/50 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group flex flex-col"
    >
      {/* Image — contain, no crop */}
      <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={getLocalizedField(product, 'name')}
            className="w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <img
            src={noImage}
            alt="no-image"
            className="w-8 h-8 object-contain"
          />
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="font-semibold text-sm leading-tight line-clamp-1">{getLocalizedField(product, 'name')}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 flex-1">{getLocalizedField(product, 'description')}</p>

        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-primary text-sm">${product.price?.toFixed(2)}</span>

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
  );
}
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';

import { useBranch } from '@/lib/BranchContext';



function generateOrderNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


function CartItem({
  item,
  product,
  index,
  updateQuantity,
  updateNote,
  removeItem,
  t,
  onProductOpen
}) {
  if (!product) return null;

  const { activeBranch } = useBranch();
  const { getLocalizedField } = useLanguage();
  const [imgError, setImgError] = useState(false);

  // ── 1. USE THE DYNAMIC OVERRIDDEN TIER PRICE ───────────────────
  const price = product.price || 0;
  const total = price * item.quantity;
  
  const baseName = getLocalizedField(product, 'name') || product.default_name;
  // Append size tier label context to the name if it exists (e.g., "Pizza (Large)")
  const name = product.chosenLabel ? `${baseName} (${product.chosenLabel})` : baseName;
  
  const image = product.image;
  const noImage = activeBranch?.no_image;

  const variations = useMemo(() => {
    const v = item?.variations;
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      return v.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [item?.variations]);

  return (
    <div className="bg-background rounded-xl border border-border/50 overflow-hidden">
      {/* TOP ROW */}
      <div className="flex gap-3 p-3 items-center">
        {!imgError && image ? (
          <img
            src={image}
            alt={baseName}
            className="h-14 w-14 rounded-lg object-contain bg-muted flex-shrink-0 p-1"
            onError={() => setImgError(true)}
          />
        ) : (
          <img
            src={noImage}
            alt="no-image"
            className="h-14 w-14 p-4 rounded-lg object-contain bg-muted flex-shrink-0 opacity-50 dark:opacity-20"
          />
        )}

        {/* NAME + PRICE */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate capitalize text-foreground">
            {name}
          </p>
          {variations.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">
              {variations.join(", ")}
            </p>
          )}
          <p className="text-primary font-bold text-xs mt-0.5">
            {price.toLocaleString()} x {item.quantity}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => updateQuantity(index, item.quantity - 1)}
            className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold hover:bg-secondary/80 transition-colors text-foreground"
          >
            −
          </button>

          <span className="text-sm font-bold w-4 text-center text-foreground">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateQuantity(index, item.quantity + 1);
            }}
            className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold hover:bg-secondary/80 transition-colors text-foreground"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => removeItem(index)}
            className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors ml-0.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


export default function CartDrawer({ open, onClose, products, onProductOpen }) {
  const {
    items,
    updateQuantity,
    updateNote,
    removeItem,
    orderNote,
    setOrderNote,
  } = useCart();

  const { activeBranch } = useBranch();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (open) {
      document.documentElement.classList.add("overflow-hidden");
    } else {
      document.documentElement.classList.remove("overflow-hidden");
    }
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [open]);

  // ── 2. ADVANCED LOOKUP MAP (Indexes Base IDs AND Option UIDs) ──────
  const productMap = useMemo(() => {
    const map = new Map();
    
    products.forEach(p => {
      // Map base item reference fallback
      map.set(String(p.id), p);
      
      // Map every individual nested price variant tier to its own item entry
      if (p.prices && Array.isArray(p.prices)) {
        p.prices.forEach(tier => {
          if (tier.uid) {
            map.set(String(tier.uid), {
              ...p,
              id: String(tier.uid),
              price: parseFloat(tier.price) || 0,
              chosenLabel: tier.label || null
            });
          }
        });
      }
    });
    
    return map;
  }, [products]);

  // ── 3. RE-CALCULATE ACCURATE SUBTOTAL BASED ON ACTIVE TIERS ────────
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const targetProduct = productMap.get(String(item.product_id));
      const activePrice = targetProduct?.price || 0;
      return sum + (activePrice * item.quantity);
    }, 0);
  }, [items, productMap]);

  const handlePlaceOrder = async () => {
    if (!items.length || placing) return;
    setPlacing(true);

    try {
      const orderData = {
        id: "order-" + Date.now(),
        order_number: Math.floor(1000 + Math.random() * 9000), // Quick dynamic fallback helper
        buid: activeBranch?.buid || '',
        items: items.map((item) => {
          const product = productMap.get(String(item.product_id));
          return {
            product_id: item.product_id,
            name: product?.chosenLabel ? `${product.name} (${product.chosenLabel})` : product?.name,
            price: product?.price || 0,
            quantity: item.quantity,
            note: item.note || undefined,
            variations: item.variations
          };
        }),
        subtotal: subtotal,
        status: "placed",
        created_at: new Date().toISOString(),
      };

      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      localStorage.setItem("orders", JSON.stringify([orderData, ...existingOrders]));

      onClose?.();
      navigate(`/order-confirmation/${orderData.id}`);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* DRAWER */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card shadow-2xl flex flex-col border-l border-border/40"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="text-lg font-serif font-bold text-foreground">
                {t("yourCart")}
              </h2>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ITEMS CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="font-medium text-foreground">{t("emptyCart")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("emptyCartDesc")}
                  </p>
                </div>
              ) : (
                items.map((item, index) => {
                  const product = productMap.get(String(item.product_id));
                  return (
                    <CartItem
                      key={item.card_id || `${item.product_id}-${index}`}
                      item={item}
                      product={product}
                      index={index}
                      updateQuantity={updateQuantity}
                      updateNote={updateNote}
                      removeItem={removeItem}
                      t={t}
                      onProductOpen={onProductOpen}
                    />
                  );
                })
              )}
            </div>

            {/* FOOTER */}
            {items.length > 0 && (
              <div className="p-5 border-t border-border/50 space-y-4 bg-background/50 backdrop-blur">

                <Button
                  onClick={handlePlaceOrder}
                  disabled={placing || !items.length}
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 font-semibold text-base transition-all"
                >
                  {placing ? t("placing") : t("placeOrder")}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}






// function CartItem({
//   item,
//   product,
//   index,
//   updateQuantity,
//   updateNote,
//   removeItem,
//   t,
//   onProductOpen
// }) {
//   if (!product) return null;

//   const { activeBranch } = useBranch();
//   const { getLocalizedField } = useLanguage();
//   const [imgError, setImgError] = useState(false);

//   const price = product.price || 0;
//   const total = price * item.quantity;
//   const name = getLocalizedField(product, 'name') || product.default_name;
//   const image = product.image;
//   const noImage = activeBranch?.no_image

//   const variations = useMemo(() => {
//     const v = item?.variations;

//     if (!v) return [];

//     if (Array.isArray(v)) return v;

//     if (typeof v === "string") {
//       return v.split(",").map(s => s.trim()).filter(Boolean);
//     }

//     return [];
//   }, [item?.variations]);


//   return (
//     // onClick={() => onProductOpen(product)}
//     <div className="bg-background rounded-xl border border-border/50 overflow-hidden">

//       {/* TOP ROW */}
//       <div className="flex gap-3 p-3">

//         {!imgError && (
//           <img
//             src={image}
//             alt={name}
//             className="h-14 w-14 rounded-lg object-contain bg-muted flex-shrink-0 p-1"
//             onError={() => setImgError(true)}
//           />
//         )}

//         {imgError && (
//           <img
//             src={noImage}
//             alt="no-image"
//             className="h-14 w-14 p-4 rounded-lg object-contain bg-muted flex-shrink-0 p-1 opacity-50 dark:opacity-20"
//           />
//         )}


//         {/* NAME + PRICE */}
//         <div className="flex-1 min-w-0">
//           <p className="font-medium text-sm truncate capitalize">
//             {name}
//           </p>

//           <p className="text-xs text-muted-foreground truncate">
//             {variations.join(", ")}
//           </p>

//           {/* <p className="text-primary font-bold text-sm">
//             {total.toFixed(2)}
//           </p> */}
//         </div>

//         {/* ACTIONS */}
//         <div className="flex items-center gap-1.5 flex-shrink-0">

//           <button
//             onClick={() => updateQuantity(index, item.quantity - 1)}
//             className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold hover:bg-secondary/80 transition-colors"
//           >
//             −
//           </button>

//           <span className="text-sm font-bold w-4 text-center">
//             {item.quantity}
//           </span>

//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               updateQuantity(index, item.quantity + 1);
//             }}
//             className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold hover:bg-secondary/80 transition-colors"
//           >
//             +
//           </button>

//           <button
//             onClick={() => removeItem(index)}
//             className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors ml-0.5"
//           >
//             <Trash2 className="h-3.5 w-3.5" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// export default function CartDrawer({ open, onClose, products, subtotal = 0, onProductOpen }) {
//   const {
//     items,
//     updateQuantity,
//     updateNote,
//     removeItem,
//     total,
//     itemCount,
//     orderNote,
//     setOrderNote,
//   } = useCart();

//   const { activeBranch } = useBranch();

//   const { t } = useLanguage();
//   const navigate = useNavigate();

//   const [placing, setPlacing] = useState(false);


//   useEffect(() => {
//     if (open) {
//       document.documentElement.classList.add("overflow-hidden");
//     } else {
//       document.documentElement.classList.remove("overflow-hidden");
//     }

//     return () => {
//       document.documentElement.classList.remove("overflow-hidden");
//     };
//   }, [open]);

//   // ---------------------------
//   // FAST PRODUCT LOOKUP (IMPORTANT)
//   // ---------------------------
//   const productMap = useMemo(() => {
//     const map = new Map();
//     products.forEach(p => map.set(p.id, p));
//     return map;
//   }, [products]);

//   // ---------------------------
//   // PLACE ORDER
//   // ---------------------------
//   const handlePlaceOrder = async () => {
//     if (!items.length || placing) return;

//     setPlacing(true);

//     try {
//       const orderData = {
//         id: "order-" + Date.now(),
//         order_number: generateOrderNumber(),
//         buid: activeBranch?.buid || '',
//         items: items.map((item) => {
//           const product = productMap.get(item.product_id);
//           return {
//             product_id: item.product_id,
//             quantity: item.quantity,
//             note: item.note || undefined,
//             variations: item.variations
//           };
//         }),
//         status: "placed",
//         created_at: new Date().toISOString(),
//       };

//       // Save full orders
//       const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
//       localStorage.setItem(
//         "orders",
//         JSON.stringify([orderData, ...existingOrders])
//       );

//       onClose?.();

//       navigate(`/order-confirmation/${orderData.id}`);
//     } catch (err) {
//       console.error("Order failed:", err);
//     } finally {
//       setPlacing(false);
//     }
//   };

//   // ---------------------------
//   // UI
//   // ---------------------------
//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           {/* BACKDROP */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.2 }}
//             className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
//             onClick={onClose}
//           />

//           {/* DRAWER */}
//           <motion.div
//             initial={{ x: "100%" }}
//             animate={{ x: 0 }}
//             exit={{ x: "100%" }}
//             transition={{ type: "spring", stiffness: 320, damping: 32 }}
//             className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card shadow-2xl flex flex-col"
//           >
//             {/* HEADER */}
//             <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
//               <h2 className="text-lg font-serif font-bold">
//                 {t("yourCart")}
//               </h2>

//               <button
//                 onClick={onClose}
//                 className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             </div>

//             {/* ITEMS */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-3">
//               {items.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center h-full text-center py-16">
//                   <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-4" />
//                   <p className="font-medium">{t("emptyCart")}</p>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     {t("emptyCartDesc")}
//                   </p>
//                 </div>
//               ) : (
//                 <>
//                   {items.map((item, index) => {
//                     const product = productMap.get(item.product_id);

//                     return (
//                       <CartItem
//                         key={item.card_id || index}
//                         item={item}
//                         product={product}
//                         index={index}
//                         updateQuantity={updateQuantity}
//                         updateNote={updateNote}
//                         removeItem={removeItem}
//                         t={t}
//                         onProductOpen={onProductOpen}
//                       />
//                     );
//                   })}

//                 </>
//               )}
//             </div>

//             {/* FOOTER */}
//             {items.length > 0 && (
//               <div className="p-5 border-t border-border/50 space-y-3">
//                 {/* <div className="flex justify-between font-bold text-lg">
//                   <span>{t("total")}</span>
//                   <span className="text-primary">
//                     {subtotal.toFixed(2)}
//                   </span>
//                 </div> */}

//                 <Button
//                   onClick={handlePlaceOrder}
//                   disabled={placing || !items.length}
//                   className="w-full h-12 rounded-2xl bg-primary font-semibold text-base"
//                 >
//                   {placing ? t("placing")  : `${t("placeOrder") }`}
//                 </Button>

//                 {/* <Button
//                   disabled={placing || !items.length}
//                   className="w-full h-10 rounded-xl bg-primary font-semibold text-base"
//                 >
//                   Clear Selection
//                 </Button> */}
//               </div>
//             )}
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }

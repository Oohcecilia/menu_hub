import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext';



function OptionGroup({ group, selections, onChange }) {
  // 🔹 normalize items
  const items = useMemo(() => {
    const raw = group?.items || [];

    return raw.flatMap((item, index) => {
      if (typeof item === "object" && item?.id) return [item];

      if (typeof item === "string") {
        const [title, ...options] = item.split(",").map(s => s.trim());

        return options.map((opt, i) => ({
          id: `${index}-${i}`,
          name: { def: opt },
          groupTitle: title,
        }));
      }

      return [];
    });
  }, [group?.items]);

  const getName = (item) =>
    typeof item.name === "object" ? item.name?.def : item.name;

  // 🔹 ensure one selected always
  useEffect(() => {
    if (!selections && items.length > 0) {
      onChange(items[0].id);
    }
  }, [items, selections, onChange]);

  // 🔹 single select only
  const select = useCallback((item) => {
    if (selections !== item.id) {
      onChange(item.id);
    }
  }, [selections, onChange]);

  const isSelected = useCallback(
    (item) => selections === item.id,
    [selections]
  );

  return (
    <div className="space-y-1 m-0">
      <p className="text-xs font-semibold text-gray-800 dark:text-white">
        {group.title || group.name}
        {group.required && <span className="text-[var(--primary)] ml-1">*</span>}
      </p>

      <div className="space-y-2">
        {items.map((item) => {
          const selected = isSelected(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item)}
              className={`
                w-full flex items-center justify-between px-3 rounded-xl transition-all duration-200

                ${selected
                  ? " bg-[color:var(--primary)/0.08]"
                  : " hover:bg-gray-50 dark:hover:bg-white/10"}
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    h-4 w-4 flex items-center justify-center rounded-full border transition

                    ${selected
                      ? "bg-[var(--primary)] border-[var(--primary)]"
                      : "dark:border-white/20"}
                  `}
                >
                  {selected && <Check className="h-4 w-4 text-lime-500 border-lime-500" />}
                </div>

                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {getName(item)}
                </span>
              </div>

              {item.groupTitle && (
                <span className="text-xs text-gray-400 dark:text-white/40">
                  {item.groupTitle}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}


export default function ProductModal({ open, product, onClose, cart_id = "" }) {
  const { activeBranch } = useBranch();
  const { addItem } = useCart();
  const { t, getLocalizedField } = useLanguage();

  const name = getLocalizedField(product, 'translations') || product?.name || product?.default_name;

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [imgError, setImgError] = useState(false);
  const [selections, setSelections] = useState({});

  // ── 1. INITIALIZE SELECTED PRICE TIER STATE ─────────────────────
  const [selectedPriceUid, setSelectedPriceUid] = useState(() => {
    if (product?.prices && product.prices.length > 0) {
      return String(product.prices[0].uid);
    }
    return "";
  });

  const noImage = activeBranch?.no_image;

  // ── 2. DERIVE CURRENT ACTIVE PRICE TIER ─────────────────────────
  const activePriceObj = useMemo(() => {
    if (!product?.prices || product.prices.length === 0) {
      return { price: product?.price || 0, uid: product?.id, label: null };
    }
    return product.prices.find(p => String(p.uid) === String(selectedPriceUid)) || product.prices[0];
  }, [product, selectedPriceUid]);

  // ── 3. RECONSTRUCT RECURRING VARIATION GROUPS ───────────────────
  const groups = useMemo(() => {
    let data = product?.variations;

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        data = [];
      }
    }

    if (!Array.isArray(data)) return [];

    return data.map((groupStr, gi) => {
      const options = groupStr.split(",").map(s => s.trim());

      return {
        id: `group-${gi}`,
        name: `${t("option")} ${gi + 1}`,
        required: true,
        multiple: false,
        items: options.map(opt => ({
          id: `${gi}-${opt}`,
          name: { def: opt }
        }))
      };
    });
  }, [product, t]);

  // ── 4. MAP CART DISPATCH PAYLOAD WITH TIER SPECIFIC UID ────────
  const handleAdd = () => {
    const selectedVariations = groups.flatMap((g) => {
      const sel = selections[g.name];
      if (!sel) return [];

      return g.items
        .filter(item => Array.isArray(sel) ? sel.includes(item.id) : sel === item.id)
        .map(item => item.name?.def);
    });

    // Inject the selected price tier's UID and pricing data into the product object
    const cartProductPayload = {
      ...product,
      id: String(activePriceObj.uid || product.id),
      price: parseFloat(activePriceObj.price) || 0,
      chosenLabel: activePriceObj.label // Helpful context for cart display items
    };

    addItem(cartProductPayload, quantity, note, selectedVariations, cart_id);
    onClose();
  };

  const totalPrice = (parseFloat(activePriceObj?.price) || 0) * quantity;


  return (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="
          fixed inset-0 z-[60] flex items-end sm:items-center justify-center
          bg-white/50 dark:bg-black/50 backdrop-blur-md
        "
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          className="
            w-full sm:max-w-md max-h-[92vh] flex flex-col overflow-hidden relative
            rounded-t-3xl sm:rounded-3xl
            bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur-2xl
            border border-black/10 dark:border-white/10
            shadow-[0_20px_80px_rgba(0,0,0,0.25)]
          "
        >
          {/* Subtle gold glow background pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-amber-400/20 to-transparent dark:from-amber-500/10" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4 z-10 h-8 w-8 rounded-full
              flex items-center justify-center
              bg-white dark:bg-black
              border border-black/10 dark:border-white/10
              hover:bg-black/10 dark:hover:bg-white/20
            "
          >
            <X className="h-4 w-4 text-gray-700 dark:text-white/70" />
          </button>

          {/* Image Section Container */}
          <div className="relative w-full flex items-center justify-center flex-shrink-0 mt-4"
            style={{ minHeight: 200, maxHeight: 240 }}
          >
            {!imgError && product?.image && (
              <img
                src={product.image}
                alt={name}
                className="w-full h-full object-contain drop-shadow-xl relative w-[90%]"
                style={{ maxHeight: 240 }}
                onError={() => setImgError(true)}
              />
            )}

            {(imgError || !product?.image) && (
              <img
                src={noImage}
                alt="no-image"
                className="absolute w-10 h-10 opacity-50 dark:opacity-20"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#0f1117] to-transparent" />
          </div>

          {/* Scrollable Content Workspace */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white capitalize truncate">
                    {name}
                  </h2>
                  
                  {/* ── COMPACT SMALL BUTTON PRICE SELECTOR AFTER NAME ── */}
                  {product?.prices && product.prices.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {product.prices.map((priceOption) => {
                        const isSelected = String(priceOption.uid) === String(selectedPriceUid);
                        return (
                          <button
                            key={priceOption.uid}
                            type="button"
                            onClick={() => setSelectedPriceUid(String(priceOption.uid))}
                            className={`
                              px-2.5 py-1 text-xs rounded-full font-medium transition-all duration-200 border
                              ${isSelected 
                                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105" 
                                : "bg-black/[0.03] dark:bg-white/[0.04] text-muted-foreground border-black/5 dark:border-white/5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                              }
                            `}
                          >
                            {priceOption.label || t("Standard")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-xl font-bold text-primary tracking-wider flex-shrink-0 font-mono">
                  {activePriceObj.price}
                </p>
              </div>

              {product?.details && (
                <p className="py-2 text-gray-500 dark:text-white/60 text-sm mt-2 leading-relaxed font-light">
                  {getLocalizedField(product, "details")}
                </p>
              )}
            </div>

            {/* Variation Groups Rendering Section */}
            {groups.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{t("pleaseReviewYourSelection")}</span>
              </div>
            )}

            {groups.map((group, gi) => (
              <OptionGroup
                key={group.id || gi}
                group={group}
                selections={selections[group.name]}
                onChange={(val) =>
                  setSelections((prev) => ({
                    ...prev,
                    [group.name]: val,
                  }))
                }
              />
            ))}
          </div>

          {/* Footer Workspace Action Buttons */}
          <div className="
            p-4 flex items-center gap-3
            border-t border-black/10 dark:border-white/10
            bg-white/80 dark:bg-black/20 backdrop-blur
          ">
            <div className="
              flex items-center gap-2.5 rounded-full px-3 py-1.5
              bg-gray-100 dark:bg-white/5
              border border-gray-200 dark:border-white/10
            ">
              <button 
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="text-gray-600 dark:text-white/60 transition-transform active:scale-95"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[16px] text-center">
                {quantity}
              </span>

              <button 
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="text-gray-600 dark:text-white/60 transition-transform active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button
              onClick={handleAdd}
              className="
                flex-1 rounded-xl h-11 font-semibold text-sm mx-2
                relative overflow-hidden
                bg-primary text-primary-foreground
                shadow-md hover:shadow-xl
                transition-all duration-300 ease-out
                hover:-translate-y-[1px] active:translate-y-0
              "
            >
              {t('addToCart')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);


}





  // return (
  //   <AnimatePresence>
  //     {open && (
  //       <motion.div
  //         initial={{ opacity: 0 }}
  //         animate={{ opacity: 1 }}
  //         exit={{ opacity: 0 }}
  //         transition={{ duration: 0.2 }}
  //         className="
  //           fixed inset-0 z-[60] flex items-end sm:items-center justify-center
  //           bg-white/50 dark:bg-black/50 backdrop-blur-md
  //         "
  //         onClick={onClose}
  //       >
  //         <motion.div
  //           initial={{ y: 40, opacity: 0 }}
  //           animate={{ y: 0, opacity: 1 }}
  //           exit={{ y: 40, opacity: 0 }}
  //           transition={{ duration: 0.25, ease: 'easeOut' }}
  //           onClick={e => e.stopPropagation()}
  //           className="
  //             w-full sm:max-w-md max-h-[92vh] flex flex-col overflow-hidden relative
  //             rounded-t-3xl sm:rounded-3xl
  //             bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur-2xl
  //             border border-black/10 dark:border-white/10
  //             shadow-[0_20px_80px_rgba(0,0,0,0.25)]
  //           "
  //         >
  //           {/* Subtle gold glow background pattern */}
  //           <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-amber-400/20 to-transparent dark:from-amber-500/10" />

  //           {/* Close Button */}
  //           <button
  //             onClick={onClose}
  //             className="
  //               absolute top-4 right-4 z-10 h-8 w-8 rounded-full
  //               flex items-center justify-center
  //               bg-white dark:bg-black
  //               border border-black/10 dark:border-white/10
  //               hover:bg-black/10 dark:hover:bg-white/20
  //             "
  //           >
  //             <X className="h-4 w-4 text-gray-700 dark:text-white/70" />
  //           </button>

  //           {/* Image Section Container */}
  //           <div className="relative w-full flex items-center justify-center flex-shrink-0 mt-4"
  //             style={{ minHeight: 200, maxHeight: 240 }}
  //           >
  //             {!imgError && product?.image && (
  //               <img
  //                 src={product.image}
  //                 alt={name}
  //                 className="w-full h-full object-contain drop-shadow-xl relative w-[90%]"
  //                 style={{ maxHeight: 240 }}
  //                 onError={() => setImgError(true)}
  //               />
  //             )}

  //             {(imgError || !product?.image) && (
  //               <img
  //                 src={noImage}
  //                 alt="no-image"
  //                 className="absolute w-10 h-10 opacity-50 dark:opacity-20"
  //               />
  //             )}
  //             <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#0f1117] to-transparent" />
  //           </div>

  //           {/* Scrollable Content Workspace */}
  //           <div className="flex-1 overflow-y-auto p-5 space-y-5">
  //             <div>
  //               <div className="flex justify-between items-start gap-3">
  //                 <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white capitalize">
  //                   {name}
  //                 </h2>
  //                 <p className="text-xl font-bold text-primary tracking-wider">
  //                   {activePriceObj.price}
  //                 </p>
  //               </div>

  //               {product?.details && (
  //                 <p className="py-2 text-gray-500 dark:text-white/60 text-sm mt-1 leading-relaxed font-light">
  //                   {getLocalizedField(product, "details")}
  //                 </p>
  //               )}
  //             </div>

  //             {/* ── PRICE SIZE/PORTION SELECTOR UI ─────────────────────── */}
  //             {product?.prices && product.prices.length > 1 && (
  //               <div className="space-y-2.5">
  //                 <label className="text-xs font-sans tracking-widest text-muted-foreground uppercase font-medium">
  //                   {t("Select Size / Option")}
  //                 </label>
  //                 <div className="grid grid-cols-2 gap-2">
  //                   {product.prices.map((priceOption) => {
  //                     const isSelected = String(priceOption.uid) === String(selectedPriceUid);
  //                     return (
  //                       <button
  //                         key={priceOption.uid}
  //                         type="button"
  //                         onClick={() => setSelectedPriceUid(String(priceOption.uid))}
  //                         className={`
  //                           flex flex-col items-start justify-between p-3 rounded-xl border text-left transition-all duration-200
  //                           ${isSelected 
  //                             ? "bg-primary/[0.04] border-primary shadow-sm" 
  //                             : "bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
  //                           }
  //                         `}
  //                       >
  //                         <span className={`text-xs font-sans uppercase tracking-wider font-semibold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
  //                           {priceOption.label || t("Standard")}
  //                         </span>
  //                         <span className="text-sm font-bold text-foreground mt-1">
  //                           {priceOption.price}
  //                         </span>
  //                       </button>
  //                     );
  //                   })}
  //                 </div>
  //               </div>
  //             )}

  //             {/* Variation Groups Rendering Section */}
  //             {groups.length > 0 && (
  //               <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
  //                 <AlertCircle className="h-3.5 w-3.5" />
  //                 <span>{t("pleaseReviewYourSelection")}</span>
  //               </div>
  //             )}

  //             {groups.map((group, gi) => (
  //               <OptionGroup
  //                 key={group.id || gi}
  //                 group={group}
  //                 selections={selections[group.name]}
  //                 onChange={(val) =>
  //                   setSelections((prev) => ({
  //                     ...prev,
  //                     [group.name]: val,
  //                   }))
  //                 }
  //               />
  //             ))}
  //           </div>

  //           {/* Footer Workspace Action Buttons */}
  //           <div className="
  //             p-4 flex items-center gap-3
  //             border-t border-black/10 dark:border-white/10
  //             bg-white/80 dark:bg-black/20 backdrop-blur
  //           ">
  //             <div className="
  //               flex items-center gap-2.5 rounded-full px-3 py-1.5
  //               bg-gray-100 dark:bg-white/5
  //               border border-gray-200 dark:border-white/10
  //             ">
  //               <button 
  //                 type="button"
  //                 onClick={() => setQuantity(q => Math.max(1, q - 1))}
  //                 className="text-gray-600 dark:text-white/60 transition-transform active:scale-95"
  //               >
  //                 <Minus className="h-3.5 w-3.5" />
  //               </button>

  //               <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[16px] text-center">
  //                 {quantity}
  //               </span>

  //               <button 
  //                 type="button"
  //                 onClick={() => setQuantity(q => q + 1)}
  //                 className="text-gray-600 dark:text-white/60 transition-transform active:scale-95"
  //               >
  //                 <Plus className="h-3.5 w-3.5" />
  //               </button>
  //             </div>

  //             <Button
  //               onClick={handleAdd}
  //               className="
  //                 flex-1 rounded-xl h-11 font-semibold text-sm mx-2
  //                 relative overflow-hidden
  //                 bg-primary text-primary-foreground
  //                 shadow-md hover:shadow-xl
  //                 transition-all duration-300 ease-out
  //                 hover:-translate-y-[1px] active:translate-y-0
  //               "
  //             >
  //               {t('addToCart')}
  //             </Button>
  //           </div>
  //         </motion.div>
  //       </motion.div>
  //     )}
  //   </AnimatePresence>
  // );






// export default function ProductModal({ open, product, onClose, cart_id = "" }) {
//   const { activeBranch } = useBranch();
//   const { addItem } = useCart();
//   const { t, getLocalizedField } = useLanguage();

//   const name = getLocalizedField(product, 'name') || product.default_name;

//   const [quantity, setQuantity] = useState(1);
//   const [note, setNote] = useState("");
//   const [imgError, setImgError] = useState(false);

//   // ✅ stable structure: { [groupId]: selectedOptionId }
//   const [selections, setSelections] = useState({});

//   const noImage = activeBranch?.no_image;




//   // 🔥 FIXED GROUPS (stable ID + clean structure)
//   const groups = useMemo(() => {
//     let data = product?.variations;

//     if (typeof data === "string") {
//       try {
//         data = JSON.parse(data);
//       } catch {
//         data = [];
//       }
//     }

//     if (!Array.isArray(data)) return [];

//     return data.map((groupStr, gi) => {
//       const options = groupStr.split(",").map(s => s.trim());

//       return {
//         id: `group-${gi}`, // ✅ IMPORTANT FIX
//         name: `${t("option")} ${gi + 1}`,
//         required: true,
//         multiple: false, // single select per group
//         items: options.map(opt => ({
//           id: `${gi}-${opt}`,
//           name: { def: opt }
//         }))
//       };
//     });
//   }, [product]);


//   const hasGroups = groups.length > 0;

//   // 🔥 ADD TO CART FIXED
//   const handleAdd = () => {
//     const selectedVariations = groups.flatMap((g) => {
//       const sel = selections[g.name];

//       if (!sel) return [];

//       return g.items
//         .filter(item =>
//           Array.isArray(sel)
//             ? sel.includes(item.id)
//             : sel === item.id
//         )
//         .map(item => item.name?.def);
//     });

//     addItem(product, quantity, note, selectedVariations, cart_id);
//     onClose();
//   };

//   const totalPrice = product.price * quantity;

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 0.2 }}
//         className="
//         fixed inset-0 z-[60] flex items-end sm:items-center justify-center
//         bg-white/50 dark:bg-black/50 backdrop-blur-md
//       "
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ y: 40, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           exit={{ y: 40, opacity: 0 }}
//           transition={{ duration: 0.25, ease: 'easeOut' }}
//           onClick={e => e.stopPropagation()}
//           className="
//           w-full sm:max-w-md max-h-[92vh] flex flex-col overflow-hidden relative
//           rounded-t-3xl sm:rounded-3xl

//           bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur-2xl
//           border border-black/10 dark:border-white/10
//           shadow-[0_20px_80px_rgba(0,0,0,0.25)]
//         "
//         >
//           {/* subtle gold glow */}
//           <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-amber-400/20 to-transparent dark:from-amber-500/10" />

//           {/* Close */}
//           <button
//             onClick={onClose}
//             className="
//             absolute top-4 right-4 z-10 h-8 w-8 rounded-full
//             flex items-center justify-center
//             bg-white dark:bg-black
//             border border-black/10 dark:border-white/10
//             hover:bg-black/10 dark:hover:bg-white/20
//           "
//           >
//             <X className="h-4 w-4 text-gray-700 dark:text-white/70" />
//           </button>

//           {/* Image */}
//           <div className="relative w-full flex items-center justify-center flex-shrink-0 "
//             style={{ minHeight: 200, maxHeight: 240 }}
//           >
//             {!imgError && (
//               <img
//                 src={product.image}
//                 alt={getLocalizedField(product, "name")}
//                 className="w-full h-full object-contain drop-shadow-xl relative w-[90%]"
//                 style={{ maxHeight: 240 }}
//                 onError={() => setImgError(true)}
//               />
//             )}

//             {imgError && (
//               <img
//                 src={noImage}
//                 alt="no-image"
//                 className="absolute w-10 h-10 opacity-50 dark:opacity-20"
//               />
//             )}

//             <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#0f1117] to-transparent" />
//           </div>

//           {/* Content */}
//           <div className="flex-1 overflow-y-auto p-5 space-y-5">
//             <div>
//               <div className="flex justify-between items-start gap-3">
//                 <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white capitalize">
//                   {getLocalizedField(product?.properties, "name") || product?.name}
//                 </h2>

//                 <p className="text-xl font-bold text-primary">
//                   {product.price}
//                 </p>

//               </div>

//               <p className="py-4 text-gray-500 dark:text-white/60 text-sm mt-1">
//                 {getLocalizedField(product.properties, "details")}
//               </p>

            
//             </div>

//             {groups.length > 0 && (
//               <div className="
//                 flex items-center gap-1 text-xs rounded-xl
//               ">
//                 <AlertCircle className="h-3.5 w-3.5" />
//                 <span>{t("pleaseReviewYourSelection")}</span>
//               </div>
//             )}

//             {groups.map((group, gi) => (
//               <OptionGroup
//                 key={gi}
//                 group={group}
//                 selections={selections[group.name]}
//                 onChange={(val) =>
//                   setSelections((prev) => ({
//                     ...prev,
//                     [group.name]: val,
//                   }))
//                 }
//               />
//             ))}
//           </div>

//           {/* Bottom */}
//           <div className="
//           p-4 flex items-center gap-3
//           border-t border-black/10 dark:border-white/10
//           bg-white/80 dark:bg-black/20 backdrop-blur
//         ">
//             <div className="
//             flex items-center gap-2.5 rounded-full px-3 py-1.5
//             bg-gray-100 dark:bg-white/5
//             border border-gray-200 dark:border-white/10
//           ">
//               <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
//                 className="text-gray-600 dark:text-white/60">
//                 <Minus className="h-3.5 w-3.5" />
//               </button>

//               <span className="text-sm font-bold text-gray-900 dark:text-white">
//                 {quantity}
//               </span>

//               <button onClick={() => setQuantity(q => q + 1)}
//                 className="text-gray-600 dark:text-white/60">
//                 <Plus className="h-3.5 w-3.5" />
//               </button>
//             </div>

//             <Button
//               onClick={handleAdd}
//               className="
//                 flex-1 rounded-xl h-11 font-semibold text-sm mx-2
//                 relative overflow-hidden
//                 bg-primary text-primary-foreground
//                 shadow-md hover:shadow-xl
//                 transition-all duration-300 ease-out
//                 hover:-translate-y-[1px] active:translate-y-0
//                 disabled:opacity-40 disabled:cursor-not-allowed
//               "
//             >
//               {t('addToCart')}
//             </Button>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }









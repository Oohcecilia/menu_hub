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

  const name = getLocalizedField(product, 'name') || product.default_name;

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [imgError, setImgError] = useState(false);

  // ✅ stable structure: { [groupId]: selectedOptionId }
  const [selections, setSelections] = useState({});

  const noImage = activeBranch?.no_image;




  // 🔥 FIXED GROUPS (stable ID + clean structure)
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
        id: `group-${gi}`, // ✅ IMPORTANT FIX
        name: `${t("option")} ${gi + 1}`,
        required: true,
        multiple: false, // single select per group
        items: options.map(opt => ({
          id: `${gi}-${opt}`,
          name: { def: opt }
        }))
      };
    });
  }, [product]);


  const hasGroups = groups.length > 0;

  // 🔥 ADD TO CART FIXED
  const handleAdd = () => {
    const selectedVariations = groups.flatMap((g) => {
      const sel = selections[g.name];

      if (!sel) return [];

      return g.items
        .filter(item =>
          Array.isArray(sel)
            ? sel.includes(item.id)
            : sel === item.id
        )
        .map(item => item.name?.def);
    });

    addItem(product, quantity, note, selectedVariations, cart_id);
    onClose();
  };

  const totalPrice = product.price * quantity;

  return (
    <AnimatePresence>
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
          {/* subtle gold glow */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-amber-400/20 to-transparent dark:from-amber-500/10" />

          {/* Close */}
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

          {/* Image */}
          <div className="relative w-full flex items-center justify-center flex-shrink-0 "
            style={{ minHeight: 200, maxHeight: 240 }}
          >
            {!imgError && (
              <img
                src={product.image}
                alt={getLocalizedField(product, "name")}
                className="w-full h-full object-contain drop-shadow-xl relative"
                style={{ maxHeight: 240 }}
                onError={() => setImgError(true)}
              />
            )}

            {imgError && (
              <img
                src={noImage}
                alt="no-image"
                className="absolute w-10 h-10 opacity-50 dark:opacity-20"
              />
            )}

            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#0f1117] to-transparent" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white uppercase">
                {name}
              </h2>

              {product?.name?.def &&
                product?.name?.def !== getLocalizedField(product, "name") && (
                  <span className="text-xs text-muted-foreground uppercase">
                    {product.name.def}
                  </span>
                )}

              <p className="text-gray-500 dark:text-white/60 text-sm mt-1">
                {getLocalizedField(product, "description")}
              </p>

              {product?.description?.def &&
                product?.description?.def !== getLocalizedField(product, "description") && (
                  <span className="text-xs text-muted-foreground/70 block mt-0.5">
                    {product.description.def}
                  </span>
                )}

              <p className="text-xl font-bold text-primary mt-2">
                {product.price?.toFixed(2)}
              </p>
            </div>

            {groups.length > 0 && (
              <div className="
                flex items-center gap-1 text-xs rounded-xl
              ">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{t("pleaseReviewYourSelection")}</span>
              </div>
            )}

            {groups.map((group, gi) => (
              <OptionGroup
                key={gi}
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


            <textarea
              placeholder={t('specialInstructions')}
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              className="
              w-full rounded-xl px-3 py-2.5 text-sm resize-none
              bg-gray-100 dark:bg-white/5
              border border-gray-200 dark:border-white/10
              text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-white/30
              focus:outline-none focus:ring-2 focus:ring-amber-400/40
            "
            />
          </div>

          {/* Bottom */}
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
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="text-gray-600 dark:text-white/60">
                <Minus className="h-3.5 w-3.5" />
              </button>

              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {quantity}
              </span>

              <button onClick={() => setQuantity(q => q + 1)}
                className="text-gray-600 dark:text-white/60">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button
              onClick={handleAdd}
              className="
                flex-1 rounded-xl h-11 font-semibold text-sm
                relative overflow-hidden
                bg-primary text-primary-foreground
                shadow-md hover:shadow-xl
                transition-all duration-300 ease-out
                hover:-translate-y-[1px] active:translate-y-0
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {t('addToCart')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}










// export default function ProductModal({ product, onClose }) {
//   const { activeBranch } = useBranch();
//   const { addItem } = useCart();
//   const { t, getLocalizedField } = useLanguage();
//   const [quantity, setQuantity] = useState(1);
//   const [note, setNote] = useState('');
//   // selections: { [groupIndex]: string | string[] }
//   const [selections, setSelections] = useState({});

//   const noImage = activeBranch?.no_image;



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
//         name: `Option ${gi + 1}`,
//         required: true,
//         multiple: true,
//         items: options.map(opt => ({
//           id: `${gi}-${opt}`,
//           name: { def: opt }
//         }))
//       };
//     });
//   }, [product]);

//   const isValid = useMemo(() => {
//     return groups.every((group) => {
//       if (!group?.required) return true;

//       const sel = selections[group.name];

//       if (group.multiple) {
//         return Array.isArray(sel) && sel.length > 0;
//       }

//       return sel !== undefined && sel !== null;
//     });
//   }, [selections, groups]);

//   const hasGroups = groups.length > 0;
//   const canAdd = !hasGroups || isValid;

//   const handleAdd = () => {
//     if (!canAdd) return;

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

//     addItem(product, quantity, note, selectedVariations);
//     onClose();
//   };
//   const totalPrice = product.price * quantity;

// return (
//   <AnimatePresence>
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.2 }}
//       className="
//         fixed inset-0 z-50 flex items-end sm:items-center justify-center
//         bg-black/20 backdrop-blur-md
//       "
//       onClick={onClose}
//     >
//       <motion.div
//         initial={{ y: 40, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         exit={{ y: 40, opacity: 0 }}
//         transition={{ duration: 0.25, ease: 'easeOut' }}
//         onClick={e => e.stopPropagation()}
//         className="
//           w-full sm:max-w-md max-h-[92vh] flex flex-col overflow-hidden relative
//           rounded-t-3xl sm:rounded-3xl

//           bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur-2xl
//           border border-black/10 dark:border-white/10
//           shadow-[0_20px_80px_rgba(0,0,0,0.25)]
//         "
//       >
//         {/* subtle gold glow */}
//         <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-amber-400/20 to-transparent dark:from-amber-500/10" />

//         {/* Close */}
//         <button
//           onClick={onClose}
//           className="
//             absolute top-4 right-4 z-10 h-8 w-8 rounded-full
//             flex items-center justify-center
//             bg-black/5 dark:bg-white/10
//             border border-black/10 dark:border-white/10
//             hover:bg-black/10 dark:hover:bg-white/20
//           "
//         >
//           <X className="h-4 w-4 text-gray-700 dark:text-white/70" />
//         </button>

//         {/* Image */}
//         <div className="relative w-full flex items-center justify-center flex-shrink-0"
//           style={{ minHeight: 200, maxHeight: 240 }}
//         >
//           {product.image ? (
//             <img
//               src={product.image}
//               alt={getLocalizedField(product, 'name')}
//               className="w-full object-contain drop-shadow-xl"
//               style={{ maxHeight: 240 }}
//             />
//           ) : (
//             <img src={noImage} alt="no-image" className="w-10 h-10 " />
//           )}

//           <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#0f1117] to-transparent" />
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-5 space-y-5">
//           <div>
//             <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">
//               {getLocalizedField(product, "name")}
//             </h2>

//             {product?.name?.def &&
//               product?.name?.def !== getLocalizedField(product, "name") && (
//                 <span className="text-xs text-muted-foreground">
//                   {product.name.def}
//                 </span>
//               )}

//             <p className="text-gray-500 dark:text-white/60 text-sm mt-1">
//               {getLocalizedField(product, "description")}
//             </p>

//             {product?.description?.def &&
//               product?.description?.def !== getLocalizedField(product, "description") && (
//                 <span className="text-xs text-muted-foreground/70 block mt-0.5">
//                   {product.description.def}
//                 </span>
//               )}

//             <p className="text-xl font-bold text-primary mt-2">
//               ${product.price?.toFixed(2)}
//             </p>
//           </div>

//           {groups.map((group, gi) => (
//             <OptionGroup
//               key={gi}
//               group={group}
//               selections={selections[group.name]}
//               onChange={(val) =>
//                 setSelections((prev) => ({
//                   ...prev,
//                   [group.name]: val,
//                 }))
//               }
//             />
//           ))}


//           <textarea
//             placeholder={t('specialInstructions')}
//             value={note}
//             onChange={e => setNote(e.target.value)}
//             rows={2}
//             className="
//               w-full rounded-xl px-3 py-2.5 text-sm resize-none
//               bg-gray-100 dark:bg-white/5
//               border border-gray-200 dark:border-white/10
//               text-gray-900 dark:text-white
//               placeholder:text-gray-400 dark:placeholder:text-white/30
//               focus:outline-none focus:ring-2 focus:ring-amber-400/40
//             "
//           />
//         </div>

//         {/* Bottom */}
//         <div className="
//           p-4 flex items-center gap-3
//           border-t border-black/10 dark:border-white/10
//           bg-white/80 dark:bg-black/20 backdrop-blur
//         ">
//           <div className="
//             flex items-center gap-2.5 rounded-full px-3 py-1.5
//             bg-gray-100 dark:bg-white/5
//             border border-gray-200 dark:border-white/10
//           ">
//             <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
//               className="text-gray-600 dark:text-white/60">
//               <Minus className="h-3.5 w-3.5" />
//             </button>

//             <span className="text-sm font-bold text-gray-900 dark:text-white">
//               {quantity}
//             </span>

//             <button onClick={() => setQuantity(q => q + 1)}
//               className="text-gray-600 dark:text-white/60">
//               <Plus className="h-3.5 w-3.5" />
//             </button>
//           </div>

//           <Button
//             onClick={handleAdd}
//             disabled={!canAdd}
//             className="
//                 flex-1 rounded-xl h-11 font-semibold text-sm
//                 relative overflow-hidden
//                 bg-primary text-primary-foreground
//                 shadow-md hover:shadow-xl
//                 transition-all duration-300 ease-out
//                 hover:-translate-y-[1px] active:translate-y-0
//                 disabled:opacity-40 disabled:cursor-not-allowed
//               "
//           >
//             {t('addToCart')} — ${totalPrice.toFixed(2)}
//           </Button>
//         </div>
//       </motion.div>
//     </motion.div>
//   </AnimatePresence>
// );
//  }


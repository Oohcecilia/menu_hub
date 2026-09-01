import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, AlertCircle, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext';
import { getDefaultLocalizedText, getDisplayPrices, isSpecialProduct, isVegetarianProduct, selectProductPrice } from '@/utils/menuData';



function SpecialBadge() {
  return (
    <span className="ml-2 inline-flex translate-y-[-2px] items-center rounded-full bg-red-600 px-2 py-0.5 align-middle text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-sm">
      special
    </span>
  );
}

function VegetarianLeaf() {
  return (
    <Leaf className="ml-1.5 inline-block h-4 w-4 translate-y-[-1px] fill-green-500/20 text-green-600" aria-label="Vegetarian" />
  );
}


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

function ComponentChoiceGroup({ title, items, selectedUids, onToggle, prefix = "", tone = "green" }) {
  const { getLocalizedField } = useLanguage();
  const selectedToneClass = tone === "red" ? "text-red-600" : "text-green-600";

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="space-y-1 m-0">
      <p className="text-xs font-semibold text-gray-800 dark:text-white">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item) => {
          const uid = String(item.uid ?? item.id ?? item.name);
          const selected = selectedUids.includes(uid);
          const price = Number(item.price);
          const name =
            getLocalizedField(item, 'translations') ||
            getLocalizedField(item, 'name') ||
            item.name;

          return (
            <button
              key={uid}
              type="button"
              onClick={() => onToggle(uid)}
              className={`
                w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl transition-all duration-200
                ${selected
                  ? "bg-[color:var(--primary)/0.08]"
                  : "hover:bg-gray-50 dark:hover:bg-white/10"}
              `}
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={`
                    h-5 w-5 flex flex-shrink-0 items-center justify-center rounded border-2 border-gray-500 bg-white shadow-sm transition dark:border-white/60 dark:bg-black/40
                  `}
                >
                  {selected && <Check className={`h-4 w-4 stroke-[3] ${selectedToneClass}`} />}
                </div>

                <span className="truncate text-sm font-medium text-gray-800 dark:text-white">
                  {prefix}{name}
                </span>
              </div>

              {Number.isFinite(price) && price > 0 && (
                <span className="flex-shrink-0 text-xs font-semibold tracking-widest text-primary">
                  {item.price}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PriceChoiceGroup({ prices, selectedPriceUid, onSelect }) {
  if (prices.length <= 1) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-xs rounded-xl text-gray-700 dark:text-white/70">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Select a price option</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {prices.map((priceOption, index) => {
          const id = priceOption.uid || `${priceOption.label}-${index}`;
          const isSelected = selectedPriceUid === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`
                flex items-center justify-between gap-3 rounded-xl border px-3 py-2
                transition-colors
                ${isSelected
                  ? "border-primary bg-primary/10"
                  : "border-black/10 bg-white/50 hover:border-primary/50 dark:border-white/10 dark:bg-white/5"}
              `}
            >
              <span className="font-serif text-sm capitalize text-gray-900 dark:text-white">
                {priceOption.label || "Regular"}
              </span>
              <span className="font-semibold tracking-widest text-primary">
                {priceOption.price}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


export default function ProductModal({ open, product, onClose, cart_id = "", cartItem = null }) {
  const { activeBranch } = useBranch();
  const { addItem } = useCart();
  const { t, getLocalizedField } = useLanguage();

  const name = getLocalizedField(product, 'translations') || getLocalizedField(product, 'name') || product?.default_name || product?.name;

  const [quantity, setQuantity] = useState(cartItem?.quantity || 1);
  const [note, setNote] = useState(cartItem?.note || "");
  const [imgError, setImgError] = useState(false);

  // ✅ stable structure: { [groupId]: selectedOptionId }
  const [selections, setSelections] = useState({});
  const [selectedAddonUids, setSelectedAddonUids] = useState([]);
  const [selectedRemovableUids, setSelectedRemovableUids] = useState([]);
  const prices = useMemo(() => getDisplayPrices(product), [product]);
  const hasMultiplePrices = prices.length > 1;
  const [selectedPriceUid, setSelectedPriceUid] = useState("");

  const noImage = activeBranch?.no_image;

  useEffect(() => {
    if (cartItem?.price_uid || cartItem?.product_id) {
      setSelectedPriceUid(String(cartItem.price_uid || cartItem.product_id));
      return;
    }

    if (prices.length === 1) {
      setSelectedPriceUid(prices[0].uid || `${prices[0].label}-0`);
      return;
    }

    setSelectedPriceUid("");
  }, [prices, cartItem?.price_uid, cartItem?.product_id]);

  useEffect(() => {
    setQuantity(cartItem?.quantity || 1);
    setNote(cartItem?.note || "");
  }, [cartItem?.cart_id, cartItem?.quantity, cartItem?.note, product?.id]);

  useEffect(() => {
    const variations = Array.isArray(cartItem?.variations) ? cartItem.variations : [];

    setSelectedAddonUids(
      variations
        .filter((variation) => variation?.type === "addon" && variation?.uid != null)
        .map((variation) => String(variation.uid))
    );
    setSelectedRemovableUids(
      variations
        .filter((variation) => variation?.type === "removable" && variation?.uid != null)
        .map((variation) => String(variation.uid))
    );
  }, [cartItem?.cart_id, cartItem?.variations, product?.id]);




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

  useEffect(() => {
    if (!cartItem?.variations || !groups.length) {
      setSelections({});
      return;
    }

    const variationNames = cartItem.variations
      .map((variation) => {
        if (typeof variation === "string") return variation;
        return variation?.name || "";
      })
      .filter(Boolean);

    const nextSelections = {};

    groups.forEach((group) => {
      const match = group.items.find((item) => {
        const itemName = item.name?.def || item.name;
        return variationNames.includes(itemName);
      });

      if (match) {
        nextSelections[group.name] = match.id;
      }
    });

    setSelections(nextSelections);
  }, [cartItem?.cart_id, cartItem?.variations, groups]);


  const hasGroups = groups.length > 0;

  const toggleAddon = useCallback((uid) => {
    setSelectedAddonUids((prev) =>
      prev.includes(uid) ? prev.filter((item) => item !== uid) : [...prev, uid]
    );
  }, []);

  const toggleRemovable = useCallback((uid) => {
    setSelectedRemovableUids((prev) =>
      prev.includes(uid) ? prev.filter((item) => item !== uid) : [...prev, uid]
    );
  }, []);

  // 🔥 ADD TO CART FIXED
  const handleAdd = () => {
    const selectedPrice = hasMultiplePrices
      ? prices.find((priceOption, index) =>
        (priceOption.uid || `${priceOption.label}-${index}`) === selectedPriceUid
      )
      : prices[0];

    if (!selectedPrice) return;

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

    const selectedAddons = (product?.addons || [])
      .filter((addon) => selectedAddonUids.includes(String(addon.uid ?? addon.id ?? addon.name)))
      .map((addon) => {
        const addonName =
          getLocalizedField(addon, 'translations') ||
          getLocalizedField(addon, 'name') ||
          addon.name;
        return {
          type: 'addon',
          uid: addon.uid ?? addon.id,
          name: `Add: ${addonName}`,
          price: Number(addon.price) || 0,
        };
      });

    const selectedRemovables = (product?.removables || [])
      .filter((removable) => selectedRemovableUids.includes(String(removable.uid ?? removable.id ?? removable.name)))
      .map((removable) => {
        const removableName =
          getLocalizedField(removable, 'translations') ||
          getLocalizedField(removable, 'name') ||
          removable.name;
        return {
          type: 'removable',
          uid: removable.uid ?? removable.id,
          name: `No: ${removableName}`,
          price: Number(removable.price) || 0,
        };
      });

    addItem(
      selectProductPrice(product, selectedPrice),
      quantity,
      note,
      [...selectedVariations, ...selectedAddons, ...selectedRemovables],
      cart_id
    );
    onClose();
  };

  const canAdd = !hasMultiplePrices || Boolean(selectedPriceUid);

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
              <div className="relative flex h-full w-[90%] items-center justify-center">
                <img
                  src={product.image}
                  alt={getLocalizedField(product, "name")}
                  className="relative h-full w-full object-contain drop-shadow-xl"
                  style={{ maxHeight: 240 }}
                  onError={() => setImgError(true)}
                />
              </div>
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
              <div className="flex justify-between items-start gap-3">
                <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white capitalize">
                  {name}
                  {isVegetarianProduct(product) && <VegetarianLeaf />}
                  {isSpecialProduct(product) && <SpecialBadge />}
                </h2>
              </div>

              <p className="py-4 text-gray-500 dark:text-white/60 text-sm mt-1">
                {getLocalizedField(product, "details") || getLocalizedField(product.properties, "details") || getDefaultLocalizedText(product?.details?.description, "")}
              </p>

            
            </div>

            <PriceChoiceGroup
              prices={prices}
              selectedPriceUid={selectedPriceUid}
              onSelect={setSelectedPriceUid}
            />

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

            <ComponentChoiceGroup
              title="Addons"
              items={product?.addons}
              selectedUids={selectedAddonUids}
              onToggle={toggleAddon}
              prefix="Add: "
              tone="green"
            />

            <ComponentChoiceGroup
              title="Remove"
              items={product?.removables}
              selectedUids={selectedRemovableUids}
              onToggle={toggleRemovable}
              prefix="No: "
              tone="red"
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
              disabled={!canAdd}
              className="
                flex-1 rounded-xl h-11 font-semibold text-sm mx-2
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

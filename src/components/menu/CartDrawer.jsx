import { useState, useMemo } from 'react';
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
}) {
  if (!product) return null;


  const { activeBranch } = useBranch();

  const price = product.price || 0;
  const total = price * item.quantity;
  const name = product.name?.def;
  const image = product.image;
  const noImage = activeBranch?.no_image

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
      <div className="flex gap-3 p-3">

        {Boolean(image) && (
          <img
            src={image}
            alt={product.product_name}
            className="h-14 w-14 rounded-lg object-contain bg-muted flex-shrink-0 p-1"
          />
        )}


        {/* NAME + PRICE */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {name}
          </p>

          <p className="text-xs text-muted-foreground truncate">
            {variations.join(", ")}
          </p>

          <p className="text-primary font-bold text-sm">
            ${total.toFixed(2)}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          <button
            onClick={() => updateQuantity(index, item.quantity - 1)}
            className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold hover:bg-secondary/80 transition-colors"
          >
            −
          </button>

          <span className="text-sm font-bold w-4 text-center">
            {item.quantity}
          </span>

          <button
            onClick={() => updateQuantity(index, item.quantity + 1)}
            className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold hover:bg-secondary/80 transition-colors"
          >
            +
          </button>

          <button
            onClick={() => removeItem(index)}
            className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors ml-0.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* NOTE */}
      <div className="px-3 pb-3">
        <input
          type="text"
          placeholder={`📝 ${t("note")}...`}
          value={item.note || ""}
          onChange={(e) => updateNote(index, e.target.value)}
          className="w-full text-xs rounded-lg border border-input bg-secondary/50 px-2.5 py-1.5 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}


export default function CartDrawer({ open, onClose, products, subtotal = 0 }) {
  const {
    items,
    updateQuantity,
    updateNote,
    removeItem,
    total,
    itemCount,
    orderNote,
    setOrderNote,
  } = useCart();

  const { activeBranch } = useBranch();

  const { t } = useLanguage();
  const navigate = useNavigate();

  const [placing, setPlacing] = useState(false);

  // ---------------------------
  // FAST PRODUCT LOOKUP (IMPORTANT)
  // ---------------------------
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  // ---------------------------
  // PLACE ORDER
  // ---------------------------
  const handlePlaceOrder = async () => {
    if (!items.length || placing) return;

    setPlacing(true);

    try {
      const orderData = {
        id: "order-" + Date.now(),
        order_number: generateOrderNumber(),
        buid: activeBranch?.buid || '',
        items: items.map((item) => {
          const product = productMap.get(item.product_id);
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            note: item.note || undefined,
          };
        }),
        status: "placed",
        created_at: new Date().toISOString(),
      };

      // Save full orders
      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      localStorage.setItem(
        "orders",
        JSON.stringify([orderData, ...existingOrders])
      );

      // Save lightweight history (IDs only)
      // try {
      //   const prev = JSON.parse(localStorage.getItem("order_history") || "[]");

      //   const updatedHistory = [
      //     orderData.id,
      //     ...prev.filter((id) => id !== orderData.id),
      //   ].slice(0, 20);

      //   localStorage.setItem(
      //     "order_history",
      //     JSON.stringify(updatedHistory)
      //   );
      // } catch (e) {
      //   console.warn("Failed to save order history", e);
      // }

      // clearCart?.();
      onClose?.();

      navigate(`/order-confirmation/${orderData.id}`);
    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setPlacing(false);
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
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
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card shadow-2xl flex flex-col"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="text-lg font-serif font-bold">
                {t("yourCart")}
              </h2>

              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="font-medium">{t("emptyCart")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("emptyCartDesc")}
                  </p>
                </div>
              ) : (
                <>
                  {items.map((item, index) => {
                    const product = productMap.get(item.product_id);

                    return (
                      <CartItem
                        key={item.product_id || index}
                        item={item}
                        product={product}
                        index={index}
                        updateQuantity={updateQuantity}
                        updateNote={updateNote}
                        removeItem={removeItem}
                        t={t}
                      />
                    );
                  })}

                  {/* ORDER NOTE */}
                  {/* <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 px-0.5">
                      {t("orderNote")}
                    </p>

                    <textarea
                      placeholder={t("orderNotePlaceholder")}
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                    />
                  </div> */}
                </>
              )}
            </div>

            {/* FOOTER */}
            {items.length > 0 && (
              <div className="p-5 border-t border-border/50 space-y-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("total")}</span>
                  <span className="text-primary">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={placing || !items.length}
                  className="w-full h-12 rounded-2xl bg-primary font-semibold text-base"
                >
                  {placing
                    ? t("placing")
                    : `${t("placeOrder")} · ${itemCount} ${itemCount === 1 ? t("item") : t("items")
                    }`}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
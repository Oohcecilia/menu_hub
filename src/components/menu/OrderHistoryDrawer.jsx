import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Clock, ChefHat, Bell, CheckCircle, XCircle, ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { buildOrderSummary } from '@/utils/orderUtils'
import { useBranch } from '@/lib/BranchContext.jsx';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cartStore.jsx';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ready: { label: 'Ready', icon: Bell, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  completed: { label: 'Done', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
};

export const moveToSelection = ( orders, orderId, products , addItem, onClose, setIsOpen,
) => {
  const order = orders.find(
    (o) => String(o.id) === String(orderId)
  );

  console.log(`ORDERS ${JSON.stringify(orders)} ===== ORDER ${JSON.stringify(order)}`);

  if (!order?.items?.length) {
    console.warn("Order not found:", orderId);
    return;
  }

  // 🔥 faster lookup map
  const productMap = Object.fromEntries(
    products.map((p) => [String(p.id), p])
  );

  order.items.forEach((item, index) => {
    const product =
      productMap[String(item.product_id)];

    if (!product) {
      console.warn(
        "Product not found:",
        item.product_id
      );
      return;
    }

    addItem(
      product,
      Number(item.quantity) || 1,
      item.note || "",
      item.variations || [],
      `${Date.now()}-${index}-${Math.random()
        .toString(16)
        .slice(2)}`
    );
  });

  onClose?.();
  setIsOpen?.(true);
};

export const removeOrderById = (
  orderId,
  setOrders
)=> {
  setOrders((prev) => {
    const updated = prev.filter(
      (o) => String(o.id) !== String(orderId)
    );

    localStorage.setItem(
      "orders",
      JSON.stringify(updated)
    );

    return updated;
  });
};

function OrderCard({
  order,
  products,
  orders,
  setOrders,
  onClose,
  setIsOpen
}) {

  console.log("OD", orders)
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const { t, getLocalizedField } = useLanguage();
  const { addItem } = useCart();

  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;


  // 🔥 FAST LOOKUP MAP
  const productMap = useMemo(() => {
    return Object.fromEntries(
      (products || []).map(p => [String(p.id), p])
    );
  }, [products]);


  const { prodInfo, subtotal } = useMemo(() => {
    return buildOrderSummary(order?.items, productMap);
  }, [order?.items, productMap]);


  return (
    <div className="bg-background rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-colors">
      {/* Top row */}
      <div className="flex items-center justify-between pt-3 pb-2">
        <span className="font-serif text-sm text-muted-foreground ml-2">{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
        <div className="flex items-center text-xs font-medium p-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 mx-2">
          <Trash2 onClick={() =>
            removeOrderById(order.id, setOrders)
          } className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Items preview */}
      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground truncate">
          {(prodInfo || [])
            .map((i) => {
              const product = productMap[String(i.product_id)];

              return `${i.quantity}×${product
                ? getLocalizedField(product, "name")
                : i.name
                }`;
            })
            .join(", ")}
        </p>

        <p className="text-xs text-muted-foreground mt-0.5">
          {itemCount} {itemCount !== 1 ? t("items") : t("item")} · <span className="font-semibold text-foreground">{subtotal.toFixed(2)}</span>
        </p>
      </div>

      {/* Action links */}
      <div className="flex border-t border-border/40">
        <Link
          to={`/order-confirmation/${order.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          {t("placeOrder")}
        </Link>
        <div className="w-px bg-border/40" />
        <Button
          onClick={() =>
            moveToSelection(
              orders,
              order.id,
              products,
              addItem,
              onClose,
              setIsOpen
            )
          }
          variant="link"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        >
          Move to Selection
        </Button>
      </div>
    </div>
  );
}

export default function OrderHistoryDrawer({ products, open, onClose, setIsOpen }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();
  const { activeBranch } = useBranch();

  // ✅ LOAD ORDERS ONLY
  useEffect(() => {
    if (!open) return;

    setLoading(true);

    try {
      const stored = JSON.parse(localStorage.getItem('orders') || '[]');

      const normalized = stored.map(order => {
        const rawDate = order.created_at || order.created_date;
        const parsed = rawDate ? new Date(rawDate) : null;

        return {
          ...order,
          _parsedDate: parsed && !isNaN(parsed) ? parsed : null,
        };
      });

      const sorted = normalized.sort((a, b) => {
        if (!a._parsedDate && !b._parsedDate) return 0;
        if (!a._parsedDate) return 1;
        if (!b._parsedDate) return -1;
        return b._parsedDate - a._parsedDate;
      });

      setOrders(sorted);

    } catch (e) {
      console.error('Failed to load orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }


    if (open) {
      document.documentElement.classList.add("overflow-hidden");
    } else {
      document.documentElement.classList.remove("overflow-hidden");
    }

    return () => {
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [open]);


  // ✅ FILTER BY BRANCH (CORRECT PLACE)
  const visibleOrders = useMemo(() => {
    return orders.filter(order => {
      return (
        !activeBranch?.buid ||
        order?.buid === activeBranch?.buid
      );
    });
  }, [orders, activeBranch?.buid]);

  // ✅ EMPTY STATE LOGIC
  const hasAnyOrders = orders.length > 0;
  const hasVisibleOrders = visibleOrders.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div>
                <h2 className="text-lg font-serif font-bold">
                  {t("orderHistory")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("recentOrder")}
                </p>
              </div>

              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* LOADING */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-secondary animate-pulse"
                    />
                  ))}
                </div>

              ) : /* NO ORDERS AT ALL */
                !hasAnyOrders || !hasVisibleOrders ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/25 mb-4" />
                    <p className="font-medium text-sm">
                      {t("no_past_orders")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("orders_placeholder")}
                    </p>
                  </div>

                ) : (
                  /* ORDERS LIST */
                  visibleOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      products={products}
                      orders={orders}
                      setOrders={setOrders}
                      onClose={onClose}
                      setIsOpen={setIsOpen}
                    />
                  ))
                )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
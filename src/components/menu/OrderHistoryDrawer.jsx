import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChefHat, Bell, CheckCircle, XCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { buildOrderSummary } from '@/utils/orderUtils'
import { useBranch } from '@/lib/BranchContext.jsx';
import { useLanguage } from '@/lib/i18n';

const STATUS_CONFIG = {
    pending: { label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    preparing: { label: 'Preparing', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    ready: { label: 'Ready', icon: Bell, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    completed: { label: 'Done', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
};

function OrderCard({ order, products }) {

    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

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
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">{order.order_number}</span>
                    {order.table_number && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            Table {order.table_number}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500">
                    <CheckCircle className="h-3 w-3" />
                    Order placed
                </div>
            </div>

            {/* Items preview */}
            <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground truncate">
                    {prodInfo.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </p>

                <p className="text-xs text-muted-foreground mt-0.5">
                    {itemCount} item{itemCount !== 1 ? 's' : ''} · <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
                    <span className="ml-2">{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
                </p>
            </div>

            {/* Action links */}
            <div className="flex border-t border-border/40">
                <Link
                    to={`/order-confirmation/${order.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                    View receipt <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}

export default function OrderHistoryDrawer({ products, open, onClose }) {
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
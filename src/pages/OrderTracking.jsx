import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ChefHat, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/lib/i18n';
import { format } from 'date-fns';

const statusSteps = [
  { key: 'pending', icon: Clock },
  { key: 'preparing', icon: ChefHat },
  { key: 'ready', icon: Bell },
  { key: 'completed', icon: CheckCircle },
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const { t } = useLanguage();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrder = () => {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const found = orders.find(o => o.id === orderId);
    setOrder(found || null);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!orderId) return;

    // initial load
    setTimeout(loadOrder, 300);

    // 🔄 simulate refetch every 10s
    const interval = setInterval(loadOrder, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-64 w-80 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium mb-4">Order not found</p>
          <Link to="/">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToMenu')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50"
      >
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-serif font-bold">{t('orderDetails')}</h1>
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Order Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border/50 text-center"
        >
          <p className="text-sm text-muted-foreground">{t('orderNumber')}</p>
          <p className="text-2xl font-bold font-mono tracking-wider text-primary mt-1">
            {order.order_number}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t('placedAt')}: {format(new Date(order.created_at), 'PPp')}
          </p>
          {order.customer_name && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('customer')}: {order.customer_name}
            </p>
          )}
          {order.table_number && (
            <p className="text-sm text-muted-foreground">
              {t('table')}: {order.table_number}
            </p>
          )}
        </motion.div>

        {/* Status Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 border border-border/50"
        >
          <h2 className="font-semibold mb-6">{t('status')}</h2>

          {isCancelled ? (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-xl">
              <XCircle className="h-6 w-6 text-destructive" />
              <span className="font-medium text-destructive">{t('cancelled')}</span>
            </div>
          ) : (
            <div>
              {statusSteps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{
                          scale: isCurrent ? 1.1 : 1,
                          backgroundColor: isActive
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--muted))',
                        }}
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            isActive
                              ? 'text-primary-foreground'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </motion.div>

                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            isActive ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      )}
                    </div>

                    <div className="pt-2">
                      <p
                        className={`font-medium text-sm ${
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {t(step.key)}
                      </p>

                      {isCurrent && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                          <span className="text-xs text-primary font-medium">
                            Current
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-border/50"
        >
          <h2 className="font-semibold mb-4">{t('orderSummary')}</h2>

          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground">
                    {item.quantity}x
                  </span>
                  <div>
                    <span>{item.product_name}</span>
                    {item.note && (
                      <p className="text-xs text-muted-foreground italic">
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                </div>

                <span className="font-medium">
                  ${ (item.price * item.quantity).toFixed(2) }
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 mt-4 pt-4 flex justify-between text-lg font-bold">
            <span>{t('total')}</span>
            <span className="text-primary">
              ${order.total?.toFixed(2)}
            </span>
          </div>
        </motion.div>

        {/* Back */}
        <Link to="/" className="block">
          <Button variant="outline" className="w-full h-12 rounded-2xl font-semibold">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToMenu')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
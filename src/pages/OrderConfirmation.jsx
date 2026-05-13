import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import QRCode from '@/components/menu/QrCode';
import { useLanguage } from '@/lib/i18n';
import { useBranch } from '@/lib/BranchContext.jsx';
import { buildOrderSummary } from '@/utils/orderUtils';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { t, getLocalizedField } = useLanguage();
  const { products } = useBranch();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (!orderId) return;

    let alive = true;

    async function load() {
      setIsLoading(true);

      try {
        await new Promise(r => setTimeout(r, 300));

        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const found = orders.find(o => o.id === orderId);

        if (!alive) return;

        setOrder(found || null);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [orderId]);


  const productMap = useMemo(() => {
    return Object.fromEntries(
      (products || []).map(p => [String(p.id), p])
    );
  }, [products]);

  const { prodInfo, subtotal } = useMemo(() => {
    return buildOrderSummary(order?.items, productMap);
  }, [order?.items, productMap]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-48 mx-auto rounded-xl" />
          <Skeleton className="h-48 w-48 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium mb-4">{t("noResults")}</p>
          <Link to="/">
            <Button variant="outline" className="rounded-full hover:bg-green-400/10 hover:text-white transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToMenu')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const trackingUrl = `${window.location.origin}/order/${orderId}`;

  return (
    <div className="min-h-screen bg-background">
{/* 
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50"
      >
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/">
            <Button size="icon" className="
                                  rounded-full h-9 w-9
                                  bg-transparent hover:bg-gray-100 text-gray
                                  hover:bg-green-400/10
                                  hover:text-primary
                                  transition-colors
                                ">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-serif font-bold">{t('guestCheckout')}</h1>
        </div>
      </motion.div> */}

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Success Animation */}
        {/* <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4"
          >
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-3xl font-serif font-bold text-foreground mb-2"
          >
            {t('orderPlaced')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground"
          >
            {t('orderSuccess')}
          </motion.p>
        </motion.div> */}

        {/* Order Number */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card rounded-2xl p-6 border border-border/50 text-center mb-6"
        >
          <p className="text-sm text-muted-foreground mb-1">{t('orderNumber')}</p>
          <p className="text-2xl font-bold font-mono tracking-wider text-primary">
            {order.order_number}
          </p>
        </motion.div> */}

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-card rounded-2xl p-8 border border-border/50 flex flex-col items-center justify-center mb-6"
        >
          <QRCode order={order} value={trackingUrl} size={200} />
          <p className="font-serif text-lg  mt-4 text-center">
            {t('scanQR')}
          </p>
        </motion.div>

        {/* Order Summary */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-card rounded-2xl p-5 border border-border/50 mb-6"
        >
          <h2 className="font-semibold mb-4">{t('orderSummary')}</h2>
          <div className="space-y-3">
            {(prodInfo || []).map((item, index) => {
              const product = productMap[String(item.product_id)];

              return (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">
                      {item.quantity}x
                    </span>

                    <span>
                      {product
                        ? getLocalizedField(product, "name")
                        : product.default_name}
                    </span>
                  </div>

                  <span className="font-medium">
                    {item.total.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border/50 mt-4 pt-4 flex justify-between text-lg font-bold">
            <span>{t('total')}</span>
            <span className="text-primary">
              {subtotal.toFixed(2)}
            </span>
          </div>
        </motion.div> */}


        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="space-y-3"
        >

          <Link to="/" className="block">
            <Button variant="outline" className="w-full h-12 rounded-2xl font-semibold hover:bg-green-400/10 hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToMenu')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
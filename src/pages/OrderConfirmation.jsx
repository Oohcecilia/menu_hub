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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">

        {/* QR Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="
          relative overflow-hidden
          rounded-3xl
          border border-border/50
          bg-card/80 backdrop-blur-xl
          shadow-2xl
          px-6 py-8
        "
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/30 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">

            {/* QR Wrapper */}
            <div
              className="
              rounded-3xl
              bg-white
              p-5
              shadow-lg
              border border-border/40
            "
            >
              <QRCode
                order={order}
                value={trackingUrl}
                size={220}
              />
            </div>

            {/* Title */}
            <h1 className="mt-6 font-serif text-xl font-bold tracking-tight text-center">
              {t("scanQR")}
            </h1>

            {/* Divider */}
            <div className="w-16 h-1 rounded-full bg-primary/30 mt-6" />

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full mt-8"
            >
              <Link to="/" className="block w-full">
                <Button
                  variant="outline"
                  className="
                  w-full h-12 rounded-2xl
                  font-semibold
                  border-border/60
                  bg-background/60
                  hover:bg-primary/10
                  hover:text-primary
                  transition-all duration-200
                "
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("backToMenu")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
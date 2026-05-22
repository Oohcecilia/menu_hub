import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import QRCode from '@/components/menu/QrCode';
import { useLanguage } from '@/lib/i18n';
import { useBranch } from '@/lib/BranchContext.jsx';
import { useCart } from '@/lib/cartStore.jsx';
import { buildOrderSummary } from '@/utils/orderUtils';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t, getLocalizedField } = useLanguage();
  const { addItem } = useCart();
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
  const waiterSuggestions = Array.isArray(order.waiter_suggestions) ? order.waiter_suggestions : [];

  const getSuggestionProductForCart = (product) => {
    const firstPrice = Array.isArray(product?.prices) ? product.prices[0] : null;
    const productUid = String(product?.product_uid || product?.id || product?.name || '');
    const priceUid = firstPrice?.uid ? String(firstPrice.uid) : String(product?.id || productUid);
    const priceLabel = firstPrice?.label || '';
    const baseName = product?.name || productUid;

    return {
      ...product,
      id: priceUid,
      uid: productUid,
      product_uid: productUid,
      price_uid: priceUid,
      price_label: priceLabel,
      price: firstPrice?.price || 0,
      name: priceLabel ? `${baseName} ${priceLabel}` : baseName,
      default_name: priceLabel ? `${baseName} ${priceLabel}` : baseName,
      base_name: baseName,
    };
  };

  const handleSuggestionClick = (product) => {
    const productName = product?.name || '';
    if (!productName) return;

    addItem(getSuggestionProductForCart(product), 1);
    sessionStorage.setItem('openSelection', '1');
    sessionStorage.setItem(
      'menuSuggestionFocus',
      JSON.stringify({
        product_uid: product.product_uid || product.id,
        name: productName,
      })
    );

    navigate(`/?suggestion=${encodeURIComponent(productName)}&selection=1`);
  };

  const handleCategoryClick = (category) => {
    if (!category) return;

    sessionStorage.setItem('menuCategoryFocus', category);
    navigate(`/?category=${encodeURIComponent(category)}`);
  };

  const getSuggestionCategories = (suggestion) => {
    const categories = (suggestion.products || [])
      .map((product) => product.category)
      .filter(Boolean);

    return [...new Set(categories)];
  };

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

            {waiterSuggestions.length > 0 && (
              <div className="mt-6 w-full space-y-3 rounded-2xl border border-border/60 bg-background/70 p-4 text-left">
                <p className="text-sm font-bold text-foreground">
                  {t("chefSuggestions")}
                </p>

                {waiterSuggestions.map((suggestion, index) => (
                  <div key={`${suggestion.type || 'suggestion'}-${index}`} className="space-y-1">
                    <p className="text-sm font-semibold text-primary">
                      {suggestion.title}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {suggestion.message}
                    </p>

                    {(Array.isArray(suggestion.products) && suggestion.products.length > 0) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {suggestion.products.map((product) => {
                          const category = product.category;

                          return (
                            <span
                              key={`${suggestion.type || 'suggestion'}-${product.product_uid || product.id || product.name}`}
                              className="inline-flex max-w-full flex-wrap items-center gap-1.5"
                            >
                              <button
                                type="button"
                                onClick={() => handleSuggestionClick(product)}
                                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold capitalize text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                              >
                                {product.name}
                              </button>

                              {category && (
                                <button
                                  type="button"
                                  onClick={() => handleCategoryClick(category)}
                                  className="rounded-full border border-border/60 px-2.5 py-1.5 text-xs font-semibold capitalize text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                >
                                  {t("viewCategory")} {category}
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

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

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Pointer } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';

export default function FloatingCartButton({ subtotal=0, onClick }) {
  const { itemCount } = useCart();
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.button
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClick}
          className="fixed bottom-6 right-5 z-40 flex items-center gap-3 bg-primary text-primary-foreground pl-4 pr-5 py-3 rounded-2xl shadow-lg shadow-primary/25 font-semibold text-sm hover:bg-primary/95 transition-colors"
        >
          {/* Badge */}
          <div className="relative flex-shrink-0">
            <Pointer className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center leading-none">
              {itemCount}
            </span>
          </div>
          <span>{t('viewOrder')}</span>
          {/* <span className="h-4 w-px bg-white/30" />
          <span className="font-bold">{subtotal.toFixed(2)}</span> */}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
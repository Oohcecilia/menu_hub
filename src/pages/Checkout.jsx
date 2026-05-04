// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { ArrowLeft } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Link, useNavigate } from 'react-router-dom';
// import { useCart } from '@/lib/cartStore.jsx';
// import { useLanguage } from '@/lib/i18n.jsx';

// function generateOrderNumber() {
//   return '#' + Math.random().toString(36).substr(2, 6).toUpperCase();
// }

// export default function Checkout() {
//   const { items, total, subtotal, orderNote, clearCart } = useCart();
//   const { t } = useLanguage();
//   const navigate = useNavigate();
//   const [customerName, setCustomerName] = useState('');
//   const [tableNumber, setTableNumber] = useState('');
//   const [placing, setPlacing] = useState(false);

//   const handlePlaceOrder = async () => {
//     setPlacing(true);
//     const orderData = {
//       order_number: generateOrderNumber(),
//       customer_name: customerName || undefined,
//       table_number: tableNumber || undefined,
//       items: items.map(item => ({
//         product_id: item.product_id,
//         product_name: item.product_name,
//         quantity: item.quantity,
//         price: item.price,
//         note: item.note || undefined,
//       })),
//       subtotal,
//       total,
//       status: 'pending',
//       order_note: orderNote || undefined,
//     };

//     clearCart();
//     navigate(`/order-confirmation/${created.id}`);
//   };

//   if (items.length === 0) {
//     return (
//       <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
//         <p className="text-5xl mb-4">🛒</p>
//         <p className="text-lg font-medium mb-4">{t('emptyCart')}</p>
//         <Link to="/"><Button variant="outline" className="rounded-full"><ArrowLeft className="mr-2 h-4 w-4" />{t('backToMenu')}</Button></Link>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
//         <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
//           <Link to="/"><Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><ArrowLeft className="h-4 w-4" /></Button></Link>
//           <h1 className="text-lg font-serif font-bold">{t('guestCheckout')}</h1>
//         </div>
//       </motion.div>

//       <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
//         {/* Guest Info */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 border border-border/50 space-y-3">
//           <h2 className="font-semibold">{t('guestInfo')}</h2>
//           <Input placeholder={`${t('nameOptional')} (${t('optional')})`} value={customerName} onChange={e => setCustomerName(e.target.value)} className="rounded-xl h-11" />
//           <Input placeholder={`${t('tableOptional')} (${t('optional')})`} value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="rounded-xl h-11" />
//         </motion.div>

//         {/* Order Summary */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-5 border border-border/50">
//           <h2 className="font-semibold mb-4">{t('yourOrder')}</h2>
//           <div className="space-y-3">
//             {items.map((item, index) => (
//               <div key={index} className="flex justify-between text-sm">
//                 <div className="flex gap-2">
//                   <span className="text-muted-foreground">{item.quantity}x</span>
//                   <div>
//                     <span>{item.product_name}</span>
//                     {item.note && <p className="text-xs text-muted-foreground italic">📝 {item.note}</p>}
//                   </div>
//                 </div>
//                 <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
//               </div>
//             ))}
//           </div>
//           <div className="border-t border-border/50 mt-4 pt-4 flex justify-between text-lg font-bold">
//             <span>{t('total')}</span>
//             <span className="text-primary">${total.toFixed(2)}</span>
//           </div>
//         </motion.div>

//         {/* Place Order */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//           <Button onClick={handlePlaceOrder} disabled={placing} className="w-full h-13 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90">
//             {placing ? t('placing') : t('placeOrder')}
//           </Button>
//         </motion.div>
//       </div>
//     </div>
//   );
// }



import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext';

function generateOrderNumber() {
  return '#' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

export default function Checkout() {
  const { items, total, subtotal, orderNote, clearCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { activeBranch } = useBranch();

  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!items.length || placing) return;

    setPlacing(true);

    try {
      const orderData = {
        id: 'order-' + Date.now(), // ✅ required for routing + history
        order_number: generateOrderNumber(),
        customer_name: customerName || undefined,
        table_number: tableNumber || undefined,
        buid: activeBranch?.buid || '',
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          note: item.note || undefined,
        })),
        subtotal,
        total,
        status: 'pending',
        order_note: orderNote || undefined,
        created_at: new Date().toISOString(), // ✅ important
      };

      // ✅ save full orders list
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = [orderData, ...existingOrders];
      localStorage.setItem('orders', JSON.stringify(updatedOrders));

      // ✅ optional: keep lightweight history (IDs only)
      // try {
      //   const prev = JSON.parse(localStorage.getItem('order_history') || '[]');
      //   const updatedHistory = [orderData.id, ...prev.filter(id => id !== orderData.id)].slice(0, 20);
      //   // localStorage.setItem('order_history', JSON.stringify(updatedHistory));
      // } catch (e) {
      //   console.warn('Failed to save order history', e);
      // }

      clearCart();

      // ✅ redirect using local ID
      navigate(`/order-confirmation/${orderData.id}`);

    } catch (err) {
      console.error('Order failed:', err);
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <p className="text-lg font-medium mb-4">{t('emptyCart')}</p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToMenu')}
          </Button>
        </Link>
      </div>
    );
  }

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
          <h1 className="text-lg font-serif font-bold">{t('guestCheckout')}</h1>
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Guest Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border/50 space-y-3"
        >
          <h2 className="font-semibold">{t('guestInfo')}</h2>
          <Input
            placeholder={`${t('nameOptional')} (${t('optional')})`}
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="rounded-xl h-11"
          />
          <Input
            placeholder={`${t('tableOptional')} (${t('optional')})`}
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            className="rounded-xl h-11"
          />
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 border border-border/50"
        >
          <h2 className="font-semibold mb-4">{t('yourOrder')}</h2>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground">{item.quantity}x</span>
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
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 mt-4 pt-4 flex justify-between text-lg font-bold">
            <span>{t('total')}</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </motion.div>

        {/* Place Order */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full h-13 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90"
          >
            {placing ? t('placing') : t('placeOrder')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
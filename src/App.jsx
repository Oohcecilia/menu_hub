import { useState } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { LanguageProvider } from '@/lib/i18n.jsx';
import { CartProvider } from '@/lib/cartStore.jsx';
import { ThemeProvider } from '@/lib/themeToggle.jsx';
import Menu from '@/pages/Menu';
import Checkout from '@/pages/Checkout';
import OrderConfirmation from '@/pages/OrderConfirmation';
import OrderTracking from '@/pages/OrderTracking';
import VIPIndex from '@/pages/vip/VIPIndex';
import VIPRegister from '@/pages/vip/VIPRegister';
import VIPDashboard from '@/pages/vip/VIPDashboard';
import { VIPAuthProvider } from '@/lib/VIPAuthContext.jsx';
import { BranchProvider } from '@/lib/BranchContext.jsx';
import { useVIPAuth } from "@/lib/VIPAuthContext";

const AuthenticatedApp = () => {
  const { isAuthenticated } = useAuth();
  const { vipUser } = useVIPAuth();

  return (
    <Routes>
      {/* ---------------- PUBLIC MENU (NO AUTH) ---------------- */}
      <Route path="/" element={<Menu />} />
      <Route path="/branch/:branchSlug" element={<Menu />} />

      {/* ---------------- PUBLIC ORDER PAGES ---------------- */}
      <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
      <Route path="/order/:orderId" element={<OrderTracking />} />

      {/* ---------------- VIP PAGES (NO GLOBAL AUTH REQUIRED) ---------------- */}
      {/* <Route path="/vip" element={<VIPIndex />} />
      <Route path="/vip/register" element={<VIPRegister />} />

      <Route
        path="/vip/dashboard"
        element={
          vipUser
            ? <VIPDashboard />
            : <Navigate to="/vip/register" replace />
        }
      /> */}

      {/* ---------------- FALLBACK ---------------- */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};
function App({ session, settings }) {
  return (
    <AuthProvider
      initialUser={session?.user}
      initialPublicSettings={settings}
    >
      <BranchProvider>
        <VIPAuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <CartProvider>
                <QueryClientProvider client={queryClientInstance}>
                  <Router>
                    <AuthenticatedApp />
                  </Router>
                  <Toaster />
                </QueryClientProvider>
              </CartProvider>
            </LanguageProvider>
          </ThemeProvider>
        </VIPAuthProvider>
      </BranchProvider>
    </AuthProvider>
  );
}

export default App
import React, { useState } from 'react';
import { Sun, Moon, Crown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/themeToggle.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext.jsx';
import OrderHistoryDrawer from '@/components/menu/OrderHistoryDrawer.jsx';
import { useIsMobile } from "@/hooks/use-mobile"


const LANGUAGES = [
  { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' }, { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' }, { code: 'it', label: 'IT' }, { code: 'zh', label: '中' },
  { code: 'ja', label: '日' }, { code: 'ko', label: '한' }, { code: 'ru', label: 'РУ' },
  { code: 'fil', label: 'FIL' },
];

export default function Header({ products, setIsOpen }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const { activeBranch } = useBranch();
  const [historyOpen, setHistoryOpen] = useState(false);
  const isMobile = useIsMobile()
  
  const noImage = activeBranch?.no_image;
  const brandName = activeBranch?.brand_name || 'The Menu';
  const brandTagline = activeBranch?.brand_tagline || 'Crafted with care';
  const brandLogo = activeBranch?.logo || noImage;
  const nav_logo = activeBranch?.nav_logo || brandLogo;

  // Check if user has any order history
  const hasHistory = (() => {
    try {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');

      if (!activeBranch?.buid) return orders.length > 0;

      return orders.some(order => order.buid === activeBranch.buid);
    } catch {
      return false;
    }
  })();

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-2.5">
            {brandLogo ? (
              <img
                src={nav_logo}
                alt="brand"
                className="w-8 h-8 object-contain"
              />
            ) : (
              <span className="text-2xl">🍽️</span>
            )}

            <div>
              <p className="font-serif font-bold text-lg leading-tight tracking-tight">{brandName}</p>
              <p className="text-[10px] font-serif text-muted-foreground leading-none tracking-widest uppercase">{brandTagline}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* <Link to="/vip">
              <Button variant="outline" size="sm" className="rounded-full h-8 px-3 gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-500/60 text-xs font-semibold">
                <Crown className="h-3.5 w-3.5" />
                VIP
              </Button>
            </Link> */}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              className="relative rounded-full h-9 w-9 text-muted-foreground transition-colors transition-colors hover:text-[hsl(var(--primary)/0.85)] hover:bg-[hsl(var(--primary)/0.5)"
              title="Order history"
            >
              <History  className="h-4 w-4" />
              {hasHistory && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9 transition-colors hover:text-[hsl(var(--primary)/0.85)] hover:bg-[hsl(var(--primary)/0.5)">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="text-xs bg-secondary border-0 rounded-full px-2.5 py-1.5 text-foreground cursor-pointer focus:outline-none"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>


          </div>
        </div>
      </header>

      <OrderHistoryDrawer
        products={products}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        setIsOpen={setIsOpen}
      />
    </>
  );
}
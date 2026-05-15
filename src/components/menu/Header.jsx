import React, { useState } from 'react';
import { Check, ChevronDown, Sun, Moon, Crown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const currentLanguage = LANGUAGES.find(language => language.code === lang) || LANGUAGES[0];
  
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Language"
                  className="inline-flex h-9 min-w-16 items-center justify-center gap-1 rounded-full bg-secondary px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <span>{currentLanguage.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-24 rounded-xl p-1">
                {LANGUAGES.map(language => {
                  const selected = language.code === lang;

                  return (
                    <DropdownMenuItem
                      key={language.code}
                      onClick={() => setLang(language.code)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-base font-semibold"
                    >
                      <span>{language.label}</span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>


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

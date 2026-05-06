import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n.jsx';
import { getCategoryIcon } from '@/utils/icons';
import { Sparkles } from "lucide-react";

export default function CategoryNav({ categories = [], activeCategory, onSelect }) {
  const { t, getLocalizedField } = useLanguage();
  const navRef = useRef(null);
  const [showRight, setShowRight] = useState(false);

  const ALL = "__all__";

  // ✅ New Click Handler
  const handleCategoryClick = (id) => {
    // 1. Update the category filter
    onSelect(id);
    
    // 2. Scroll window to top smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // ✅ optimized scroll checker
  const checkOverflow = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth;
    const notAtEnd = el.scrollLeft + el.clientWidth < el.scrollWidth - 5;
    setShowRight(hasOverflow && notAtEnd);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    checkOverflow();
    el.addEventListener("scroll", checkOverflow);
    window.addEventListener("resize", checkOverflow);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [checkOverflow, categories]);

  const items = [
    { id: ALL, icon: Sparkles, label: t("all") },
    ...categories.map(c => ({
      id: c.id,
      icon: getCategoryIcon(getLocalizedField(c, "name")),
      label: getLocalizedField(c, "name"),
    })),
  ];

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-border/30">
      <div className="max-w-5xl mx-auto px-4 py-2.5 relative">
        <nav
          ref={navRef}
          className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar" // Added no-scrollbar for cleaner look
        >
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => handleCategoryClick(item.id)} // ✅ Updated this line
              className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                ${activeCategory === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }
              `}
            >
              <span className="flex items-center">
                {item.icon && <item.icon size={16} className="text-current" />}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {showRight && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 flex items-center justify-end bg-gradient-to-l from-background to-transparent">
            <span className="pr-2 text-muted-foreground text-lg">›</span>
          </div>
        )}
      </div>
    </div>
  );
}
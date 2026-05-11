import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n.jsx';
import { getCategoryIcon } from '@/utils/icons';
import { motion } from 'framer-motion';

export default function CategoryNav({ categories = [], activeCategory, onSelect }) {
  const { getLocalizedField } = useLanguage();
  const navRef = useRef(null);
  const activeButtonRef = useRef(null);

  useEffect(() => {
    const activeEl = activeButtonRef.current;

    if (!activeEl) return;

    activeEl.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeCategory]);

  const items = categories.map((c) => {
    const trans = c.name?.translation;

    return {
      id: c.id,
      iconName: getLocalizedField(c, 'name'),
      label: trans
        ? getLocalizedField(c?.name, "translation")
        : c?.name?.en,
    };
  });


  return (
    <div className="bg-background/95 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-5xl mx-auto px-4 py-2.5">
        <nav ref={navRef} className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5 no-scrollbar">
          {items.map(item => {
            const isActive = activeCategory === item.id;
            const Icon = getCategoryIcon(item.iconName);

            return (
              <button
                key={item.id ?? '__all__'}
                ref={isActive ? activeButtonRef : null}
                onClick={() => onSelect(item.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-300
                ${isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="cat-pill"
                    className="absolute inset-0 rounded-full bg-primary shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}

                <span className="relative z-10">
                  {Icon && <Icon size={16} className="text-current" />}
                </span>

                <span className="relative z-10">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

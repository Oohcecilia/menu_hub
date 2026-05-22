import React from 'react';
import { useLanguage } from '@/lib/i18n.jsx';
import { motion } from 'framer-motion';

export default function CategoryNav({
  categories = [],
  activeCategory,
  onSelect,
  subcategories = [],
  onSubcategorySelect,
}) {
  const { getLocalizedField } = useLanguage();

  const items = categories.map((c) => {

    const name = c.name
    const translation = getLocalizedField(c, "name")

    return {
      id: c.id,
      label: translation || c.label || c?.name?.en || name,
    };
  });

  const shouldShowSubcategories = subcategories.length > 1;

  return (
    <div className="bg-background/95 backdrop-blur-xl border-border/30">
      <div className="max-w-5xl mx-auto px-4 py-2.5">
        <nav className="flex flex-wrap items-center justify-start gap-1.5 pb-0.5">
          {items.map(item => {
            const isActive = activeCategory === item.id;

            return (
              <div key={item.id ?? '__all__'} className="relative flex flex-col items-center">
                <button
                  onClick={() => onSelect(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-300 capitalize touch-manipulation
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
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>

        {shouldShowSubcategories && (
          <div className="mt-2 flex flex-wrap justify-start gap-1.5">
            {subcategories.map(subcategory => (
              <button
                key={subcategory.id}
                onClick={() => onSubcategorySelect?.(subcategory)}
                className="rounded-full bg-secondary/70 px-3 py-1.5 text-xs font-medium capitalize text-foreground transition-colors hover:bg-primary hover:text-primary-foreground touch-manipulation"
              >
                {subcategory.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

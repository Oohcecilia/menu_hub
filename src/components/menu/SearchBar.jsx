import React from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n.jsx';

export default function SearchBar({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 py-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('searchMenu')}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-10 pl-10 pr-9 rounded-full bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
import { getDisplayPrices } from '@/utils/menuData';

export default function PriceOptions({ product, className = "" }) {
  const prices = getDisplayPrices(product);

  return (
    <div className={`flex flex-wrap items-center justify-end gap-x-3 gap-y-1 ${className}`}>
      {prices.map((priceOption, index) => (
        <span
          key={priceOption.uid || `${priceOption.label}-${index}`}
          className="inline-flex items-baseline gap-1 text-primary whitespace-nowrap"
        >
          {priceOption.label && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {priceOption.label}
            </span>
          )}
          <span className="font-light tracking-widest text-base">
            {priceOption.price}
          </span>
        </span>
      ))}
    </div>
  );
}

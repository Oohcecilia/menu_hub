import { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext.jsx';
import { getDisplayPrices, getMenuProductTitle, isSpecialProduct, isVegetarianProduct } from '@/utils/menuData';


/* ─── Cart hook ─────────────────────────────────────────────────── */
function useProductCart(product) {
    const {
        getProductQuantity,
        addItem,
        items,
        updateQuantity,
        removeItem,
        itemMatchesProduct,
    } = useCart();

    // safer + memoized id
    const productId = product?.id;

    // prevent null crash
    const qty = useMemo(() => {
        if (!productId) return 0;
        return getProductQuantity(product) || 0;
    }, [product, productId, getProductQuantity]);

    const handleMinus = useCallback((e) => {
        e.stopPropagation();

        if (!productId) return;

        const cartItems = items.filter(
            (i) => itemMatchesProduct(i, product)
        );

        if (!cartItems.length) return;

        const last = cartItems[cartItems.length - 1];

        const lastIndex = items.findIndex((i) => i === last);

        if (lastIndex < 0) return;

        if ((last?.quantity || 0) > 1) {
            updateQuantity(lastIndex, last.quantity - 1);
        } else {
            removeItem(lastIndex);
        }
    }, [
        items,
        productId,
        product,
        itemMatchesProduct,
        updateQuantity,
        removeItem,
    ]);

    const handlePlus = useCallback((e) => {
        e.stopPropagation();

        if (!product) return;

        addItem(product, 1);
    }, [product, addItem]);

    return {
        qty,
        handleMinus,
        handlePlus,
    };
}

/* ─── Minimal add button ────────────────────────────────────────── */
function AddBtn({ product, onOpen }) {
    const { qty, handleMinus, handlePlus } = useProductCart(product);

    const hasVariations =
        Array.isArray(product?.variations)
            ? product.variations.length > 0
            : !!product?.variations;

    return qty === 0 ? (
        <motion.button
            whileTap={{ scale: 0.85 }}
            disabled={hasVariations}
            onClick={handlePlus}
            className={`
    h-6 w-6 rounded-full border border-primary/35
    flex items-center justify-center
    transition-all duration-200
    ${hasVariations
                    ? "cursor-not-allowed opacity-60 text-primary/60"
                    : "text-primary hover:bg-primary hover:text-primary-foreground"
                }
  `}
        >
            <Plus className="h-3 w-3" />
        </motion.button>

    ) : (
        <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-foreground/8 border border-primary backdrop-blur-sm">
            <button
                onClick={handleMinus}
                className="h-5 w-5 flex items-center justify-center text-foreground/60 hover:text-foreground"
            >
                <Minus className="h-2.5 w-2.5" />
            </button>

            <span className="text-foreground text-xs font-bold w-3 text-center">
                {qty}
            </span>

            <button
                onClick={handlePlus}
                className="h-5 w-5 flex items-center justify-center text-foreground/60 hover:text-foreground"
            >
                <Plus className="h-2.5 w-2.5 text-primary" />
            </button>
        </div>
    );
}

/* ─── Floating product image with ambient glow ──────────────────── */
function FloatImage({ src, alt, size, float = true, caption, isSpecial = false }) {
    const { activeBranch } = useBranch();
    const noImage = activeBranch?.no_image;
    const image = src || noImage;
    const [isPortrait, setIsPortrait] = useState(false);

    const imageClassName = isPortrait
        ? "relative z-10 h-[90vw] w-auto max-w-full object-contain drop-shadow-2xl transition-transform duration-300 ease-out sm:h-[var(--image-size)] sm:hover:scale-[1.55]"
        : "relative z-10 h-auto max-h-[90vw] w-auto max-w-full object-contain drop-shadow-2xl transition-transform duration-300 ease-out sm:max-h-[var(--image-size)] sm:hover:scale-[1.55]";

    return (
        <div
            className="flex w-[90vw] flex-col items-center sm:w-[var(--image-size)]"
            style={{ "--image-size": `${size}px` }}
        >
            <motion.div
                className="relative z-30 flex w-full items-center justify-center pt-4 sm:hover:z-50"
            >
                {src && (
                    <>
                        {/* ambient glow */}
                        <div
                            className="absolute rounded-full opacity-25 blur-2xl"
                            style={{
                                width: size * 0.85, height: size * 0.85,
                                backgroundImage: `url(${src})`, backgroundSize: 'cover',
                                top: '10%', left: '7.5%',
                            }}
                        />
                        {/* soft shadow beneath */}
                        <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full opacity-20 blur-xl"
                            style={{ width: size * 0.6, height: size * 0.15, background: '--primary' }}
                        />
                    </>
                )}
                <div className="relative z-10 inline-flex max-w-full">
                    <img
                        src={image}
                        alt={alt}
                        className={imageClassName}
                        onLoad={(event) => {
                            const img = event.currentTarget;
                            setIsPortrait(img.naturalHeight > img.naturalWidth);
                        }}
                        style={{ filter: 'drop-shadow(0 12px 28px --primary)' }}
                    />
                    {isSpecial && (
                        <span className="absolute right-0 top-0 z-20 -translate-y-1/2 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-md">
                            special
                        </span>
                    )}
                </div>
            </motion.div>
            {caption && (
                <div className="relative z-10 mt-[10px] w-full text-center">
                    {caption}
                </div>
            )}
        </div>
    );
}

function FeaturedPriceChoices({ product, className = "", priceClassName = "text-sm" }) {
    const prices = getDisplayPrices(product);

    return (
        <span className={`${className} inline-flex flex-wrap items-baseline gap-x-2 gap-y-1`}>
            {prices.map((priceOption, index) => {
                const optionLabel = priceOption.label || "";

                return (
                    <span
                        key={priceOption.uid || `${priceOption.label}-${index}`}
                        className={`inline-flex items-baseline gap-1 font-bold tracking-widest text-primary ${priceClassName}`}
                    >
                        {optionLabel && (
                            <span className="max-w-[8rem] truncate font-serif text-xs capitalize tracking-normal text-foreground/70">
                                {optionLabel}
                            </span>
                        )}
                        <span>
                            {priceOption.price}
                        </span>
                    </span>
                );
            })}
        </span>
    );
}

function SpecialBadge() {
    return (
        <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full bg-red-600 px-2 py-0.5 align-middle text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-sm">
            special
        </span>
    );
}

function VegetarianLeaf() {
    return (
        <Leaf className="ml-1.5 inline-block h-4 w-4 translate-y-[-1px] fill-green-500/20 text-green-600" aria-label="Vegetarian" />
    );
}

function ImageCaption({ name, product, qty }) {
    return (
        <div className="flex min-w-0 items-start justify-center gap-2">
            <p className="min-w-0 truncate font-serif capitalize font-medium leading-snug text-foreground">
                {name}
                {isVegetarianProduct(product) && <VegetarianLeaf />}
                {qty > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 translate-y-[-1px] items-center justify-center rounded-full bg-green-500 px-1.5 align-middle text-xs font-semibold leading-none text-white shadow-sm">
                        {qty}
                    </span>
                )}
            </p>
            <FeaturedPriceChoices product={product} priceClassName="text-sm" />
        </div>
    );
}


/* ─── Small card ─────────────────────────────────────────────────── */
function SmallCard({ product, onOpen, size = 110, delay = 0, showAdd = true }) {
    const { getLocalizedField } = useLanguage();
    const name = getMenuProductTitle(product, getLocalizedField);
    const { qty } = useProductCart(product);

    return (
        <motion.div
            onClick={() => onOpen(product)}
            className="flex flex-col items-center cursor-pointer group"
        >
            <FloatImage
                src={product.image}
                alt={name}
                size={size}
                isSpecial={isSpecialProduct(product)}
                caption={<ImageCaption name={name} product={product} qty={qty} />}
            />
        </motion.div>
    );
}

function LayoutGrandStage({ products, onOpen, isAll }) {
    const { getLocalizedField } = useLanguage();

    const layout = useMemo(() => {
        const items = [...products];

        const hero =
            items.length === 1
                ? items[0]
                : items.length >= 3
                    ? items[2]
                    : null;

        let gridItems = [];

        if (items.length === 1) {
            gridItems = [];
        }

        if (items.length === 2) {
            gridItems = [items[0], items[1]];
        }

        if (items.length === 3) {
            gridItems = [items[0], items[1]];
        }

        if (items.length === 4) {
            gridItems = [items[0], items[1], items[3]];
        }

        if (items.length === 5) {
            gridItems = [items[0], items[1], items[3], items[4]];
        }

        if (items.length > 5) {
            const firstBatch = [items[0], items[1], items[3], items[4]];
            const rest = items.slice(5);
            gridItems = [...firstBatch, ...rest];
        }

        return { hero, gridItems };
    }, [products]);

    const renderCard = (product, idx) => {
        if (!product) return null;

        return (
            <SmallCard
                key={product?.id || idx}
                product={product}
                onOpen={onOpen}
                size={200}
                delay={0.3 + idx * 0.15}
            />
        );
    };


    const { hero, gridItems } = layout;
    const { qty = 0 } = useProductCart(hero || {});
    const heroName = hero ? getMenuProductTitle(hero, getLocalizedField) : "";

    return (
        <div className="relative w-full overflow-hidden sm:overflow-visible">

            {/* background glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse 60% 50% at 50% 60%, var(--primary) 0%, transparent 70%)",
                }}
            />

            {/* ================= GRID STAGE ================= */}
            <div className="flex flex-col items-center gap-10 sm:gap-12">

                {/* TOP GRID ROW (2 items max) */}
                {gridItems.length >= 2 && (
                    <div className="flex flex-col sm:flex-row justify-evenly items-center w-full gap-6 sm:gap-10">
                        {renderCard(gridItems[0], 0)}
                        {renderCard(gridItems[1], 1)}
                    </div>
                )}

                {/* HERO CENTER */}
                {hero && (
                    <div className="flex flex-col items-center z-10">
                        <motion.div
                            onClick={() => onOpen(hero)}
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <FloatImage
                                src={hero.image}
                                alt={hero.name_en}
                                size={200}
                                isSpecial={isSpecialProduct(hero)}
                                caption={<ImageCaption name={heroName} product={hero} qty={qty} />}
                            />
                        </motion.div>
                    </div>
                )}

                {/* BOTTOM GRID (2 items per row, responsive wrap) */}
                {gridItems.length > 2 && (
                    <div className="flex flex-col sm:flex-row flex-wrap justify-evenly items-center w-full gap-6 sm:gap-10">
                        {gridItems.slice(2).map((p, idx) => renderCard(p, idx + 2))}
                    </div>
                )}

            </div>
        </div>
    );
}
/* ─── Layout registry ────────────────────────────────────────────── */
const LAYOUTS = [LayoutGrandStage];

/* ─── Main export ─────────────────────────────────────────────────── */
export default function FeaturedSection({ products, activeCategory, onProductOpen }) {
    const { t } = useLanguage();
    if (products.length === 0) return null;


    const isAll = activeCategory === "__all__";

    const layoutIndex = activeCategory
        ? activeCategory.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        : 0;

    const LayoutComponent = LAYOUTS[layoutIndex % LAYOUTS.length];

    return (
        <motion.section
            key={activeCategory ?? '__all__'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
        >
            <LayoutComponent products={products} onOpen={onProductOpen} isAll={isAll} />
        </motion.section>
    );
}

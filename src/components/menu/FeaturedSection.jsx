import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext.jsx';
import { getDisplayPrices, selectProductPrice } from '@/utils/menuData';


/* ─── Cart hook ─────────────────────────────────────────────────── */
function useProductCart(product) {
    const {
        getProductQuantity,
        addItem,
        items,
        updateQuantity,
        removeItem,
    } = useCart();

    // safer + memoized id
    const productId = product?.id;

    // prevent null crash
    const qty = useMemo(() => {
        if (!productId) return 0;
        return getProductQuantity(productId) || 0;
    }, [productId, getProductQuantity]);

    const handleMinus = useCallback((e) => {
        e.stopPropagation();

        if (!productId) return;

        const cartItems = items.filter(
            (i) => i?.product_id === productId
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
function FloatImage({ src, alt, size, float = true }) {
    const { activeBranch } = useBranch();
    const noImage = activeBranch?.no_image;
    const image = src || noImage;
    return (
        <div
            className="relative flex h-[90vw] w-[90vw] items-center justify-center sm:h-[var(--image-size)] sm:w-[var(--image-size)]"
            style={{ "--image-size": `${size}px` }}
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
            <img
                src={src} alt={alt}
                className="relative z-10 h-full w-full object-contain drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 12px 28px --primary)' }}
            />
        </div>
    );
}

/* ─── Floating animation wrapper ────────────────────────────────── */
function FloatWrap({ children, delay = 0, amplitude = 6 }) {
    return (
        <motion.div
            animate={{ y: [0, -amplitude, 0] }}
            transition={{ repeat: Infinity, duration: 4 + delay * 0.5, ease: 'easeInOut', delay }}
        >
            {children}
        </motion.div>
    );
}

function FeaturedPriceChoices({ product, onOpen, name, align = "center" }) {
    const prices = getDisplayPrices(product);

    return (
        <div className={`mt-2 flex flex-wrap gap-2 ${align === "center" ? "justify-center" : "justify-start"}`}>
            {prices.map((priceOption, index) => {
                const optionName = priceOption.label ? `${name} ${priceOption.label}` : name;

                return (
                    <button
                        key={priceOption.uid || `${priceOption.label}-${index}`}
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpen(selectProductPrice(product, priceOption));
                        }}
                        className="
                            inline-flex items-center gap-2 rounded-full border border-primary/25
                            bg-background/80 px-3 py-1.5 text-left shadow-sm backdrop-blur
                            hover:border-primary/60 hover:bg-primary/10 transition-colors
                        "
                    >
                        <span className="max-w-[12rem] truncate font-serif text-sm capitalize text-foreground/85">
                            {optionName}
                        </span>
                        <span className="text-sm font-semibold tracking-widest text-primary">
                            {priceOption.price}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}


/* ─── Small card ─────────────────────────────────────────────────── */
function SmallCard({ product, onOpen, size = 110, delay = 0, showAdd = true }) {
    const { getLocalizedField } = useLanguage();
    const name = product.default_name || product.name || getLocalizedField(product.properties, 'name');
    const { qty } = useProductCart(product);

    return (
        <motion.div
            onClick={() => onOpen(product)}
            className="flex flex-col items-center cursor-pointer group"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            <FloatWrap delay={delay} amplitude={5}>
                <FloatImage src={product.image} alt={name} size={size} />
            </FloatWrap>
            <div className="mt-2 w-full text-center">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-start gap-2">
                        <p className="font-serif capitalize font-light text-foreground/80 tracking-wide truncate">
                            {name}
                        </p>
                        {qty > 0 && (
                            <div className="flex-shrink-0 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm" >
                                {qty}
                            </div>
                        )}
                    </div>
                    {/* {showAdd && <AddBtn product={product} onOpen={onOpen} />} */}
                </div>
                <FeaturedPriceChoices product={product} onOpen={onOpen} name={name} />
            </div>
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
            gridItems = [items[0], items[1], items[2], items[3]];
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
                            whileHover={{ scale: 1.03 }}
                            transition={{ duration: 0.4 }}
                        >
                            <FloatWrap delay={0} amplitude={9}>
                                <FloatImage src={hero.image} alt={hero.name_en} size={200} />
                            </FloatWrap>

                            <div className="text-center mt-2">

                                <div className="flex items-center justify-center gap-3 mt-1.5">
                                    <div className="min-w-0 flex items-start gap-2"></div>
                                    <p className="font-serif capitalize font-light text-xl text-foreground/95 tracking-wide">
                                        {hero.default_name || hero.name || getLocalizedField(hero.properties, "name")}
                                    </p>
                                    {qty > 0 && (
                                        <div
                                            className="
                                                flex-shrink-0
                                                flex items-center justify-center
                                                min-w-5 h-5 px-1
                                                rounded-full
                                                bg-primary text-primary-foreground
                                                text-xs font-semibold
                                                shadow-sm
                                            "
                                        >
                                            {qty}
                                        </div>
                                    )}
                                    <div />
                                    {/* <AddBtn product={hero} onOpen={onOpen} /> */}
                                </div>
                                <FeaturedPriceChoices product={hero} onOpen={onOpen} name={hero.default_name || hero.name || getLocalizedField(hero.properties, "name")} />
                            </div>
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

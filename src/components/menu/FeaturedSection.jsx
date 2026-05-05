import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/cartStore.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { useBranch } from '@/lib/BranchContext.jsx';


/* ─── Cart hook ─────────────────────────────────────────────────── */
function useProductCart(product) {
    const { getProductQuantity, addItem, items, updateQuantity, removeItem } = useCart();
    const qty = getProductQuantity(product.id);

    const handleMinus = (e) => {
        e.stopPropagation();
        const cartItems = items.filter(i => i.product_id === product.id);
        if (!cartItems.length) return;
        const last = cartItems[cartItems.length - 1];
        const lastIndex = items.findIndex(i => i === last);
        last.quantity > 1 ? updateQuantity(lastIndex, last.quantity - 1) : removeItem(lastIndex);
    };

    const handlePlus = (e) => { e.stopPropagation(); addItem(product, 1); };
    return { qty, handleMinus, handlePlus };
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
                        h-7 w-7 rounded-full flex items-center justify-center shadow-sm transition-all
                        group-focus-within:opacity-100

                    ${hasVariations
                    ? "bg-primary/90 text-primary-foreground cursor-not-allowed opacity-60"
                    : "bg-primary text-primary-foreground hover:bg-primary/85"}
                    `}
        >
            <Plus className="h-3.5 w-3.5" />
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
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
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
                className="relative z-10 object-contain drop-shadow-2xl w-full h-full"
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


/* ─── Small card ─────────────────────────────────────────────────── */
function SmallCard({ product, onOpen, size = 110, delay = 0, showAdd = true }) {
    const { getLocalizedField } = useLanguage();
    const name = getLocalizedField(product, 'name');

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
            <div className="mt-2 text-center">
                <p className="font-serif font-light text-xs md:text-sm text-foreground/80 tracking-wide line-clamp-1">{name}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-xs font-light tracking-widest text-primary">
                        ${product.price?.toFixed(2)}
                    </p>
                    {showAdd && <AddBtn product={product} onOpen={onOpen} />}
                </div>
            </div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════
   LAYOUT 1 — Grand Stage
   1 large center hero flanked by 2 medium + 2 small floating
══════════════════════════════════════════════════════ */
function LayoutGrandStage({ products, onOpen, isAll }) {

    const [p0, p1, p2, p3, p4] = products;
    return (
        <div className="relative w-full">
            {/* Subtle radial glow background */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, --primary) 0%, transparent 70%)' }} />

            {/* Main row */}
            <div className="flex items-start justify-evenly gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                {/* Left small */}
                <div className="flex flex-col gap-10 items-center mb-6 sm:mb-0 sm:mr-2">
                    {p1 && <SmallCard product={p1} onOpen={onOpen} size={125} delay={0.6} />}
                    {p3 && <SmallCard product={p3} onOpen={onOpen} size={125} delay={1.2} />}
                </div>

                {/* Center hero */}
                <div className="relative flex flex-col items-center z-10 mx-2 sm:mx-6">
                    {p0 && (
                        <motion.div onClick={() => onOpen(p0)} className="flex flex-col items-center cursor-pointer"
                            whileHover={{ scale: 1.03 }} transition={{ duration: 0.4 }}>
                            {/* {p0.is_popular && ( */}
                            {isAll && (
                                <span className="mb-2 text-[9px] font-bold tracking-[0.22em] uppercase px-3 py-1 rounded-full text-primary bg-primary/10 border border-primary/25">
                                    Chef's Selection
                                </span>
                            )}
                            {/* )} */}
                            <FloatWrap delay={0} amplitude={9}>
                                <FloatImage src={p0.image} alt={p0.name_en} size={220} />
                            </FloatWrap>
                            <div className="mt-4 text-center">
                                <p className="font-serif font-light text-xl text-foreground/95 tracking-wide">{p0.name_en}</p>
                                <div className="flex items-center justify-center gap-3 mt-1.5">
                                    <p className="font-light tracking-widest text-base text-primary">${p0.price?.toFixed(2)}</p>
                                    <AddBtn product={p0} onOpen={onOpen} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right small */}
                <div className="flex flex-row sm:flex-col gap-12 sm:gap-10 items-center mb-6 sm:mb-0 sm:ml-2">
                    {p2 && <SmallCard product={p2} onOpen={onOpen} size={125} delay={0.9} />}
                    {p4 && <SmallCard product={p4} onOpen={onOpen} size={125} delay={1.5} />}
                </div>
            </div>

            {/* Thin decorative line */}
            <div className="mt-8 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   LAYOUT 2 — Diagonal Drift
   Staggered row with items at different vertical offsets
══════════════════════════════════════════════════════ */
// function LayoutDiagonalDrift({ products, onOpen }) {
//     const items = products.slice(0, 5);
//     const offsets = [30, 0, -20, 10, 40]; // px vertical offset
//     const sizes = [120, 160, 200, 140, 110];
//     const delays = [0.5, 0, 0.3, 0.8, 1.1];

//     return (
//         <div className="relative w-full overflow-hidden">
//             <div className="absolute inset-0 pointer-events-none"
//                 style={{ background: 'radial-gradient(ellipse 70% 55% at 45% 55%, rgba(120,90,180,0.05) 0%, transparent 70%)' }} />
//             <span className="absolute left-1/2 -translate-x-1/2 top-2 mb-2 text-[9px] font-bold tracking-[0.22em] uppercase px-3 py-1 rounded-full text-primary bg-primary/10 border border-primary/25">
//                 Chef's Selection
//             </span>

//             <div className="flex items-center justify-center gap-2 sm:gap-6 py-6 px-2 flex-wrap sm:flex-nowrap">

//                 {items.map((p, i) => (
//                     <motion.div
//                         key={p.id}
//                         className="flex flex-col items-center cursor-pointer"
//                         style={{ marginTop: sizes[i] === 200 ? 0 : offsets[i] }}
//                         whileHover={{ scale: 1.06, y: -6 }}
//                         transition={{ duration: 0.3 }}
//                         onClick={() => onOpen(p)}
//                     >
//                         <FloatWrap delay={delays[i]} amplitude={i === 2 ? 8 : 5}>
//                             <FloatImage src={p.images?.[0]} alt={p.name_en} size={sizes[i]} />
//                         </FloatWrap>
//                         <div className="mt-2.5 text-center max-w-[100px]">
//                             <p className="font-serif font-light text-xs sm:text-sm text-foreground/85 tracking-wide leading-tight line-clamp-1">
//                                 {p.name_en}
//                             </p>
//                             <div className="flex items-center justify-center gap-2 mt-1">
//                                 <p className="text-xs font-light tracking-widest text-primary">${p.price?.toFixed(2)}</p>
//                                 <AddBtn product={p} />
//                             </div>
//                         </div>
//                     </motion.div>
//                 ))}
//             </div>
//         </div>
//     );
// }


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
            {/* Section label */}
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70">
                    ✦✦ {t("featured")} ✦✦
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
            </div>

            <LayoutComponent products={products} onOpen={onProductOpen} isAll={isAll} />
        </motion.section>
    );
}
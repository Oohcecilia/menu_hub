import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBranch } from '@/lib/BranchContext.jsx';

const DEFAULT_SLIDES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=85',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85',
];

export default function CoverHero() {
  const { activeBranch } = useBranch();

  const name = activeBranch?.brand_name;
  const tagline = activeBranch?.brand_tagline || 'Crafted with passion · Served with care';
  const noImage = activeBranch?.no_image;
  const emoji = activeBranch?.logo || noImage;


  // Build slides: if the branch has a cover image, put it first + blend with defaults
  const slides = activeBranch?.cover_images ? activeBranch.cover_images : DEFAULT_SLIDES;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const advance = useCallback(() => {
    setDirection(1);
    setIndex(i => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(advance, 5000);
    return () => clearInterval(timer);
  }, [advance]);

  const goTo = (i) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  const variants = {
    enter: (dir) => ({ opacity: 0, scale: 1.04, x: dir > 0 ? 30 : -30 }),
    center: { opacity: 1, scale: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, scale: 0.97, x: dir > 0 ? -30 : 30 }),
  };

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden bg-stone-900">
      {/* Carousel images */}
      <AnimatePresence initial={false} custom={direction} mode="crossfade">
        <motion.img
          key={slides[index]}
          src={slides[index]}
          alt=""
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-background pointer-events-none" />

      {/* Text content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4 pointer-events-none">
        {activeBranch?.logo && (
          <motion.div
            className="relative mb-3 w-32 h-32 shadow-lg rounded-full shadow-primary/25"
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: [0, -6, 0],
            }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />

            {/* 🌟 Glow ring */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_25px_rgba(59,130,246,0.35)]" />

            {/* 🖼️ Logo */}
            <motion.img
              src={activeBranch.logo}
              alt="Branch logo"
              className="relative w-full h-full object-content rounded-full bg-background"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55, ease: 'easeOut' }}
          className="text-4xl md:text-5xl font-serif font-bold tracking-tight drop-shadow-lg"
        >
          {name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5, ease: 'easeOut' }}
          className="mt-2 text-white/80 text-sm md:text-base font-light tracking-wide drop-shadow"
        >
          {tagline}
        </motion.p>
        {activeBranch && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-white/55 text-xs tracking-widest uppercase"
          >
            Crafted with passion · Served with care
          </motion.p>
        )}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-500 ${i === index
              ? 'w-5 h-1.5 bg-white'
              : 'w-1.5 h-1.5 bg-white/45 hover:bg-white/70'
              }`}
          />
        ))}
      </div>
    </div>
  );
}
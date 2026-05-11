import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBranch } from '@/lib/BranchContext.jsx';

const CartContext = createContext();

export function CartProvider({ children }) {
  // ✅ use new storage key
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const { activeBranch } = useBranch();

  const [isOpen, setIsOpen] = useState(false);


  // ✅ SYNC CART → LOCALSTORAGE (single source of truth)
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // ✅ SYNC NOTE → LOCALSTORAGE

  // ✅ HANDLE BRANCH SWITCH (cleanup invalid cart)
  useEffect(() => {
    if (!activeBranch?.buid) return;

    const storedItems = JSON.parse(
      localStorage.getItem('cart') || '[]'
    );

    const hasDifferentBranch = storedItems.some(
      item => item.buid && item.buid !== activeBranch.buid
    );

    if (hasDifferentBranch) {
      setItems([]);
      localStorage.removeItem('cart');
    }
  }, [activeBranch?.buid]);

  // =========================
  // ADD ITEM
  // =========================
  // const addItem = (product, quantity = 1, note = '', variations = []) => {
  //   if (!activeBranch?.buid) return;

  //   setItems(prev => {
  //     const hasDifferentBranch = prev.some(
  //       item => item.buid && item.buid !== activeBranch.buid
  //     );

  //     if (hasDifferentBranch) {
  //       alert('Cart contains items from another branch.');
  //       return prev;
  //     }

  //     const isSameVariations = (a = [], b = []) =>
  //       a.length === b.length &&
  //       a.every(v => b.some(bv => bv.id === v.id));

  //     const existing = prev.find(i =>
  //       i.product_id === product.id &&
  //       i.note === note &&
  //       isSameVariations(i.variations, variations)
  //     );

  //     let updated;

  //     if (existing) {
  //       updated = prev.map(i =>
  //         i.product_id === product.id &&
  //         i.note === note &&
  //         isSameVariations(i.variations, variations)
  //           ? { ...i, quantity: i.quantity + quantity }
  //           : i
  //       );
  //     } else {
  //       updated = [
  //         ...prev,
  //         {
  //           product_id: product.id,
  //           buid: activeBranch.buid,
  //           quantity,
  //           note,
  //           variations,
  //         }
  //       ];
  //     }

  //     return updated;
  //   });
  // };
  const addItem = (product, quantity = 1, note = "", variations = []) => {
    if (!activeBranch?.buid) return;

    setItems((prev) => {
      // 1. Branch Validation
      const hasDifferentBranch = prev.some(
        (item) => item.buid && item.buid !== activeBranch.buid
      );

      if (hasDifferentBranch) {
        alert("Cart contains items from another branch.");
        return prev;
      }

      // 2. Optimized Variation Comparison
      // We stringify a sorted list of identifiers to create a unique "fingerprint"
      const getVariationKey = (vars) => {
        return vars
          .map((v) => (typeof v === 'object' ? (v.id || v.name || JSON.stringify(v)) : v))
          .sort()
          .join("|");
      };

      const newVarsKey = getVariationKey(variations);

      // 3. Find Existing Index (More efficient than .find + .map)
      const existingIndex = prev.findIndex((item) =>
        item.product_id === product.id &&
        item.note === note &&
        getVariationKey(item.variations) === newVarsKey
      );

      if (existingIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + quantity,
        };
        return updatedItems;
      }

      // 4. Add New Item
      return [
        ...prev,
        {
          cart_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          product_id: product.id,
          product_name: product.name, // Good practice to keep a snapshot
          buid: activeBranch.buid,
          quantity,
          note,
          variations,
        },
      ];
    });
  };

  // =========================
  // UPDATE / REMOVE
  // =========================
  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    setItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity } : item
      )
    );
  };

  const updateNote = (index, note) => {
    setItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, note } : item
      )
    );
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  // =========================
  // HELPERS
  // =========================
  const getProductQuantity = (productId) => {
    return items
      .filter(i => i.product_id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  const total = subtotal;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        updateNote,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
        total,
        isOpen,
        setIsOpen,
        getProductQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
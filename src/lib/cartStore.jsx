import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useBranch } from '@/lib/BranchContext.jsx';
import { useLanguage } from '@/lib/i18n.jsx';
import { getWaiterSuggestions } from '@/utils/waiterSuggestions';

const CartContext = createContext();

function loadStoredCart() {
  try {
    const saved = localStorage.getItem('cart');
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem('cart');
    return [];
  }
}

function getSelectionKey(items, buid, language) {
  return JSON.stringify({
    buid: buid || '',
    language: language || 'en',
    items: items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      note: item.note || '',
      variations: item.variations || [],
    })),
  });
}

export function CartProvider({ children }) {
  // ✅ use new storage key
  const [items, setItems] = useState(loadStoredCart);

  const { activeBranch, products = [], menu } = useBranch();
  const { lang } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [waiterSuggestionResult, setWaiterSuggestionResult] = useState(null);
  const [waiterSuggestionLoading, setWaiterSuggestionLoading] = useState(false);
  const [waiterSuggestionError, setWaiterSuggestionError] = useState(null);
  const waiterRequestRef = useRef(0);
  const waiterPromiseRef = useRef(null);
  const waiterPromiseKeyRef = useRef(null);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      map.set(product.id, product);
      map.set(String(product.id), product);
    });
    return map;
  }, [products]);

  const selectionKey = useMemo(
    () => getSelectionKey(items, activeBranch?.buid, lang),
    [items, activeBranch?.buid, lang]
  );

  const loadWaiterSuggestions = useCallback(async ({ force = false } = {}) => {
    if (!items.length || !menu) {
      setWaiterSuggestionResult(null);
      setWaiterSuggestionError(null);
      setWaiterSuggestionLoading(false);
      waiterPromiseRef.current = null;
      waiterPromiseKeyRef.current = null;
      return null;
    }

    if (!force && waiterSuggestionResult?.selectionKey === selectionKey) {
      return waiterSuggestionResult;
    }

    if (!force && waiterPromiseKeyRef.current === selectionKey && waiterPromiseRef.current) {
      return waiterPromiseRef.current;
    }

    const requestId = waiterRequestRef.current + 1;
    waiterRequestRef.current = requestId;
    setWaiterSuggestionLoading(true);
    setWaiterSuggestionError(null);

    const requestPromise = (async () => {
      const result = await getWaiterSuggestions({
        cartItems: items,
        productMap,
        menu,
        language: lang,
      });

      const nextResult = {
        ...result,
        selectionKey,
        loadedAt: Date.now(),
      };

      if (waiterRequestRef.current === requestId) {
        setWaiterSuggestionResult(nextResult);
      }

      return nextResult;
    })();

    waiterPromiseKeyRef.current = selectionKey;
    waiterPromiseRef.current = requestPromise;

    try {
      return await requestPromise;
    } catch (error) {
      if (waiterRequestRef.current === requestId) {
        setWaiterSuggestionError(error);
        setWaiterSuggestionResult(null);
      }

      return null;
    } finally {
      if (waiterRequestRef.current === requestId) {
        setWaiterSuggestionLoading(false);
      }
      if (waiterPromiseKeyRef.current === selectionKey) {
        waiterPromiseRef.current = null;
        waiterPromiseKeyRef.current = null;
      }
    }
  }, [items, menu, productMap, selectionKey, waiterSuggestionResult, lang]);


  // ✅ SYNC CART → LOCALSTORAGE (single source of truth)
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!items.length) {
      setWaiterSuggestionResult(null);
      setWaiterSuggestionError(null);
      setWaiterSuggestionLoading(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      loadWaiterSuggestions();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [selectionKey, menu, productMap, loadWaiterSuggestions]);

  // ✅ SYNC NOTE → LOCALSTORAGE

  // ✅ HANDLE BRANCH SWITCH (cleanup invalid cart)
  useEffect(() => {
    if (!activeBranch?.buid) return;

    const storedItems = loadStoredCart();

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
  const addItem = (product, quantity = 1, note = "", variations = [], cart_id = "") => {
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

      if (cart_id) {
        const editIndex = prev.findIndex((item) => item.cart_id === cart_id);

        if (editIndex > -1) {
          const updatedItems = [...prev];
          updatedItems[editIndex] = {
            ...updatedItems[editIndex],
            product_id: product.id,
            product_uid: product.product_uid || product.uid || product.id,
            price_uid: product.price_uid || product.id,
            buid: activeBranch.buid,
            quantity,
            note,
            variations,
          };
          return updatedItems;
        }
      }

      // New selections stay as separate lines. Existing lines are only replaced
      // when editing by cart_id.
      return [
        ...prev,
        {
          cart_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          product_id: product.id,
          product_uid: product.product_uid || product.uid || product.id,
          price_uid: product.price_uid || product.id,
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
  const itemMatchesProduct = (item, productOrId) => {
    const productId = typeof productOrId === 'object'
      ? productOrId?.id
      : productOrId;
    const productUid = typeof productOrId === 'object'
      ? productOrId?.product_uid || productOrId?.uid || productOrId?.id
      : productOrId;
    const priceUids = typeof productOrId === 'object' && Array.isArray(productOrId?.price_options)
      ? productOrId.price_options.map((price) => price?.uid).filter((uid) => uid != null).map(String)
      : [];
    const itemProductId = String(item.product_id);

    return (
      itemProductId === String(productId) ||
      String(item.product_uid || item.product_id) === String(productUid) ||
      priceUids.includes(itemProductId)
    );
  };

  const getProductQuantity = (productOrId) => {
    return items
      .filter(i => itemMatchesProduct(i, productOrId))
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
        itemMatchesProduct,
        waiterSuggestionResult,
        waiterSuggestionLoading,
        waiterSuggestionError,
        selectionKey,
        loadWaiterSuggestions,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

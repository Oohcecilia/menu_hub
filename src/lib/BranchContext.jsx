import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { branchesData } from '@/data/branches.config';
import { getMenuData } from '@/api/menuService';
import { hexToHsl } from "@/utils/color";
import { loadFont } from "@/utils/loadfont";
import { useAsyncError } from 'react-router-dom';

const BranchContext = createContext();

export function useBranch() {
  return useContext(BranchContext);
}

function getSubdomain() {
  const host = window.location.hostname;

  if (host.includes("localhost")) return "giuseppe";

  const parts = host.split(".");
  if (parts.length >= 3) {
    return parts[1];
  }

  return null;
}


function BranchContextInner({ children }) {
  const branchSlug = getSubdomain(); // ✅ REPLACE useParams

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // optional: store branch config
  const branches = useMemo(() => {
    return Object.values(branchesData)
      .filter(b => b.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, []);

  const activeBranch = React.useMemo(() => {
    if (!branchSlug) return null;
    return branches.find(b => b.slug === branchSlug) || null;
  }, [branchSlug, branches]);



  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const res = await getMenuData(activeBranch?.host || "");

        // -------------------------
        // SAFE CATEGORIES
        // -------------------------
        const categoriesRaw = res?.categories;

        const categoriesArr = Array.isArray(categoriesRaw)
          ? categoriesRaw
          : Object.values(categoriesRaw || {});

        setCategories(
          categoriesArr.map(c => ({
            ...c,
            id: String(c.id),
          }))
        );

        // -------------------------
        // SAFE SUBCATEGORIES
        // -------------------------
        const subRaw = res?.subCategories;

        const subArr = Array.isArray(subRaw)
          ? subRaw
          : Object.values(subRaw || {});

        setSubCategories(
          subArr.map(s => ({
            uid: String(s.uid),
            cuid: String(s.cuid),
            properties: s.properties,
          }))
        );

        // -------------------------
        // SAFE PRODUCTS (OBJECT → ARRAY)
        // -------------------------
        const productRaw = res?.products;

        const productArr = Array.isArray(productRaw)
          ? productRaw
          : Object.values(productRaw || {}).flat();

        setProducts(
          productArr.map(p => ({
            ...p,
            category_id: String(p.category_id),
          }))
        );


      } catch (e) {
        console.error("Failed to load menu", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [activeBranch]);

  useEffect(() => {
    const root = document.documentElement;

    const theme = activeBranch?.theme;

    if (theme?.colors?.primary) {
      root.style.setProperty("--primary", hexToHsl(theme.colors.primary));
    }

    if (theme?.fonts?.sans) {
      loadFont(theme.fonts.sans);
      root.style.setProperty(
        "--font-sans",
        `'${theme.fonts.sans}', sans-serif`
      );
    }

    if (theme?.fonts?.heading) {
      loadFont(theme.fonts.heading);
      root.style.setProperty(
        "--font-serif",
        `'${theme.fonts.heading}', serif`
      );
    }

    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--font-sans");
      root.style.removeProperty("--font-serif");
    };
  }, [activeBranch]);

  return (
    <BranchContext.Provider
      value={{
        activeBranch,
        branches,
        branchSlug,
        categories,
        subCategories,
        products,
        loading,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function BranchProvider({ children }) {
  return <BranchContextInner>{children}</BranchContextInner>;
}
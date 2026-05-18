import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { branchesData } from '@/data/branches.config';
import { getMenuData } from '@/api/menuService';
import { hexToHsl } from "@/utils/color";
import { loadFont } from "@/utils/loadfont";

const BranchContext = createContext();

export function useBranch() {
  return useContext(BranchContext);
}

function getSubdomain() {
  const host = window.location.hostname;

  if (host.includes("localhost") || host === "127.0.0.1" || host === "::1") {
    return "giuseppe";
  }

  if (host.endsWith("giuseppe.ph")) {
    return "giuseppe";
  }

  if (host.endsWith("jardin.ph")) {
    return "jardin";
  }

  const parts = host.split(".");
  if (parts.length >= 3) {
    return parts[1];
  }

  return null;
}


function BranchContextInner({ children }) {
  const branchSlug = getSubdomain(); // ✅ REPLACE useParams

  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState([]);

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
        const res = await getMenuData();
        setMenu(res);
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
    const logo = activeBranch?.logo;
    const theme = activeBranch?.theme;
    const title = activeBranch?.slug;

    if (title) {
      const formattedTitle =
        title.charAt(0).toUpperCase() + title.slice(1);

      document.title = `${formattedTitle} Menu`;
    }

    if (logo) {
      let link = document.querySelector("link[rel='icon']");

      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }

      link.type = "image/png";
      link.href = logo;
    }
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
        menu,
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

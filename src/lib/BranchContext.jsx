import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { branchesData } from '@/data/branches.config';
import { getMenuDocument } from '@/api/menuService';
import { hexToHsl } from "@/utils/color";
import { loadFont } from "@/utils/loadfont";
import { prewarmWaiterMenu } from '@/utils/waiterSuggestions';

const BranchContext = createContext();

export function useBranch() {
  return useContext(BranchContext);
}

function getSubdomain() {
  const host = window.location.hostname;

  if (host.includes("localhost") || host === "127.0.0.1" || host === "::1" || host === "menu.test") {
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

function buildThemeCss(theme) {
  if (!theme?.colors) return "";

  const declarations = [];
  const foreground = getReadableForeground(theme.colors.background, theme.colors.foreground);

  if (theme.colors.primary) {
    const primary = hexToHsl(theme.colors.primary);
    declarations.push(`--primary: ${primary};`, `--ring: ${primary};`);
  }
  if (theme.colors.background) declarations.push(`--background: ${hexToHsl(theme.colors.background)};`);
  if (foreground) declarations.push(`--foreground: ${foreground};`);
  if (theme.colors.card) declarations.push(`--card: ${hexToHsl(theme.colors.card)};`);
  if (theme.colors.muted) declarations.push(`--muted: ${hexToHsl(theme.colors.muted)};`);

  const darkDeclarations = [];
  if (theme.colors.primary) {
    const primary = hexToHsl(theme.colors.primary);
    darkDeclarations.push(`--primary: ${primary};`, `--ring: ${primary};`);
  }

  return [
    declarations.length ? `:root:not(.dark) { ${declarations.join(" ")} }` : "",
    darkDeclarations.length ? `.dark { ${darkDeclarations.join(" ")} }` : "",
  ].filter(Boolean).join("\n");
}

function scopeCustomThemeCss(css) {
  return css.replace(/:root\b/g, ":root:not(.dark)");
}

function getReadableForeground(background, foreground) {
  if (!foreground) return "";
  if (!background) return hexToHsl(foreground);

  const backgroundLuminance = getHexLuminance(background);
  const foregroundLuminance = getHexLuminance(foreground);

  if (
    backgroundLuminance != null &&
    foregroundLuminance != null &&
    backgroundLuminance < 0.2 &&
    foregroundLuminance < 0.35
  ) {
    return "38 25% 92%";
  }

  return hexToHsl(foreground);
}

function getHexLuminance(hex) {
  const value = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;

  const channels = [0, 2, 4].map((index) => {
    const channel = parseInt(value.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function getDocumentBranchId(menuDocument) {
  return (
    menuDocument?.branch_id ??
    menuDocument?.branchId ??
    menuDocument?.buid ??
    menuDocument?.raw?.branch_id ??
    menuDocument?.raw?.branchId ??
    menuDocument?.raw?.buid
  );
}

function getDocumentBranchName(menuDocument, fallback = "Menu") {
  const raw = menuDocument?.raw || {};
  const menu = Array.isArray(raw.menus) ? raw.menus[0] : null;

  return (
    raw.branch_name ||
    raw.name ||
    raw.title ||
    menu?.name ||
    fallback
  );
}

function getDocumentTenant(menuDocument) {
  const raw = menuDocument?.raw || {};
  const host = window.location.hostname;
  const hostMatch = host.match(/^([a-z0-9]+)-([0-9]+)\.m\.posstar\.ph$/i);

  return (
    raw.tenant ||
    raw.dbname ||
    raw.database ||
    hostMatch?.[1] ||
    ""
  );
}

function getTenantFallbackBranch(tenant, branches) {
  if (tenant === "pp") {
    return branches.find((branch) => branch.slug === "giuseppe") || null;
  }

  return null;
}

function getUsableLogoUrl(value) {
  const logoUrl = String(value || "").trim();

  if (!logoUrl || logoUrl.startsWith("data/")) return "";

  return logoUrl;
}


function BranchContextInner({ children }) {
  const branchSlug = getSubdomain(); // ✅ REPLACE useParams

  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState([]);
  const [menuDocument, setMenuDocument] = useState(null);

  // optional: store branch config
  const branches = useMemo(() => {
    return Object.values(branchesData)
      .filter(b => b.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, []);

  const activeBranch = React.useMemo(() => {
    const documentBranchId = getDocumentBranchId(menuDocument);
    const branch = branches.find(b => b.slug === branchSlug)
      || branches.find(b => String(b.buid) === String(documentBranchId))
      || null;
    const branchName = getDocumentBranchName(menuDocument, branchSlug || "Menu");
    const tenant = getDocumentTenant(menuDocument);
    const fallbackBranch = branch ? null : getTenantFallbackBranch(tenant, branches);

    const menuTheme = menuDocument?.theme || {};
    const themeFont = menuTheme.font || {};
    const documentLogo = getUsableLogoUrl(menuDocument?.logo) || getUsableLogoUrl(menuTheme.logo);
    const baseBranch = branch || {
      slug: branchSlug || tenant || String(documentBranchId || "menu"),
      buid: documentBranchId,
      name: branchName,
      brand_name: branchName,
      brand_tagline: fallbackBranch?.brand_tagline || "",
      logo: documentLogo || fallbackBranch?.logo,
      nav_logo: documentLogo || fallbackBranch?.nav_logo || fallbackBranch?.logo,
      no_image: documentLogo || fallbackBranch?.no_image || fallbackBranch?.logo,
      cover_images: fallbackBranch?.cover_images || [],
      theme: fallbackBranch?.theme || {},
      is_active: true,
    };

    if (!baseBranch?.buid) return null;

    return {
      ...baseBranch,
      logo: documentLogo || baseBranch.logo,
      nav_logo: documentLogo || baseBranch.nav_logo,
      no_image: documentLogo || baseBranch.no_image,
      theme: {
        ...(baseBranch.theme || {}),
        colors: {
          ...(baseBranch.theme?.colors || {}),
          ...(menuTheme.colors || {}),
        },
        fonts: {
          ...(baseBranch.theme?.fonts || {}),
          ...(themeFont.body ? { sans: themeFont.body } : {}),
          ...(themeFont.heading ? { heading: themeFont.heading } : {}),
          ...(menuTheme.fonts || {}),
        },
      },
    };
  }, [branchSlug, branches, menuDocument]);



  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const res = await getMenuDocument();
        setMenuDocument(res || null);
        setMenu(res?.content || {});

        try {
          prewarmWaiterMenu(res?.content, localStorage.getItem("menu_lang") || "en");
        } catch (prewarmError) {
          console.warn("Failed to prewarm menu suggestions", prewarmError);
        }
      } catch (e) {
        console.error("Failed to load menu", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branchSlug]);

  useEffect(() => {
    const root = document.documentElement;
    const logo = activeBranch?.logo;
    const theme = activeBranch?.theme;
    const themeCss = menuDocument?.themeCss || "";
    const title = activeBranch?.slug;
    let themeStyle = document.getElementById("menu-theme-css");

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

    const appliedThemeCss = [themeCss ? scopeCustomThemeCss(themeCss) : "", buildThemeCss(theme)]
      .filter(Boolean)
      .join("\n");

    if (appliedThemeCss) {
      if (!themeStyle) {
        themeStyle = document.createElement("style");
        themeStyle.id = "menu-theme-css";
        document.head.appendChild(themeStyle);
      }
      themeStyle.textContent = appliedThemeCss;
    } else if (themeStyle) {
      themeStyle.textContent = "";
    }

    return () => {
      root.style.removeProperty("--font-sans");
      root.style.removeProperty("--font-serif");
      const existingThemeStyle = document.getElementById("menu-theme-css");
      if (existingThemeStyle) existingThemeStyle.textContent = "";
    };
  }, [activeBranch, menuDocument]);

  return (
    <BranchContext.Provider
      value={{
        activeBranch,
        branches,
        branchSlug,
        menuDocument,
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

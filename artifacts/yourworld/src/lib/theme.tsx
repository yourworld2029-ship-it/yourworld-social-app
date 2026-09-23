import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const THEME_STORAGE_KEY = "yourworld-color-theme";

export type ThemeChoice = "midnight" | "obsidian" | "neon" | "daylight" | "auto";
export type ResolvedTheme = Exclude<ThemeChoice, "auto">;

export const THEME_OPTIONS = [
  {
    id: "midnight",
    label: "Midnight OLED",
    description: "True Pure Black #000000 · Best for AMOLED & Battery",
    badge: "OLED",
    preview: { background: "#000000", surface: "#101014", accent: "#8b5cf6", secondary: "#22d3ee" },
  },
  {
    id: "obsidian",
    label: "Obsidian Dark",
    description: "Default · Sophisticated navy/grey matte finish",
    badge: "DEFAULT",
    preview: { background: "#0b1220", surface: "#151d2d", accent: "#f05b9a", secondary: "#69e5ed" },
  },
  {
    id: "neon",
    label: "Neon Pulse",
    description: "High-contrast dark with electric sports accents",
    badge: "SPORT",
    preview: { background: "#0a0a18", surface: "#17152d", accent: "#a855f7", secondary: "#22d3ee" },
  },
  {
    id: "daylight",
    label: "Pure Daylight",
    description: "Crisp high-contrast white minimal UI",
    badge: "LIGHT",
    preview: { background: "#f8fafc", surface: "#ffffff", accent: "#d9467c", secondary: "#0891b2" },
  },
  {
    id: "auto",
    label: "Auto",
    description: "Match your system OS appearance",
    badge: "SYSTEM",
    preview: { background: "#111827", surface: "#f8fafc", accent: "#8b5cf6", secondary: "#22d3ee" },
  },
] as const satisfies ReadonlyArray<{
  id: ThemeChoice;
  label: string;
  description: string;
  badge: string;
  preview: { background: string; surface: string; accent: string; secondary: string };
}>;

type ThemeContextValue = {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeChoice {
  if (typeof window === "undefined") return "obsidian";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "midnight" || stored === "obsidian" || stored === "neon" || stored === "daylight" || stored === "auto") {
      return stored;
    }
  } catch {
    // Storage can be unavailable in private browsing or embedded previews.
  }
  return "obsidian";
}

function systemPrefersDark() {
  return typeof window === "undefined" || !window.matchMedia
    ? true
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(theme: ThemeChoice): ResolvedTheme {
  if (theme !== "auto") return theme;
  return systemPrefersDark() ? "obsidian" : "daylight";
}

function applyTheme(theme: ThemeChoice) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themeChoice = theme;
  root.classList.toggle("dark", resolved !== "daylight");
  root.style.colorScheme = resolved === "daylight" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(readStoredTheme);
  const resolvedTheme = resolveTheme(theme);

  useEffect(() => {
    const update = () => applyTheme(theme);
    update();

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Applying the theme still works when persistence is unavailable.
    }

    if (theme !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => update();
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme: ThemeChoice) => {
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      },
    }),
    [resolvedTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
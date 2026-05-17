import * as React from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

export type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

type ThemeStoreState = ThemeProviderState;

type PersistedThemeState = {
  theme?: unknown;
};

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
const DEFAULT_THEME: Theme = "system";
const THEME_VALUES = new Set<Theme>(["dark", "light", "system"]);

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined);

function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEME_VALUES as ReadonlySet<string>).has(value);
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  if (window.matchMedia(COLOR_SCHEME_QUERY).matches) {
    return "dark";
  }

  return "light";
}

function nextTheme(theme: Theme): Exclude<Theme, "system"> {
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

  return resolvedTheme === "dark" ? "light" : "dark";
}

function persistedThemeState(value: unknown): PersistedThemeState {
  if (typeof value === "object" && value !== null && "theme" in value) {
    return value;
  }

  return {};
}

const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: nextTheme(state.theme) })),
    }),
    {
      name: "rune.theme",
      storage: createJSONStorage(() => tauriStoreStorage),
      version: 1,
      migrate: (persistedState) => {
        const state = persistedThemeState(persistedState);

        return { theme: isTheme(state.theme) ? state.theme : DEFAULT_THEME };
      },
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

function disableTransitionsTemporarily() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}",
    ),
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove();
      });
    });
  };
}

export function ThemeProvider({
  children,
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const applyTheme = React.useCallback(
    (nextTheme: Theme) => {
      const root = document.documentElement;
      const resolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme;
      const restoreTransitions = disableTransitionOnChange ? disableTransitionsTemporarily() : null;

      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);

      if (restoreTransitions) {
        restoreTransitions();
      }
    },
    [disableTransitionOnChange],
  );

  React.useEffect(() => {
    applyTheme(theme);

    if (theme !== "system") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme, applyTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

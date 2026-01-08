"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function ThemeProvider({ 
  children, 
  storageKey = "app-theme",
  defaultTheme = "system"
}: { 
  children: React.ReactNode;
  storageKey?: string;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(
    defaultTheme === "system" ? "light" : defaultTheme === "dark" ? "dark" : "light"
  );
  const [mounted, setMounted] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
    setMounted(true);
  }, [storageKey]);

  // Resolve theme (handle "system") and save
  useEffect(() => {
    let resolved: "dark" | "light";
    
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      resolved = media.matches ? "dark" : "light";
      
      const listener = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? "dark" : "light");
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      resolved = theme;
    }
    
    setResolvedTheme(resolved);
  }, [theme]);

  // Save to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Use resolvedTheme for actual class, but only after mounted to avoid flash
  const themeClass = mounted ? resolvedTheme : (defaultTheme === "dark" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <div className={`${themeClass} h-full w-full`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

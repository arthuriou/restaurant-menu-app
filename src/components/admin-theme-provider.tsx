"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type AdminThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type AdminThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: AdminThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const AdminThemeProviderContext = createContext<AdminThemeProviderState>(initialState);

export function AdminThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "admin-ui-theme",
  ...props
}: AdminThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [storageKey]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey, mounted]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  // We wrap the children in a div that applies the theme class
  // This ensures isolation from the global html class
  return (
    <AdminThemeProviderContext.Provider value={value} {...props}>
      <div className={theme}>
        <div className="bg-background text-foreground min-h-screen">
          {children}
        </div>
      </div>
    </AdminThemeProviderContext.Provider>
  );
}

export const useAdminTheme = () => {
  const context = useContext(AdminThemeProviderContext);

  if (context === undefined)
    throw new Error("useAdminTheme must be used within a AdminThemeProvider");

  return context;
};

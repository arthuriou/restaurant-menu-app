"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type AdminThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: "dark",
  setTheme: () => {},
});

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("admin-theme") as Theme;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("admin-theme", theme);
    }
  }, [theme, mounted]);

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`${mounted ? theme : "dark"} h-full w-full`}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

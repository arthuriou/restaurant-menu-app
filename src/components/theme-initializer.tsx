"use client";

import { useEffect } from "react";
import { useRestaurantStore } from "@/stores/restaurant";

export function ThemeInitializer() {
  const { primaryColor } = useRestaurantStore();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--ring", primaryColor);
    
    // Simple logic for foreground: if primary is black, text is white. 
    // Otherwise (for all our vibrant presets), white text is also good.
    // If we had a white preset, we'd need black text.
    if (primaryColor === "hsl(0 0% 100%)") {
      root.style.setProperty("--primary-foreground", "hsl(0 0% 0%)");
    } else {
      root.style.setProperty("--primary-foreground", "hsl(0 0% 100%)");
    }
  }, [primaryColor]);

  return null;
}

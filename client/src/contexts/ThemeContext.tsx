import React, { createContext, useContext, useEffect, useState } from "react";
import { applyPrimaryColor } from "@/lib/colorUtils";

type Theme = "light" | "dark";

export interface BrandSettings {
  appName: string;
  logoUrl: string;
  primaryColor: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  brand: BrandSettings;
  updateBrand: (newBrand: Partial<BrandSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [brand, setBrand] = useState<BrandSettings>(() => {
    const stored = localStorage.getItem("brand_settings");
    return stored ? JSON.parse(stored) : {
      appName: "Recife EPIs",
      logoUrl: "",
      primaryColor: "#0f172a" // Default slate-900
    };
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  // Apply brand settings
  useEffect(() => {
    localStorage.setItem("brand_settings", JSON.stringify(brand));
    
    // Apply primary color to CSS variables
    if (brand.primaryColor) {
      applyPrimaryColor(brand.primaryColor);
    }
    
    // Update document title
    document.title = brand.appName;
  }, [brand]);

  const updateBrand = (newBrand: Partial<BrandSettings>) => {
    setBrand(prev => ({ ...prev, ...newBrand }));
  };

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, brand, updateBrand }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

/**
 * Theme Provider Component
 * 主题定制功能
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'medium' | 'large';
type Density = 'compact' | 'comfortable' | 'spacious';

interface ThemeContextType {
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setDensity: (density: Density) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('cogniguide_theme');
    return (saved as Theme) || 'system';
  });
  
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem('cogniguide_fontsize');
    return (saved as FontSize) || 'medium';
  });
  
  const [density, setDensityState] = useState<Density>(() => {
    const saved = localStorage.getItem('cogniguide_density');
    return (saved as Density) || 'comfortable';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('cogniguide_theme', newTheme);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem('cogniguide_fontsize', newSize);
  };

  const setDensity = (newDensity: Density) => {
    setDensityState(newDensity);
    localStorage.setItem('cogniguide_density', newDensity);
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Theme
    const actualTheme = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;
    root.setAttribute('data-theme', actualTheme);
    
    // Font Size
    root.setAttribute('data-font-size', fontSize);
    
    // Density
    root.setAttribute('data-density', density);
  }, [theme, fontSize, density]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const actualTheme = mediaQuery.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', actualTheme);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, fontSize, density, setTheme, setFontSize, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;

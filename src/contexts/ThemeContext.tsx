import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeColor = 'green' | 'white' | 'purple' | 'blue' | 'red' | 'gold';

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = {
  green: {
    name: 'Neon Green',
    primary: '120 100% 50%',
    primaryDim: '120 100% 30%',
    accent: '120 100% 40%',
    glow: '0 0 20px hsl(120 100% 50% / 0.3)',
  },
  white: {
    name: 'Pure White',
    primary: '0 0% 100%',
    primaryDim: '0 0% 80%',
    accent: '0 0% 95%',
    glow: '0 0 20px hsl(0 0% 100% / 0.3)',
  },
  purple: {
    name: 'Cyber Purple',
    primary: '280 100% 60%',
    primaryDim: '280 100% 40%',
    accent: '280 100% 50%',
    glow: '0 0 20px hsl(280 100% 60% / 0.3)',
  },
  blue: {
    name: 'Cyber Blue',
    primary: '200 100% 50%',
    primaryDim: '200 100% 30%',
    accent: '200 100% 40%',
    glow: '0 0 20px hsl(200 100% 50% / 0.3)',
  },
  red: {
    name: 'Hot Red',
    primary: '0 100% 50%',
    primaryDim: '0 100% 30%',
    accent: '0 100% 40%',
    glow: '0 0 20px hsl(0 100% 50% / 0.3)',
  },
  gold: {
    name: 'Electric Gold',
    primary: '45 100% 50%',
    primaryDim: '45 100% 30%',
    accent: '45 100% 40%',
    glow: '0 0 20px hsl(45 100% 50% / 0.3)',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeColor) || 'green';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    const themeColors = themes[theme];
    
    root.style.setProperty('--neon-green', themeColors.primary);
    root.style.setProperty('--neon-green-dim', themeColors.primaryDim);
    root.style.setProperty('--primary', themeColors.primary);
    root.style.setProperty('--accent', themeColors.accent);
    root.style.setProperty('--shadow-neon', themeColors.glow);
    root.style.setProperty('--glass-border', `${themeColors.primary} / 0.2`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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

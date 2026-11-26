import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 'system' | 'light' | 'dark'
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem('color-scheme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    return 'system';
  });

  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('color-scheme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Aplicar tema en DOM, <meta> y clase 'dark'
  const applyTheme = (currentTheme) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedDark = currentTheme === 'dark' || (currentTheme === 'system' && prefersDark);
    
    setIsDark(resolvedDark);

    if (resolvedDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = currentTheme === 'system' ? 'light dark' : currentTheme;
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      if (newTheme === 'system') {
        localStorage.removeItem('color-scheme');
      } else {
        localStorage.setItem('color-scheme', newTheme);
      }
    } catch {}
    applyTheme(newTheme);
  };

  // Escuchar cambios del sistema cuando el tema es 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Sincronizar cambios entre pestañas abiertas vía evento 'storage'
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'color-scheme') {
        const newTheme = e.newValue || 'system';
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
}

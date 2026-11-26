import { useTheme } from '../context/ThemeContext';
import Tooltip from './Tooltip';

export default function ThemeToggle({ className = '' }) {
  const { theme, isDark, setTheme } = useTheme();

  // Cicla entre: Claro -> Oscuro -> Sistema
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const label =
    theme === 'light'
      ? 'Tema Claro activo (clic para Oscuro)'
      : theme === 'dark'
      ? 'Tema Oscuro activo (clic para Automático)'
      : `Tema Automático (${isDark ? 'Oscuro' : 'Claro'}) (clic para Claro)`;

  return (
    <Tooltip text={label}>
      <button
        onClick={cycleTheme}
        type="button"
        aria-label={label}
        className={`p-2 sm:px-3 sm:py-2 text-sm font-semibold rounded-xl transition duration-150 border flex items-center gap-1.5 focus:outline-none ${
          isDark
            ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700 hover:border-amber-400/50'
            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70 hover:text-slate-900'
        } ${className}`}
      >
        {theme === 'light' && (
          <>
            <span className="text-base select-none">☀️</span>
            <span className="hidden md:inline text-xs font-bold text-slate-700">Claro</span>
          </>
        )}
        {theme === 'dark' && (
          <>
            <span className="text-base select-none">🌙</span>
            <span className="hidden md:inline text-xs font-bold text-amber-300">Oscuro</span>
          </>
        )}
        {theme === 'system' && (
          <>
            <span className="text-base select-none">💻</span>
            <span className="hidden md:inline text-xs font-bold text-slate-600 dark:text-slate-300">Auto</span>
          </>
        )}
      </button>
    </Tooltip>
  );
}

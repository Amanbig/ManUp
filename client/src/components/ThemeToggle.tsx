import { Sun, Moon, Laptop } from 'lucide-react';
import type { ThemeMode } from '../lib/theme';

interface ThemeToggleProps {
  theme: ThemeMode;
  onThemeChange: (newTheme: ThemeMode) => void;
  compact?: boolean;
}

export default function ThemeToggle({ theme, onThemeChange, compact = false }: ThemeToggleProps) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const cycleTheme = () => {
    if (theme === 'dark') onThemeChange('light');
    else if (theme === 'light') onThemeChange('system');
    else onThemeChange('dark');
  };

  if (compact) {
    return (
      <button
        onClick={cycleTheme}
        className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition shrink-0"
        title={`Current theme: ${theme}. Click to change theme.`}
        aria-label="Toggle theme"
      >
        {theme === 'system' ? (
          <Laptop className="h-4 w-4 text-orange-500" />
        ) : isDark ? (
          <Sun className="h-4 w-4 text-neutral-400 hover:text-amber-400 transition" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500 hover:text-indigo-600 transition" />
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 p-1 text-xs">
      <button
        type="button"
        onClick={() => onThemeChange('light')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
          theme === 'light'
            ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
        }`}
        title="Light mode"
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => onThemeChange('dark')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
          theme === 'dark'
            ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
        }`}
        title="Dark mode"
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
        <span>Dark</span>
      </button>
      <button
        type="button"
        onClick={() => onThemeChange('system')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
          theme === 'system'
            ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
        }`}
        title="System preference"
      >
        <Laptop className="h-3.5 w-3.5 text-orange-500" />
        <span>System</span>
      </button>
    </div>
  );
}

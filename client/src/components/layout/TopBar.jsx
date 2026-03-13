import { Menu, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const ThemeIcon = themeIcon;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Mobile menu button */}
        <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2">
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden lg:block" />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost p-2 rounded-xl"
            aria-label="Toggle theme"
          >
            <ThemeIcon className="w-5 h-5" />
          </button>

          {/* User avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-surface-200 dark:border-surface-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
              {user?.name || 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

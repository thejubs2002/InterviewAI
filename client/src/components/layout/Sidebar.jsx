import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  PlayCircle,
  History,
  BarChart3,
  Trophy,
  User,
  Settings,
  LogOut,
  X,
  Brain,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/interview/setup', label: 'Start Interview', icon: PlayCircle },
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl
        border-r border-surface-100 dark:border-surface-800
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">InterviewAI</h1>
              <p className="text-xs text-[var(--color-text-tertiary)]">Mock Interview System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:bg-surface-50 dark:hover:bg-surface-900 hover:text-[var(--color-text)]'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-surface-100 dark:border-surface-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium w-full
                       text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30
                       transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

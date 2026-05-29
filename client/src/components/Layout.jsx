import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/mesocycles', label: 'Mesocycles', icon: '◈' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 shrink-0">
        <div className="px-5 py-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-brand-400">FitTrack</h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.name}</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <button onClick={handleLogout} className="btn-secondary w-full text-xs">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content — bottom padding on mobile reserves space for the fixed nav */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-5 md:px-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gray-900 border-t border-gray-800 flex h-14">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <span className="text-lg leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-300"
        >
          <span className="text-lg leading-none">↩</span>
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  );
}

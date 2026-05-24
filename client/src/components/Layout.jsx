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
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

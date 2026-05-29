import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/mesocycles', label: 'Mesocycles', icon: '◈' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Close profile menu when clicking outside
  useEffect(() => {
    function onPointerDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

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

        {/* Desktop profile menu */}
        <div ref={profileRef} className="relative px-3 py-4 border-t border-gray-800">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-brand-700 text-brand-200 text-xs font-bold flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
            <span className="flex-1 text-left truncate">{user?.name}</span>
            <span className="text-xs text-gray-600">{profileOpen ? '▲' : '▼'}</span>
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-700">
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
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

        {/* Mobile profile tab */}
        <div ref={profileOpen ? profileRef : null} className="relative flex-1">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className={`w-full h-full flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
              profileOpen ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-brand-700 text-brand-200 text-[10px] font-bold flex items-center justify-center">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
            <span>Profile</span>
          </button>

          {profileOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-700">
                <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

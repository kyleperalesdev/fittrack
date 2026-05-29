import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MesocycleList from './pages/MesocycleList';
import MesocycleBuilder from './pages/MesocycleBuilder';
import MesocycleTracker from './pages/MesocycleTracker';
import WorkoutLogger from './pages/WorkoutLogger';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/mesocycles" element={<RequireAuth><MesocycleList /></RequireAuth>} />
          <Route path="/mesocycles/new" element={<RequireAuth><MesocycleBuilder /></RequireAuth>} />
          <Route path="/mesocycles/:id/edit" element={<RequireAuth><MesocycleBuilder /></RequireAuth>} />
          <Route path="/mesocycles/:id/session/:week/:dayIndex" element={<RequireAuth><WorkoutLogger /></RequireAuth>} />
          <Route path="/mesocycles/:id" element={<RequireAuth><MesocycleTracker /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

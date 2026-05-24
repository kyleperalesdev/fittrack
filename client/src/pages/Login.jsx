import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-400">FitTrack</h1>
          <p className="text-gray-400 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-gray-500">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300">
              Register with invite code
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

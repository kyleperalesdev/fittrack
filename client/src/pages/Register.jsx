import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', inviteCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.inviteCode);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-400">FitTrack</h1>
          <p className="text-gray-400 mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {[
            { field: 'name', label: 'Full Name', type: 'text', placeholder: 'Kyle P.' },
            { field: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { field: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
            { field: 'inviteCode', label: 'Invite Code', type: 'text', placeholder: 'Enter your invite code' },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field}>
              <label className="label">{label}</label>
              <input
                className="input"
                type={type}
                placeholder={placeholder}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required
              />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

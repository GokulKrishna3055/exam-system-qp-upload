import { useState } from 'react';
import { Menu, Moon, Sun, LogIn, LogOut, User, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export function Topbar({ onMenuToggle, currentPage }) {
  const { user, isGuest, login, logout, loading } = useAuthStore();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDark, setIsDark] = useState(true);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      toast.success(`Welcome back! 👋`);
      setShowLoginForm(false);
      setEmail(''); setPassword('');
    } else {
      toast.error(result.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  return (
    <>
      <header
        className="flex items-center gap-3 px-5 flex-shrink-0"
        style={{
          height: 60,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(15,17,23,0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="btn btn-ghost btn-icon lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: 'var(--tx3)' }}>ExamShield</span>
          <span style={{ color: 'var(--tx3)' }}>/</span>
          <span className="font-semibold" style={{ color: 'var(--tx)' }}>{currentPage}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Dark/light toggle */}
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setIsDark(!isDark)}
            title="Toggle theme"
          >
            {isDark ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Auth */}
          {isGuest ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowLoginForm(true)}
              id="login-btn"
            >
              <LogIn size={13} /> Login
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
              >
                <User size={13} style={{ color: 'var(--brand-l)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>
                  {user?.name}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={14} style={{ color: 'var(--err)' }} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Login modal overlay */}
      {showLoginForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginForm(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-fade-up"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-bright)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-base" style={{ color: 'var(--tx)' }}>
                🔐 Teacher Login
              </h2>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setShowLoginForm(false)}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="input-label" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder="teacher@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div
                className="px-3 py-2.5 rounded-xl text-xs"
                style={{ background: 'rgba(99,102,241,.08)', color: 'var(--tx2)', border: '1px solid rgba(99,102,241,.15)' }}
              >
                💡 Demo: any valid email + any password
              </div>

              <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                {loading ? 'Logging in…' : 'Login'}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full justify-center"
                onClick={() => setShowLoginForm(false)}
              >
                Continue as Guest
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

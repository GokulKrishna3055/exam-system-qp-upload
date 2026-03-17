import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Upload, FileText, Shield, History,
  ChevronLeft, ChevronRight, Lock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePaperStore } from '../../store/paperStore';
import { initials } from '../../utils/helpers';

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard',      id: 'nav-dashboard' },
  { to: '/upload',  icon: Upload,          label: 'Upload Paper',   id: 'nav-upload'    },
  { to: '/exams',   icon: FileText,        label: 'My Exams',       id: 'nav-exams'     },
  { to: '/status',  icon: Shield,          label: 'Exam Status',    id: 'nav-status'    },
  { to: '/history', icon: History,         label: 'History',        locked: true, id: 'nav-history' },
];

export function Sidebar({ collapsed, onToggle }) {
  const { user, isGuest } = useAuthStore();
  const papers = usePaperStore((s) => s.papers);

  return (
    <aside
      className="flex flex-col flex-shrink-0 transition-all duration-300"
      style={{
        width: collapsed ? 64 : 220,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', minHeight: 60 }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-d))' }}
        >
          <Lock size={14} color="#fff" />
        </div>
        {!collapsed && (
          <span className="font-black text-base tracking-tight" style={{ color: 'var(--tx)' }}>
            Exam<span style={{ color: 'var(--brand-l)' }}>Shield</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, locked, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive ? 'nav-active' : 'nav-item'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: isActive ? 'var(--brand-l)' : 'var(--tx2)',
              border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
            })}
            title={collapsed ? label : ''}
          >
            <Icon size={17} className="flex-shrink-0" />
            {!collapsed && (
              <span className="truncate flex-1">{label}</span>
            )}
            {!collapsed && locked && isGuest && (
              <Lock size={12} style={{ color: 'var(--tx3)', flexShrink: 0 }} title="Login required" />
            )}
            {!collapsed && to === '/exams' && papers.length > 0 && (
              <span
                className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--brand-l)' }}
              >
                {papers.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div
        className="flex items-center gap-2.5 px-3 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {isGuest ? (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: 'var(--surface-3)', color: 'var(--tx3)' }}
            >
              👤
            </div>
            {!collapsed && (
              <span className="text-xs font-medium" style={{ color: 'var(--tx3)' }}>Guest Mode</span>
            )}
          </>
        ) : (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-d))', color: '#fff' }}
            >
              {initials(user?.name)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--tx)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--tx3)' }}>{user?.role}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-2 transition-colors"
        style={{
          borderTop: '1px solid var(--border)',
          color: 'var(--tx3)',
          background: 'transparent',
          cursor: 'pointer',
          padding: '10px',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}

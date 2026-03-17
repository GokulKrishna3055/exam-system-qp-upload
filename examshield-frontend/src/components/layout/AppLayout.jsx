import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const PAGE_NAMES = {
  '/':        'Dashboard',
  '/upload':  'Upload Paper',
  '/exams':   'My Exams',
  '/status':  'Exam Status',
  '/history': 'Upload History',
};

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const currentPage = PAGE_NAMES[location.pathname] || 'ExamShield';

  // Detect small screens and auto-collapse
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setSidebarCollapsed(mq.matches);
    const handler = (e) => setSidebarCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuToggle={() => setSidebarCollapsed((c) => !c)} currentPage={currentPage} />

        <main
          className="flex-1 overflow-y-auto"
          style={{ background: 'var(--surface)' }}
        >
          <div className="p-6 max-w-7xl mx-auto page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

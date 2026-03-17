import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ExamsPage } from './pages/ExamsPage';
import { ExamStatusPage } from './pages/ExamStatusPage';
import { HistoryPage } from './pages/HistoryPage';
import { useAuthStore } from './store/authStore';

function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init(); // Restore auth state from localStorage
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--surface-2)',
            color: 'var(--tx)',
            border: '1px solid var(--border-bright)',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="status" element={<ExamStatusPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

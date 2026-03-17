import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePaperStore } from '../store/paperStore';
import { Lock, LogIn } from 'lucide-react';
import { truncateHash, fmtDate } from '../utils/helpers';
import { StatusBadge } from '../components/ui/StatusBadge';

export function HistoryPage() {
  const navigate = useNavigate();
  const { isGuest } = useAuthStore();
  const { papers, fetchPapers } = usePaperStore();

  useEffect(() => { if (!isGuest) fetchPapers(); }, [isGuest]);

  if (isGuest) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6 rounded-2xl py-20 px-8 text-center"
        style={{ border: '2px dashed var(--border-bright)', minHeight: 400 }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,.1)' }}
        >
          <Lock size={28} style={{ color: 'var(--brand-l)' }} />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--tx)' }}>Login Required</h1>
          <p className="mt-2 text-sm max-w-xs mx-auto" style={{ color: 'var(--tx3)' }}>
            Upload history and audit log require a teacher account.
          </p>
        </div>
        <button className="btn btn-primary" id="history-login-btn" onClick={() => navigate('/')}>
          <LogIn size={14} /> Go to Dashboard to Login
        </button>
      </div>
    );
  }

  const sorted = [...papers].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--tx)' }}>Upload History</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--tx3)' }}>Chronological log of all uploads</p>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-10 text-center" style={{ color: 'var(--tx3)' }}>
          No upload history yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((paper) => (
            <div key={paper.quizId} className="card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--tx)' }}>{paper.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--tx3)' }}>
                    {paper.course} · {paper.pages} pages · {paper.fmt}
                  </p>
                </div>
                <StatusBadge status={paper.status} />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs mono">{paper.quizId}</span>
                <span className="text-xs" style={{ color: 'var(--tx3)' }}>Uploaded: {paper.uploadedAt}</span>
                {paper.sha256Hash && (
                  <span className="text-xs mono" style={{ color: 'var(--tx3)' }}>
                    SHA-256: {truncateHash(paper.sha256Hash, 12)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

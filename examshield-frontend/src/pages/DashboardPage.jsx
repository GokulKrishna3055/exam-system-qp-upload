import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, Lock, Radio, CheckCircle, Shield,
} from 'lucide-react';
import { usePaperStore } from '../store/paperStore';
import { useAuthStore } from '../store/authStore';
import { ExamCard } from '../components/paper/ExamCard';
import { UnlockModal } from '../components/paper/UnlockModal';
import { PaperDetailModal } from '../components/paper/PaperDetailModal';
import { timeOfDay } from '../utils/helpers';
import toast from 'react-hot-toast';

const STAT_CONFIGS = [
  { key: 'total',     label: 'Total Papers',  icon: FileText,     color: '#818cf8' },
  { key: 'encrypted', label: 'Encrypted',      icon: Lock,         color: '#10b981' },
  { key: 'live',      label: 'Live Now',        icon: Radio,        color: '#ef4444' },
  { key: 'ended',     label: 'Completed',       icon: CheckCircle,  color: '#64748b' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { fetchPapers, papers, loading, deletePaper, startExam } = usePaperStore();
  const { user } = useAuthStore();

  const [unlockTarget, setUnlockTarget] = useState(null);
  const [detailPaper, setDetailPaper] = useState(null);

  useEffect(() => { fetchPapers(); }, []);

  const stats = {
    total:     papers.length,
    encrypted: papers.filter(p => ['locked','live','ended','encrypted'].includes(p.status)).length,
    live:      papers.filter(p => p.status === 'live').length,
    ended:     papers.filter(p => p.status === 'ended').length,
  };

  const greeting = user
    ? `Good ${timeOfDay()}, ${user.name} 👋`
    : 'Welcome to ExamShield 🛡️';

  const handleDelete = async (quizId) => {
    const r = await deletePaper(quizId);
    if (r.success) toast.success('Paper deleted');
    else toast.error(r.message || 'Delete failed');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--tx)' }}>{greeting}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--tx3)' }}>
            {loading
              ? 'Loading…'
              : papers.length === 0
              ? 'No question papers uploaded yet. Get started below.'
              : `Managing ${papers.length} encrypted question paper${papers.length !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <button
          className="btn btn-primary"
          id="dash-upload-btn"
          onClick={() => navigate('/upload')}
        >
          <Upload size={15} /> Upload Paper
        </button>
      </div>

      {/* ── Empty state ────────────────────────────────────────── */}
      {papers.length === 0 && !loading && (
        <EmptyDashboard onUpload={() => navigate('/upload')} />
      )}

      {/* ── Stats ────────────────────────────────────────────── */}
      {papers.length > 0 && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}
        >
          {STAT_CONFIGS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--tx3)' }}
                >
                  {label}
                </span>
                <Icon size={15} style={{ color }} />
              </div>
              <span className="text-3xl font-black" style={{ color: 'var(--tx)' }}>
                {stats[key]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Recent papers ─────────────────────────────────────── */}
      {papers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: 'var(--tx)' }}>
              Recent Papers
            </h2>
            <button
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--brand-l)' }}
              onClick={() => navigate('/exams')}
            >
              View all →
            </button>
          </div>

          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
          >
            {papers.slice(0, 6).map((paper) => (
              <ExamCard
                key={paper.quizId}
                paper={paper}
                onView={(p) => setDetailPaper(p)}
                onDetail={(p) => setDetailPaper(p)}
                onDelete={handleDelete}
                onUnlock={(p) => setUnlockTarget(p)}
                onStart={startExam}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Security banner ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,.08), rgba(139,92,246,.08))',
          border: '1px solid rgba(99,102,241,.2)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,.15)' }}
        >
          <Shield size={20} style={{ color: 'var(--brand-l)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: 'var(--tx)' }}>
            AES-256-GCM Encryption Active
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tx3)' }}>
            All question papers are encrypted server-side with unique per-upload session keys.
            Papers auto-unlock precisely at exam time.
          </p>
        </div>
        <div
          className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ background: 'var(--ok-bg)', color: 'var(--ok)', border: '1px solid rgba(16,185,129,.2)' }}
        >
          Secure
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      {unlockTarget && (
        <UnlockModal
          paper={unlockTarget}
          open={!!unlockTarget}
          onClose={() => setUnlockTarget(null)}
          onUnlocked={() => setUnlockTarget(null)}
        />
      )}
      {detailPaper && (
        <PaperDetailModal
          paper={detailPaper}
          open={!!detailPaper}
          onClose={() => setDetailPaper(null)}
          onUnlock={(p) => { setDetailPaper(null); setUnlockTarget(p); }}
          onStart={startExam}
        />
      )}
    </div>
  );
}

function EmptyDashboard({ onUpload }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 rounded-2xl py-20 px-8 text-center animate-fade-up"
      style={{ border: '2px dashed var(--border-bright)', minHeight: 380 }}
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'rgba(99,102,241,.1)' }}
      >
        <Shield size={36} style={{ color: 'var(--brand-l)' }} />
      </div>
      <div>
        <h2 className="text-xl font-black" style={{ color: 'var(--tx)' }}>
          No Question Papers Yet
        </h2>
        <p
          className="mt-2 text-sm max-w-xs mx-auto"
          style={{ color: 'var(--tx3)' }}
        >
          Upload your first exam paper to get started with AES-256-GCM
          encryption and timed secure delivery.
        </p>
      </div>
      <button
        className="btn btn-primary"
        onClick={onUpload}
        id="empty-upload-btn"
      >
        <Upload size={15} /> Upload First Paper
      </button>
    </div>
  );
}

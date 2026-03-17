import { useState } from 'react';
import { LockOpen, Lock, Play, Shield, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { PdfViewer } from './PdfViewer';
import { ExamTimer } from '../ui/ExamTimer';
import { usePaperStore } from '../../store/paperStore';
import { canViewPaper, truncateHash, fmtDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export function PaperDetailModal({ paper: initialPaper, open, onClose, onUnlock, onStart }) {
  const [activeTab, setActiveTab] = useState('overview');
  const relockPaper = usePaperStore((s) => s.relockPaper);
  const paper = usePaperStore((s) => s.papers.find(p => p.quizId === initialPaper?.quizId)) || initialPaper;

  if (!paper) return null;

  const viewable = canViewPaper(paper);

  const handleRelock = async () => {
    const res = await relockPaper(paper.quizId);
    if (res.success) toast.success('🔒 Paper re-locked');
  };

  const handleStart = async () => {
    if (!confirm(`Start exam "${paper.title}" now? This will make it live.`)) return;
    await onStart(paper.quizId);
    toast.success('🔴 Exam is now LIVE!');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'viewer',   label: 'View Paper' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={paper.title} size="lg">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--surface-3)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{
              background: activeTab === t.id ? 'var(--surface-2)' : 'transparent',
              color: activeTab === t.id ? 'var(--tx)' : 'var(--tx3)',
              border: activeTab === t.id ? '1px solid var(--border-bright)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Quiz ID', value: paper.quizId, mono: true },
              { label: 'Status', value: <StatusBadge status={paper.status} /> },
              { label: 'Pages', value: <span className="text-2xl font-black" style={{ color: 'var(--tx)' }}>{paper.pages}</span> },
              { label: 'Duration', value: <><span className="text-2xl font-black" style={{ color: 'var(--tx)' }}>{paper.duration}</span><span className="text-xs" style={{ color: 'var(--tx3)' }}> min</span></> },
              { label: 'Course',   value: paper.course },
              { label: 'Format',  value: paper.fmt },
            ].map((item) => (
              <div key={item.label} className="card p-3">
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tx3)' }}>
                  {item.label}
                </div>
                {typeof item.value === 'string' ? (
                  <div className={`text-sm font-semibold ${item.mono ? 'mono' : ''}`} style={{ color: 'var(--tx)' }}>
                    {item.value}
                  </div>
                ) : item.value}
              </div>
            ))}
          </div>

          {/* Exam time */}
          {paper.examDate && (
            <div className="card p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--tx3)' }}>Exam Scheduled</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--tx)' }}>{fmtDate(paper.examDate)}</div>
              </div>
              <ExamTimer examDate={paper.examDate} duration={paper.duration} />
            </div>
          )}

          {/* Access panel */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: viewable ? 'rgba(16,185,129,.05)' : 'rgba(245,158,11,.05)',
              border: `1px solid ${viewable ? 'rgba(16,185,129,.2)' : 'rgba(245,158,11,.2)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              {viewable ? <LockOpen size={16} style={{ color: 'var(--ok)' }} /> : <Lock size={16} style={{ color: 'var(--warn)' }} />}
              <p className="font-semibold text-sm" style={{ color: viewable ? 'var(--ok)' : 'var(--warn)' }}>
                {viewable
                  ? paper.status === 'live' ? 'Exam Live – PDF Auto-Unlocked' : '🔑 Unlocked with Encryption Key'
                  : '🔒 Paper is encrypted and locked'}
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--tx3)' }}>
              {viewable
                ? 'The original uploaded document is accessible via the View Paper tab.'
                : `Paper auto-unlocks when exam goes live${paper.examDate ? ' at ' + fmtDate(paper.examDate) : ''}. Or use your encryption key.`}
            </p>
            <div className="flex gap-2 flex-wrap">
              {!viewable && (
                <button className="btn btn-ghost btn-sm" onClick={() => { onClose(); onUnlock(paper); }}>
                  <Lock size={12} /> Unlock with Key
                </button>
              )}
              {paper.manuallyUnlocked && (
                <button className="btn btn-ghost btn-sm" onClick={handleRelock}>
                  <Lock size={12} /> Re-lock
                </button>
              )}
              {paper.status === 'locked' && (
                <button className="btn btn-sm" style={{ background: 'var(--live-bg)', color: 'var(--live)', border: '1px solid rgba(239,68,68,.2)' }} onClick={handleStart}>
                  <Play size={12} /> Start Exam Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Paper Tab */}
      {activeTab === 'viewer' && (
        <div className="animate-fade-in">
          <PdfViewer paper={paper} />
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} style={{ color: 'var(--ok)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--tx)' }}>Security Metadata</span>
            </div>
            {[
              { label: 'Encryption', value: 'AES-256-GCM' },
              { label: 'Key Format', value: 'PBKDF2-derived, 256-bit' },
              { label: 'Session Key', value: paper.sessionKey },
              { label: 'SHA-256 Hash', value: truncateHash(paper.sha256Hash, 24), full: paper.sha256Hash },
              { label: 'S3 Object Key', value: paper.s3Key },
              { label: 'Original File', value: paper.originalFileName },
              { label: 'File Size', value: paper.originalSize ? `${(paper.originalSize / 1048576).toFixed(2)} MB` : '—' },
              { label: 'Uploaded', value: paper.uploadedAt },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 py-2"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <span className="text-xs" style={{ color: 'var(--tx3)', flexShrink: 0 }}>{row.label}</span>
                <code
                  className="mono text-right break-all"
                  title={row.full || row.value}
                  style={{ fontSize: 11 }}
                >
                  {row.value}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

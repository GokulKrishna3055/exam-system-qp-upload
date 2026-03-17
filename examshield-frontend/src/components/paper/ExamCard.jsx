import { useState } from 'react';
import { Lock, Eye, Trash2, Info, Play } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { ExamTimer } from '../ui/ExamTimer';
import { canViewPaper } from '../../utils/helpers';

export function ExamCard({ paper, onView, onDetail, onDelete, onUnlock, onStart }) {
  const [deleting, setDeleting] = useState(false);
  const viewable = canViewPaper(paper);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${paper.title}"?`)) return;
    setDeleting(true);
    await onDelete(paper.quizId);
    setDeleting(false);
  };

  return (
    <div
      className="card p-4 flex flex-col gap-3 cursor-pointer hover:border-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ '--tw-shadow': '0 8px 24px rgba(0,0,0,0.3)' }}
      onClick={() => onDetail(paper)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0"
          style={{
            background: paper.fmt === 'PDF' ? 'rgba(239,68,68,.12)' : 'rgba(59,130,246,.12)',
            color: paper.fmt === 'PDF' ? '#ef4444' : '#60a5fa',
          }}
        >
          {paper.fmt}
        </div>
        <StatusBadge status={paper.status} />
      </div>

      {/* Title */}
      <div>
        <p className="font-bold text-sm leading-snug" style={{ color: 'var(--tx)' }}>
          {paper.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--tx3)' }}>
          {paper.course} · {paper.pages} pages · {paper.uploadedAt}
        </p>
      </div>

      {/* Timer */}
      <ExamTimer examDate={paper.examDate} duration={paper.duration} compact />

      {/* Encryption indicator */}
      <div className="flex items-center gap-1.5 mt-auto pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: 'var(--ok-bg)' }}
        >
          <Lock size={10} style={{ color: 'var(--ok)' }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--ok)' }}>AES-256-GCM</span>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {paper.status === 'locked' && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              title="Start exam now"
              onClick={() => onStart(paper.quizId)}
            >
              <Play size={12} style={{ color: 'var(--ok)' }} />
            </button>
          )}
          {viewable ? (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              title="View paper"
              onClick={() => onView(paper)}
            >
              <Eye size={12} style={{ color: 'var(--brand-l)' }} />
            </button>
          ) : (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              title="Unlock with key"
              onClick={() => onUnlock(paper)}
            >
              <Lock size={12} style={{ color: 'var(--warn)' }} />
            </button>
          )}
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Details"
            onClick={() => onDetail(paper)}
          >
            <Info size={12} style={{ color: 'var(--tx3)' }} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={12} style={{ color: 'var(--err)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ExternalLink, Lock, Eye } from 'lucide-react';
import { papersApi } from '../../services/api';
import { canViewPaper } from '../../utils/helpers';

export function PdfViewer({ paper }) {
  const [loading, setLoading] = useState(true);

  if (!paper) return null;

  const viewable = canViewPaper(paper);
  const isPdf = paper.fmt === 'PDF';
  const fileUrl = papersApi.getPaperFileUrl(paper.quizId);

  if (!viewable) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center gap-4 p-10"
        style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', minHeight: 300 }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,.1)' }}
        >
          <Lock size={28} style={{ color: 'var(--warn)' }} />
        </div>
        <div className="text-center">
          <p className="font-bold" style={{ color: 'var(--tx)' }}>Document is Locked</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--tx3)' }}>
            This paper will auto-unlock when the exam goes live
            {paper.examDate ? ` on ${new Date(paper.examDate).toLocaleString('en-IN')}` : ''}.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--tx3)' }}>
            Or enter your encryption key to unlock early.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold"
        style={{
          background: paper.status === 'live' ? 'var(--live-bg)' : 'rgba(99,102,241,.1)',
          color: paper.status === 'live' ? 'var(--live)' : 'var(--brand-l)',
          border: `1px solid ${paper.status === 'live' ? 'rgba(239,68,68,.2)' : 'rgba(99,102,241,.2)'}`,
        }}
      >
        <Eye size={12} />
        Viewing original uploaded document · <strong>{paper.originalFileName}</strong>
        &nbsp;·&nbsp;
        {paper.status === 'live' ? '🔴 LIVE' : '🔑 Key-Unlocked'}
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 hover:underline"
          style={{ color: 'inherit' }}
        >
          Open in tab <ExternalLink size={11} />
        </a>
      </div>

      {/* PDF iframe */}
      {isPdf ? (
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 520 }}>
          {loading && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl skeleton"
              style={{ zIndex: 1 }}
            />
          )}
          <iframe
            src={fileUrl}
            title="Question Paper"
            className="w-full h-full rounded-2xl"
            style={{ border: 'none', display: 'block' }}
            onLoad={() => setLoading(false)}
          />
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl p-10"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', minHeight: 200 }}
        >
          <p style={{ color: 'var(--tx2)', fontSize: 14 }}>
            📄 {paper.fmt} file — preview not supported in browser.
          </p>
          <a href={fileUrl} download={paper.originalFileName} className="btn btn-primary btn-sm">
            Download Original
          </a>
        </div>
      )}
    </div>
  );
}

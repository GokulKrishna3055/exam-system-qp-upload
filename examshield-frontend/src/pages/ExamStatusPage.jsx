import { useEffect, useState } from 'react';
import { usePaperStore } from '../store/paperStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ExamTimer } from '../components/ui/ExamTimer';
import { PaperDetailModal } from '../components/paper/PaperDetailModal';
import { UnlockModal } from '../components/paper/UnlockModal';
import { Radio, Lock, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export function ExamStatusPage() {
  const { papers, fetchPapers, loading, startExam } = usePaperStore();
  const [detailPaper, setDetailPaper] = useState(null);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchPapers(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPapers();
    setRefreshing(false);
    toast.success('Status refreshed');
  };

  const live    = papers.filter(p => p.status === 'live');
  const locked  = papers.filter(p => p.status === 'locked');
  const ended   = papers.filter(p => p.status === 'ended');

  const groups = [
    { label: '🔴 Live Now',    icon: Radio,        papers: live,   color: 'var(--live)',   bg: 'var(--live-bg)'  },
    { label: '🔒 Locked',      icon: Lock,         papers: locked, color: 'var(--warn)',   bg: 'var(--warn-bg)'  },
    { label: '✔ Ended',        icon: CheckCircle,  papers: ended,  color: 'var(--tx3)',    bg: 'rgba(100,116,139,.1)' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--tx)' }}>Exam Status</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--tx3)' }}>Live status of all question papers</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={refreshing || loading}>
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: papers.length, color: 'var(--brand-l)' },
          { label: 'Live',  value: live.length,   color: 'var(--live)'    },
          { label: 'Locked',value: locked.length, color: 'var(--warn)'    },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-3xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--tx3)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Status groups */}
      {papers.length === 0 && !loading && (
        <div className="card p-10 text-center" style={{ color: 'var(--tx3)' }}>
          No papers to display. Upload a question paper first.
        </div>
      )}

      {groups.map(({ label, icon: Icon, papers: grpPapers, color, bg }) => (
        grpPapers.length > 0 && (
          <div key={label} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon size={15} style={{ color }} />
              <h2 className="font-bold text-sm" style={{ color }}>{label}</h2>
              <span
                className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: bg, color }}
              >
                {grpPapers.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {grpPapers.map((paper) => (
                <div
                  key={paper.quizId}
                  className="card p-4 flex items-center gap-4 cursor-pointer hover:border-white/10 transition-all"
                  onClick={() => setDetailPaper(paper)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: 'var(--tx)' }}>{paper.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--tx3)' }}>
                      {paper.course} · {paper.pages} pages · {paper.quizId}
                    </div>
                  </div>
                  <ExamTimer examDate={paper.examDate} duration={paper.duration} />
                  <StatusBadge status={paper.status} />
                  {paper.status === 'locked' && (
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--live-bg)', color: 'var(--live)', border: '1px solid rgba(239,68,68,.2)', fontSize: 11 }}
                      onClick={(e) => { e.stopPropagation(); startExam(paper.quizId).then(() => toast.success('Exam started!')); }}
                    >
                      Start Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {/* Modals */}
      {detailPaper && (
        <PaperDetailModal
          paper={detailPaper}
          open={!!detailPaper}
          onClose={() => setDetailPaper(null)}
          onUnlock={(p) => { setDetailPaper(null); setUnlockTarget(p); }}
          onStart={startExam}
        />
      )}
      {unlockTarget && (
        <UnlockModal paper={unlockTarget} open={!!unlockTarget} onClose={() => setUnlockTarget(null)} />
      )}
    </div>
  );
}

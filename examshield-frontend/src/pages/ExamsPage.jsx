import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, SortAsc, SortDesc } from 'lucide-react';
import { usePaperStore } from '../store/paperStore';
import { ExamCard } from '../components/paper/ExamCard';
import { UnlockModal } from '../components/paper/UnlockModal';
import { PaperDetailModal } from '../components/paper/PaperDetailModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ExamTimer } from '../components/ui/ExamTimer';
import { truncateHash, canViewPaper } from '../utils/helpers';
import toast from 'react-hot-toast';

export function ExamsPage() {
  const navigate = useNavigate();
  const { papers, fetchPapers, loading, deletePaper, startExam } = usePaperStore();
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [detailPaper, setDetailPaper] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  useEffect(() => { fetchPapers(); }, []);

  const filtered = papers
    .filter((p) => {
      const q = search.toLowerCase();
      return !q || p.title.toLowerCase().includes(q) || p.course.toLowerCase().includes(q) || p.quizId.toLowerCase().includes(q);
    })
    .sort((a, b) => sortDir === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--tx)' }}>My Exams</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--tx3)' }}>
            {papers.length} paper{papers.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary btn-sm" id="exams-upload-btn" onClick={() => navigate('/upload')}>
          <Upload size={13} /> Upload Paper
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--tx3)' }} />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search by title, course, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="exams-search"
          />
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
          title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
        >
          {sortDir === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />}
          {sortDir === 'desc' ? 'Newest' : 'Oldest'}
        </button>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
          {['grid', 'table'].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: viewMode === m ? 'var(--surface-2)' : 'transparent',
                color: viewMode === m ? 'var(--tx)' : 'var(--tx3)',
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && !loading && (
        <div
          className="flex flex-col items-center gap-4 py-16 rounded-2xl text-center"
          style={{ border: '2px dashed var(--border-bright)' }}
        >
          <p className="font-bold" style={{ color: 'var(--tx)' }}>
            {search ? `No papers matching "${search}"` : 'No papers uploaded yet'}
          </p>
          {!search && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
              <Upload size={13} /> Upload Now
            </button>
          )}
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filtered.map((paper) => (
            <ExamCard
              key={paper.quizId}
              paper={paper}
              onView={(p) => setDetailPaper(p)}
              onDetail={(p) => setDetailPaper(p)}
              onDelete={async (id) => { const r = await deletePaper(id); if (r.success) toast.success('Paper deleted'); }}
              onUnlock={(p) => setUnlockTarget(p)}
              onStart={startExam}
            />
          ))}
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && filtered.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                  {['Title', 'Course', 'Pages', 'Format', 'Encryption', 'Status', 'Exam Time'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tx3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((paper) => (
                  <tr
                    key={paper.quizId}
                    className="cursor-pointer hover:bg-white/2 transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => setDetailPaper(paper)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: 'var(--tx)' }}>{paper.title}</div>
                      <div className="mono text-xs mt-0.5">{paper.quizId}</div>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--tx2)' }}>{paper.course}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--tx2)' }}>{paper.pages}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{
                          background: paper.fmt === 'PDF' ? 'rgba(239,68,68,.12)' : 'rgba(59,130,246,.12)',
                          color: paper.fmt === 'PDF' ? '#ef4444' : '#60a5fa',
                        }}
                      >
                        {paper.fmt}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}>
                        AES-256-GCM
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={paper.status} /></td>
                    <td className="px-4 py-3"><ExamTimer examDate={paper.examDate} duration={paper.duration} compact /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {unlockTarget && (
        <UnlockModal paper={unlockTarget} open={!!unlockTarget} onClose={() => setUnlockTarget(null)} />
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

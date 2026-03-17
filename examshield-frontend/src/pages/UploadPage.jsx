import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Copy, Lock } from 'lucide-react';
import { FileDropzone } from '../components/upload/FileDropzone';
import { UploadPipeline } from '../components/upload/UploadPipeline';
import { useUpload } from '../hooks/useUpload';
import toast from 'react-hot-toast';

export function UploadPage() {
  const navigate = useNavigate();
  const { file, setFile, upload, uploadProgress, pipelineSteps, phase, result, error, reset, PIPELINE_STEPS } = useUpload();

  const [form, setForm] = useState({
    quizId: '', course: '', title: '', examDate: '', duration: '180',
  });

  const handleField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file first'); return; }
    if (!form.quizId.trim() || !form.course.trim() || !form.title.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    await upload(form);
  };

  const copyKey = () => {
    if (result?.sessionKey) {
      navigator.clipboard.writeText(result.sessionKey);
      toast.success('Encryption key copied!');
    }
  };

  const isUploading = phase === 'uploading' || phase === 'pipeline';

  // ── Success screen ───────────────────────────────────────────
  if (phase === 'done' && result) {
    return (
      <div className="max-w-xl mx-auto flex flex-col gap-5 animate-fade-up">
        {/* Success banner */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--ok-bg)', border: '1px solid rgba(16,185,129,.25)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,.15)' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--ok)' }} />
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: 'var(--tx)' }}>Upload Complete!</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--tx3)' }}>
              Your question paper has been encrypted and locked.
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="card p-5 flex flex-col gap-3">
          {[
            { label: 'Title', value: result.title },
            { label: 'Quiz ID', value: result.quizId, mono: true },
            { label: 'Pages', value: `${result.pages} pages (encrypted)` },
            { label: 'S3 Object Key', value: result.s3Key, mono: true, wrap: true },
            { label: 'SHA-256 Hash', value: result.sha256Hash?.substring(0, 32) + '…', mono: true },
            { label: 'Uploaded At', value: result.uploadedAt },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tx3)' }}>{row.label}</span>
              <code className={`mono text-right text-xs ${row.wrap ? 'break-all' : 'truncate'}`} style={{ maxWidth: '60%' }}>{row.value}</code>
            </div>
          ))}

          {/* Encryption key */}
          <div
            className="mt-2 rounded-xl p-4"
            style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--brand-l)' }}>
                <Lock size={12} /> Encryption Session Key
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={copyKey} title="Copy key">
                <Copy size={12} />
              </button>
            </div>
            <code className="mono text-sm break-all" style={{ color: 'var(--brand-l)' }}>{result.sessionKey}</code>
            <p className="text-xs mt-2" style={{ color: 'var(--tx3)' }}>
              ⚠️ Save this key securely. It is required to unlock the paper before the exam starts.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={reset}>Upload Another</button>
          <button className="btn btn-primary flex-1" onClick={() => navigate('/exams')} id="success-view-exams">
            View Exams <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Upload form ──────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--tx)' }}>Upload Question Paper</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--tx3)' }}>
          Your file will be encrypted with AES-256-GCM and locked until exam time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* File drop */}
        <div className="card p-5">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--tx)' }}>📄 Select File</h2>
          <FileDropzone
            file={file}
            onFile={setFile}
            onRemove={() => setFile(null)}
            disabled={isUploading}
          />
        </div>

        {/* Exam metadata */}
        <div className="card p-5">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--tx)' }}>📋 Exam Details</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label className="input-label" htmlFor="f-quizId">Quiz / Exam ID *</label>
              <input
                id="f-quizId"
                type="text"
                className="input"
                placeholder="CS301-2024-MID"
                value={form.quizId}
                onChange={(e) => handleField('quizId', e.target.value)}
                required
                disabled={isUploading}
                pattern="[a-zA-Z0-9_\-]{3,50}"
                title="3-50 alphanumeric characters"
              />
            </div>
            <div>
              <label className="input-label" htmlFor="f-course">Course *</label>
              <input
                id="f-course"
                type="text"
                className="input"
                placeholder="Computer Science"
                value={form.course}
                onChange={(e) => handleField('course', e.target.value)}
                required
                disabled={isUploading}
              />
            </div>
            <div className="col-span-full">
              <label className="input-label" htmlFor="f-title">Exam Title *</label>
              <input
                id="f-title"
                type="text"
                className="input"
                placeholder="Midterm Examination – Data Structures"
                value={form.title}
                onChange={(e) => handleField('title', e.target.value)}
                required
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="f-date">Exam Date & Time</label>
              <input
                id="f-date"
                type="datetime-local"
                className="input"
                value={form.examDate}
                onChange={(e) => handleField('examDate', e.target.value)}
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="f-duration">Duration (minutes)</label>
              <input
                id="f-duration"
                type="number"
                className="input"
                min="15"
                max="480"
                value={form.duration}
                onChange={(e) => handleField('duration', e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        {/* Pipeline (visible while uploading) */}
        {(phase === 'uploading' || phase === 'pipeline') && (
          <UploadPipeline
            steps={pipelineSteps}
            uploadProgress={uploadProgress}
            phase={phase}
          />
        )}

        {/* Error */}
        {phase === 'error' && error && (
          <div
            className="flex items-center gap-2 p-4 rounded-xl text-sm"
            style={{ background: 'var(--err-bg)', color: 'var(--err)', border: '1px solid rgba(239,68,68,.2)' }}
          >
            <AlertCircle size={15} />
            <strong>Upload failed:</strong> {error}
          </div>
        )}

        {/* Actions */}
        {!isUploading && phase !== 'done' && (
          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={reset}
              disabled={!file && !form.quizId}
            >
              Clear
            </button>
            <button type="submit" className="btn btn-primary flex-1" id="upload-submit-btn" disabled={!file}>
              <Lock size={14} />
              Encrypt & Upload
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { formatSize } from '../../utils/helpers';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export function FileDropzone({ file, onFile, onRemove, disabled }) {
  const onDrop = useCallback(
    (accepted) => { if (accepted[0]) onFile(accepted[0]); },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled,
  });

  const rejection = fileRejections[0];
  const rejectionMsg = rejection
    ? rejection.errors[0]?.code === 'file-too-large'
      ? 'File too large (max 50 MB)'
      : 'Invalid file type (PDF, DOC, DOCX only)'
    : null;

  const ext = file?.name?.split('.').pop()?.toLowerCase();
  const isPdf = ext === 'pdf';

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <div
          {...getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            borderColor: isDragActive ? 'var(--brand)' : 'var(--border-bright)',
            background: isDragActive ? 'rgba(99,102,241,0.07)' : 'var(--surface-3)',
            minHeight: 220,
          }}
        >
          <input {...getInputProps()} id="file-input" />

          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: isDragActive ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
              transition: 'all 0.2s',
            }}
          >
            <Upload
              size={28}
              style={{ color: isDragActive ? 'var(--brand-l)' : 'var(--brand)', transition: 'all 0.2s' }}
            />
          </div>

          <div className="text-center">
            <p className="font-semibold" style={{ color: 'var(--tx)', fontSize: 15 }}>
              {isDragActive ? 'Drop your file here' : 'Drag & drop your question paper'}
            </p>
            <p className="mt-1" style={{ color: 'var(--tx3)', fontSize: 13 }}>
              or{' '}
              <span style={{ color: 'var(--brand-l)', textDecoration: 'underline', cursor: 'pointer' }}>
                browse files
              </span>
            </p>
            <p className="mt-2" style={{ color: 'var(--tx3)', fontSize: 12 }}>
              PDF, DOC, DOCX &nbsp;·&nbsp; Max 50 MB
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-4 flex items-center gap-4 animate-fade-in"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--border-bright)' }}
        >
          {/* File icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs"
            style={{
              background: isPdf ? 'rgba(239,68,68,.15)' : 'rgba(59,130,246,.15)',
              color: isPdf ? '#ef4444' : '#60a5fa',
            }}
          >
            {ext?.toUpperCase()}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate" style={{ color: 'var(--tx)', fontSize: 14 }}>
              {file.name}
            </p>
            <p className="mt-0.5" style={{ color: 'var(--tx3)', fontSize: 12 }}>
              {formatSize(file.size)}
              {' · '}
              <span style={{ color: 'var(--ok)' }}>Ready to upload</span>
            </p>
          </div>

          {/* Remove */}
          {!disabled && (
            <button
              onClick={onRemove}
              className="btn btn-ghost btn-icon btn-sm"
              title="Remove file"
            >
              <X size={14} style={{ color: 'var(--err)' }} />
            </button>
          )}
        </div>
      )}

      {/* Rejection error */}
      {rejectionMsg && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'var(--err-bg)', color: 'var(--err)', border: '1px solid rgba(239,68,68,.2)' }}
        >
          <AlertCircle size={14} />
          {rejectionMsg}
        </div>
      )}
    </div>
  );
}

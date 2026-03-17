import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export function UploadPipeline({ steps, currentStep, uploadProgress, phase }) {
  return (
    <div
      className="rounded-2xl p-5 animate-fade-in"
      style={{ background: 'var(--surface-3)', border: '1px solid var(--border-bright)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-sm" style={{ color: 'var(--tx)' }}>Processing Pipeline</p>
        {phase === 'done' && (
          <span className="text-xs font-bold" style={{ color: 'var(--ok)' }}>Complete ✓</span>
        )}
      </div>

      {/* HTTP upload progress (phase = uploading) */}
      {phase === 'uploading' && (
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--tx2)' }}>
            <span>Uploading file…</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{uploadProgress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Pipeline steps */}
      <div className="flex flex-col gap-3">
        {steps.map((step, idx) => {
          const status = step.status || 'pending'; // pending | active | done
          return (
            <div key={step.id} className="flex items-center gap-3">
              {/* Step indicator */}
              <div className="flex-shrink-0">
                {status === 'done' && (
                  <CheckCircle2 size={18} style={{ color: 'var(--ok)' }} />
                )}
                {status === 'active' && (
                  <Loader2 size={18} className="animate-spin" style={{ color: 'var(--brand-l)' }} />
                )}
                {status === 'pending' && (
                  <Circle size={18} style={{ color: 'var(--tx3)' }} />
                )}
              </div>

              {/* Label + progress bar */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium"
                  style={{
                    color: status === 'pending' ? 'var(--tx3)'
                         : status === 'done'    ? 'var(--tx2)'
                         : 'var(--tx)',
                    transition: 'color 0.3s',
                  }}
                >
                  {step.label}
                </p>
                {status === 'active' && (
                  <div className="progress-bar mt-1" style={{ height: 3 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${step.pct}%`,
                        background: 'linear-gradient(90deg, var(--brand), var(--brand-l))',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Percentage */}
              <span
                className="text-xs flex-shrink-0"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  color: status === 'done' ? 'var(--ok)'
                       : status === 'active' ? 'var(--brand-l)'
                       : 'var(--tx3)',
                }}
              >
                {status === 'done' ? '100%' : status === 'active' ? `${step.pct}%` : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Overall bar */}
      {phase !== 'uploading' && (
        <div className="mt-4">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: phase === 'done' ? '100%'
                     : steps.find(s => s.status === 'active')
                       ? `${steps.find(s => s.status === 'active').pct}%`
                       : '0%',
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

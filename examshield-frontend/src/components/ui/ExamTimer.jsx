import { useCountdown, formatCountdown } from '../../hooks/useCountdown';
import { Clock, Radio } from 'lucide-react';

export function ExamTimer({ examDate, duration, compact = false }) {
  const { timeLeft, phase } = useCountdown(examDate);

  if (!examDate) return null;

  if (phase === 'live') {
    return (
      <div className="flex items-center gap-1.5" style={{ color: 'var(--live)', fontSize: compact ? '11px' : '13px', fontWeight: 700 }}>
        <Radio size={compact ? 11 : 13} className="animate-pulse" />
        LIVE
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <span style={{ color: 'var(--tx3)', fontSize: compact ? '11px' : '12px' }}>Ended</span>
    );
  }

  if (timeLeft === null) return null;

  return (
    <div className="flex items-center gap-1.5" style={{ color: 'var(--tx2)', fontSize: compact ? '11px' : '12px' }}>
      <Clock size={compact ? 11 : 12} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatCountdown(timeLeft)}</span>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';

export function useCountdown(targetDateStr) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [phase, setPhase] = useState('upcoming'); // upcoming | live | ended
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!targetDateStr) { setTimeLeft(null); setPhase('none'); return; }

    const tick = () => {
      const now = Date.now();
      const target = new Date(targetDateStr).getTime();
      const diff = target - now;

      if (diff > 0) {
        setPhase('upcoming');
        setTimeLeft(diff);
      } else {
        setPhase('live');
        setTimeLeft(0);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [targetDateStr]);

  return { timeLeft, phase };
}

export function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

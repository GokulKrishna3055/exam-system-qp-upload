/**
 * Map a paper status to display label + variant.
 */
export function getStatusInfo(status) {
  const map = {
    locked:     { label: 'Locked',      variant: 'locked',     dot: '🔒' },
    live:       { label: '🔴 Live',     variant: 'live',       dot: '🔴' },
    ended:      { label: 'Ended',       variant: 'ended',      dot: '✔' },
    uploaded:   { label: 'Uploaded',    variant: 'uploaded',   dot: '📤' },
    processing: { label: 'Processing',  variant: 'processing', dot: '⚙️' },
    encrypted:  { label: 'Encrypted',   variant: 'encrypted',  dot: '🔐' },
  };
  return map[status] || { label: status, variant: 'locked', dot: '●' };
}

/**
 * Greeting based on time of day.
 */
export function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/**
 * Get user initials from a name.
 */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Format a file size in bytes to human-readable.
 */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Truncate a hash string for display.
 */
export function truncateHash(hash = '', len = 20) {
  if (hash.length <= len * 2) return hash;
  return `${hash.substring(0, len)}…${hash.substring(hash.length - 6)}`;
}

/**
 * Determine if a paper can currently be viewed.
 */
export function canViewPaper(paper) {
  if (!paper) return false;
  if (paper.status === 'live') return true;
  if (paper.manuallyUnlocked) return true;
  return false;
}

/**
 * Format a datetime string nicely.
 */
export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

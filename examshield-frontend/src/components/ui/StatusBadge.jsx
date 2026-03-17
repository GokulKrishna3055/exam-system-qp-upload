import { getStatusInfo } from '../../utils/helpers';

export function StatusBadge({ status }) {
  const { label, variant } = getStatusInfo(status);
  return (
    <span className={`status-badge ${variant}`}>
      {variant === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />}
      {label}
    </span>
  );
}

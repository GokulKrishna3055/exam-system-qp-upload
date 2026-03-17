import { useState } from 'react';
import { Key, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { usePaperStore } from '../../store/paperStore';
import toast from 'react-hot-toast';

export function UnlockModal({ paper, open, onClose, onUnlocked }) {
  const unlockPaper = usePaperStore((s) => s.unlockPaper);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (!key.trim()) { setError('Please enter the encryption key'); return; }
    setLoading(true);
    setError('');
    const result = await unlockPaper(paper.quizId, key.trim());
    setLoading(false);
    if (result.success) {
      toast.success('🔑 Paper unlocked successfully!');
      setKey('');
      onUnlocked?.();
      onClose();
    } else {
      setError(result.message || 'Invalid encryption key');
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleUnlock(); };

  return (
    <Modal open={open} onClose={onClose} title="🔑 Unlock with Encryption Key" size="sm">
      <div className="flex flex-col gap-4">
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)' }}
        >
          <Key size={18} style={{ color: 'var(--brand-l)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--tx)' }}>
              {paper?.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tx3)' }}>
              Enter the AES-256-GCM session key to decrypt and view this paper.
            </p>
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="unlock-key">Encryption Key</label>
          <input
            id="unlock-key"
            type="text"
            className="input"
            placeholder="sk-xxxxxxxx-xxxx-xxxx"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
          />
        </div>

        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--err-bg)', color: 'var(--err)', border: '1px solid rgba(239,68,68,.2)' }}
          >
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary flex-1" onClick={handleUnlock} disabled={loading}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Verifying…</> : 'Unlock Paper'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

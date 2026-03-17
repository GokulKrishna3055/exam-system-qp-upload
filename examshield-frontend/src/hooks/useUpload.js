import { useState, useCallback } from 'react';
import { uploadApi } from '../services/api';
import { usePaperStore } from '../store/paperStore';

const PIPELINE_STEPS = [
  { id: 1, label: 'Uploading to backend…',      pct: 18 },
  { id: 2, label: 'Processing document…',        pct: 40 },
  { id: 3, label: 'AES-256-GCM encrypting…',     pct: 63 },
  { id: 4, label: 'SHA-256 fingerprinting…',     pct: 82 },
  { id: 5, label: 'Finalizing & locking…',       pct: 96 },
];

export function useUpload() {
  const addPaper = usePaperStore((s) => s.addPaper);

  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pipelineStep, setPipelineStep] = useState(0);  // 0 = idle, 1-5 = step
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | uploading | pipeline | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setFile(null);
    setUploadProgress(0);
    setPipelineStep(0);
    setPipelineSteps([]);
    setPhase('idle');
    setResult(null);
    setError(null);
  }, []);

  const upload = useCallback(async (formMeta) => {
    if (!file) return;

    setPhase('uploading');
    setError(null);
    setUploadProgress(0);
    setPipelineSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' })));

    // Build FormData
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(formMeta).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });

    try {
      // Phase 1: actual HTTP upload with real progress
      const { data } = await uploadApi.uploadPaper(fd, (pct) => {
        setUploadProgress(pct);
        if (pct >= 100) {
          setPhase('pipeline');
          // Animate pipeline steps
          animatePipeline();
        }
      });

      // If progress callback didn't fire (old browser), animate now
      setPhase('pipeline');
      await animatePipeline();

      const paper = data.data;
      addPaper(paper);
      setResult(paper);
      setPhase('done');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setError(msg);
      setPhase('error');
    }
  }, [file, addPaper]);

  function animatePipeline() {
    return new Promise((resolve) => {
      const delays = [900, 1400, 1100, 800, 900];
      let i = 0;

      function tick() {
        if (i >= PIPELINE_STEPS.length) { resolve(); return; }
        const stepId = PIPELINE_STEPS[i].id;
        setPipelineStep(stepId);
        setPipelineSteps((prev) =>
          prev.map((s) =>
            s.id === stepId
              ? { ...s, status: 'active' }
              : s.id < stepId
              ? { ...s, status: 'done' }
              : s
          )
        );
        i++;
        setTimeout(tick, delays[i - 1] || 800);
      }
      tick();
    });
  }

  return {
    file, setFile,
    uploadProgress,
    pipelineStep, pipelineSteps,
    phase,
    result, error,
    upload, reset,
    PIPELINE_STEPS,
  };
}

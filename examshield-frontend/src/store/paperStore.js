import { create } from 'zustand';
import { papersApi, examApi } from '../services/api';

export const usePaperStore = create((set, get) => ({
  papers: [],
  loading: false,
  error: null,
  lastFetch: null,

  fetchPapers: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await papersApi.list();
      set({ papers: data.data, loading: false, lastFetch: Date.now() });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load papers', loading: false });
    }
  },

  refreshPaper: async (quizId) => {
    try {
      const { data } = await papersApi.get(quizId);
      set((state) => ({
        papers: state.papers.map((p) => (p.quizId === quizId ? data.data : p)),
      }));
      return data.data;
    } catch (_) {
      return null;
    }
  },

  addPaper: (paper) =>
    set((state) => ({ papers: [paper, ...state.papers] })),

  deletePaper: async (quizId) => {
    try {
      await papersApi.delete(quizId);
      set((state) => ({ papers: state.papers.filter((p) => p.quizId !== quizId) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Delete failed' };
    }
  },

  unlockPaper: async (quizId, key) => {
    try {
      const { data } = await papersApi.unlock(quizId, key);
      set((state) => ({
        papers: state.papers.map((p) => (p.quizId === quizId ? data.data : p)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Invalid key' };
    }
  },

  relockPaper: async (quizId) => {
    try {
      const { data } = await papersApi.relock(quizId);
      set((state) => ({
        papers: state.papers.map((p) => (p.quizId === quizId ? data.data : p)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Relock failed' };
    }
  },

  startExam: async (quizId) => {
    try {
      const { data } = await examApi.startExam(quizId);
      set((state) => ({
        papers: state.papers.map((p) => (p.quizId === quizId ? data.data : p)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to start exam' };
    }
  },

  getPaper: (quizId) => get().papers.find((p) => p.quizId === quizId) || null,
}));

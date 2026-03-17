/**
 * In-memory data store — simulates a database layer.
 * In production, replace with MongoDB/PostgreSQL via an ORM.
 */

const papers = new Map();   // quizId → PaperRecord
const sessions = new Map(); // token → UserSession

const store = {
  // ── Paper CRUD ──────────────────────────────────────────────
  createPaper(record) {
    papers.set(record.quizId, record);
    return record;
  },

  getPaper(quizId) {
    return papers.get(quizId) || null;
  },

  getAllPapers() {
    return Array.from(papers.values()).sort((a, b) => b.createdAt - a.createdAt);
  },

  updatePaper(quizId, updates) {
    const paper = papers.get(quizId);
    if (!paper) return null;
    const updated = { ...paper, ...updates, updatedAt: Date.now() };
    papers.set(quizId, updated);
    return updated;
  },

  deletePaper(quizId) {
    return papers.delete(quizId);
  },

  // ── Session auth (simple) ─────────────────────────────────
  createSession(token, user) {
    sessions.set(token, { ...user, token, createdAt: Date.now() });
  },

  getSession(token) {
    return sessions.get(token) || null;
  },

  deleteSession(token) {
    sessions.delete(token);
  },
};

module.exports = store;

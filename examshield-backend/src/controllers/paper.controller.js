const store = require('../models/store');
const { getDecryptedPaper, unlockWithKey, relockPaper, syncExamStatus } = require('../services/paper.service');
const { sanitizePaper } = require('./upload.controller');

/**
 * GET /api/question-papers
 * List all papers (sanitized).
 */
function listPapers(req, res) {
  const papers = store.getAllPapers().map(p => {
    const synced = syncExamStatus(p.quizId);
    return sanitizePaper(synced || p);
  });
  res.json({ success: true, data: papers, total: papers.length });
}

/**
 * GET /api/question-paper/:id
 * Get a single paper's metadata.
 */
function getPaper(req, res) {
  const paper = syncExamStatus(req.params.id);
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Question paper not found' });
  }
  res.json({ success: true, data: sanitizePaper(paper) });
}

/**
 * GET /api/question-paper/:id/file
 * Stream the original PDF — only if exam is live or key-unlocked.
 */
function streamPaperFile(req, res) {
  const result = getDecryptedPaper(req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Paper not found' });
  }
  if (result.locked) {
    return res.status(423).json({
      success: false,
      message: 'Paper is locked. Exam has not started yet.',
      status: result.paper.status,
    });
  }

  const { buffer, mime, filename } = result;
  res.set({
    'Content-Type': mime || 'application/pdf',
    'Content-Disposition': `inline; filename="${filename}"`,
    'Content-Length': buffer.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(buffer);
}

/**
 * POST /api/unlock
 * Unlock a paper with an encryption key.
 */
function unlockPaper(req, res) {
  const { quizId, key } = req.body;
  if (!quizId || !key) {
    return res.status(400).json({ success: false, message: 'quizId and key are required' });
  }

  const result = unlockWithKey(quizId, key);
  if (!result.success) {
    return res.status(401).json({ success: false, message: result.message });
  }

  const paper = store.getPaper(quizId);
  res.json({ success: true, message: result.message, data: sanitizePaper(paper) });
}

/**
 * POST /api/relock
 * Re-lock a manually unlocked paper.
 */
function relockPaperHandler(req, res) {
  const { quizId } = req.body;
  if (!quizId) {
    return res.status(400).json({ success: false, message: 'quizId is required' });
  }

  const result = relockPaper(quizId);
  if (!result.success) {
    return res.status(404).json({ success: false, message: result.message });
  }

  const paper = store.getPaper(quizId);
  res.json({ success: true, message: 'Paper re-locked', data: sanitizePaper(paper) });
}

/**
 * DELETE /api/question-paper/:id
 * Delete a paper record (and its encrypted file).
 */
function deletePaper(req, res) {
  const fs = require('fs');
  const paper = store.getPaper(req.params.id);
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Paper not found' });
  }

  // Remove encrypted file from disk
  try { if (paper.encPath) fs.unlinkSync(paper.encPath); } catch (_) {}

  store.deletePaper(req.params.id);
  res.json({ success: true, message: 'Paper deleted' });
}

module.exports = { listPapers, getPaper, streamPaperFile, unlockPaper, relockPaperHandler, deletePaper };

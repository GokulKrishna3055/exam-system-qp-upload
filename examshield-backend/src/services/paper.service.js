const fs = require('fs');
const store = require('../models/store');
const { decryptBuffer, verifyKey } = require('./encryption.service');

/**
 * Get a decrypted paper buffer — only when the exam is live or key verified.
 */
function getDecryptedPaper(quizId) {
  const paper = store.getPaper(quizId);
  if (!paper) return null;

  const now = Date.now();
  const examTs = paper.examDate ? new Date(paper.examDate).getTime() : null;
  const endTs = examTs ? examTs + paper.duration * 60000 : null;
  const isLive = examTs && now >= examTs && (!endTs || now <= endTs);

  if (!isLive && !paper.manuallyUnlocked) {
    return { locked: true, paper };
  }

  // Read encrypted file and decrypt
  const ciphertext = fs.readFileSync(paper.encPath);
  const decrypted = decryptBuffer(ciphertext, paper.sessionKey, paper.iv, paper.authTag);

  return {
    locked: false,
    paper,
    buffer: decrypted,
    mime: paper.originalMime,
    filename: paper.originalFileName,
  };
}

/**
 * Unlock a paper with an encryption key.
 * Uses constant-time comparison.
 */
function unlockWithKey(quizId, providedKey) {
  const paper = store.getPaper(quizId);
  if (!paper) return { success: false, message: 'Paper not found' };

  const valid = verifyKey(providedKey, paper.sessionKey);
  if (!valid) return { success: false, message: 'Invalid encryption key' };

  store.updatePaper(quizId, { manuallyUnlocked: true });
  return { success: true, message: 'Paper unlocked successfully' };
}

/**
 * Re-lock a paper (remove manual unlock).
 */
function relockPaper(quizId) {
  const paper = store.getPaper(quizId);
  if (!paper) return { success: false, message: 'Paper not found' };
  store.updatePaper(quizId, { manuallyUnlocked: false });
  return { success: true };
}

/**
 * Check and update exam lifecycle status.
 * Called on each status request to auto-transition states.
 */
function syncExamStatus(quizId) {
  const paper = store.getPaper(quizId);
  if (!paper) return null;

  const now = Date.now();
  const examTs = paper.examDate ? new Date(paper.examDate).getTime() : null;
  const endTs = examTs ? examTs + paper.duration * 60000 : null;

  let newStatus = paper.status;

  if (examTs) {
    if (now >= examTs && (!endTs || now <= endTs)) {
      newStatus = 'live';
    } else if (endTs && now > endTs && paper.status === 'live') {
      newStatus = 'ended';
    }
  }

  if (newStatus !== paper.status) {
    return store.updatePaper(quizId, { status: newStatus });
  }

  return paper;
}

module.exports = { getDecryptedPaper, unlockWithKey, relockPaper, syncExamStatus };

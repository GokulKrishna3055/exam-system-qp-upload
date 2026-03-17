const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');
const { generateSessionKey, encryptBuffer, computeHash } = require('./encryption.service');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Process an uploaded file:
 *  1. Read the file buffer
 *  2. Compute SHA-256 hash
 *  3. Encrypt with AES-256-GCM
 *  4. Save encrypted file to disk
 *  5. Create a paper record in the store
 *  6. Delete the original temp file
 */
async function processUpload({ file, quizId, course, title, examDate, duration }) {
  // Read original file
  const originalBuffer = fs.readFileSync(file.path);
  const originalSize = file.size;
  const originalExt = path.extname(file.originalname).toLowerCase().replace('.', '');
  const originalMime = file.mimetype;

  // Generate SHA-256 fingerprint
  const sha256Hash = computeHash(originalBuffer);

  // Simulate page count (in production, use pdf-lib or similar)
  const pageCount = simulatePageCount(originalBuffer, originalExt);

  // Generate a unique session key
  const sessionKey = generateSessionKey();

  // Encrypt the file
  const { ciphertext, iv, authTag } = encryptBuffer(originalBuffer, sessionKey);

  // Save encrypted file
  const encFilename = `${uuidv4()}.enc`;
  const encPath = path.join(UPLOAD_DIR, encFilename);
  fs.writeFileSync(encPath, ciphertext);

  // Simulated S3 object key (in production, upload to actual S3)
  const year = new Date().getFullYear();
  const s3Key = `exam-questions/${course}/${year}/${quizId}/${encFilename}`;

  // Determine initial status
  const now = Date.now();
  const examTs = examDate ? new Date(examDate).getTime() : null;
  let status = 'locked';
  if (examTs && examTs <= now) status = 'live';

  // Create paper record
  const paper = store.createPaper({
    quizId,
    course,
    title,
    examDate: examDate || null,
    duration: parseInt(duration, 10) || 180,
    fmt: originalExt.toUpperCase(),
    originalFileName: file.originalname,
    originalMime,
    pages: pageCount,
    originalSize,
    sha256Hash,
    sessionKey,
    encFilename,
    encPath,
    iv,
    authTag,
    s3Key,
    status,
    createdAt: now,
    updatedAt: now,
    uploadedAt: new Date(now).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
    manuallyUnlocked: false,
  });

  // Delete the original temp file
  try { fs.unlinkSync(file.path); } catch (_) {}

  return paper;
}

/**
 * Simulate page count detection.
 * In production, integrate pdf-lib for real page counting.
 */
function simulatePageCount(buffer, ext) {
  if (ext === 'pdf') {
    // Try to count PDF pages from the raw file
    const text = buffer.toString('latin1');
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) return matches.length;
  }
  // Fallback: estimate from file size
  const approx = Math.max(4, Math.floor(buffer.length / 8000));
  return Math.min(approx, 120);
}

module.exports = { processUpload };

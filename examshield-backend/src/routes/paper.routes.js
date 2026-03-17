const express = require('express');
const router = express.Router();
const {
  listPapers,
  getPaper,
  streamPaperFile,
  unlockPaper,
  relockPaperHandler,
  deletePaper,
} = require('../controllers/paper.controller');

// List all papers
router.get('/question-papers', listPapers);

// Get single paper metadata
router.get('/question-paper/:id', getPaper);

// Stream decrypted paper (only if live/unlocked)
router.get('/question-paper/:id/file', streamPaperFile);

// Unlock with encryption key
router.post('/unlock', unlockPaper);

// Re-lock a paper
router.post('/relock', relockPaperHandler);

// Delete a paper
router.delete('/question-paper/:id', deletePaper);

module.exports = router;

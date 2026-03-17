const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/upload.middleware');
const { uploadQuestionPaper } = require('../controllers/upload.controller');

/**
 * POST /api/upload-question-paper
 * Multipart form data: file + metadata fields
 */
router.post(
  '/upload-question-paper',
  upload.single('file'),
  uploadQuestionPaper
);

module.exports = router;

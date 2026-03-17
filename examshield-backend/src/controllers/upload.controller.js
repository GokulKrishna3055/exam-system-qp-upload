const { processUpload } = require('../services/upload.service');

/**
 * POST /api/upload-question-paper
 * Handles file upload + processing pipeline.
 */
async function uploadQuestionPaper(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { quizId, course, title, examDate, duration } = req.body;

    if (!quizId || !course || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: quizId, course, title',
      });
    }

    // Validate quizId format (alphanumeric + hyphens/underscores, 3-50 chars)
    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(quizId)) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID must be 3-50 alphanumeric characters (hyphens & underscores allowed)',
      });
    }

    const paper = await processUpload({
      file: req.file,
      quizId,
      course: course.trim(),
      title: title.trim(),
      examDate: examDate || null,
      duration: duration || 180,
    });

    res.status(201).json({
      success: true,
      message: 'Question paper uploaded, encrypted, and locked successfully',
      data: sanitizePaper(paper),
    });

  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      return res.status(409).json({ success: false, message: err.message });
    }
    next(err);
  }
}

// Remove sensitive fields from API response
function sanitizePaper(paper) {
  const { encPath, encFilename, iv, authTag, ...safe } = paper;
  return safe;
}

module.exports = { uploadQuestionPaper, sanitizePaper };

const store = require('../models/store');
const { syncExamStatus } = require('../services/paper.service');
const { sanitizePaper } = require('./upload.controller');

/**
 * GET /api/exam-status
 * Returns status of all exams (with auto-sync lifecycle).
 */
function getExamStatus(req, res) {
  const papers = store.getAllPapers().map(p => {
    const synced = syncExamStatus(p.quizId);
    return sanitizePaper(synced || p);
  });

  const total = papers.length;
  const live = papers.filter(p => p.status === 'live').length;
  const locked = papers.filter(p => p.status === 'locked').length;
  const ended = papers.filter(p => p.status === 'ended').length;

  res.json({
    success: true,
    data: {
      summary: { total, live, locked, ended },
      papers,
    },
  });
}

/**
 * GET /api/exam-status/:id
 * Returns status details for a specific exam.
 */
function getExamStatusById(req, res) {
  const paper = syncExamStatus(req.params.id);
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  const now = Date.now();
  const examTs = paper.examDate ? new Date(paper.examDate).getTime() : null;
  const endTs = examTs ? examTs + paper.duration * 60000 : null;

  let timeInfo = null;
  if (examTs) {
    if (now < examTs) {
      timeInfo = { phase: 'upcoming', startsIn: examTs - now, startTime: paper.examDate };
    } else if (!endTs || now <= endTs) {
      timeInfo = { phase: 'live', endsIn: endTs ? endTs - now : null, startTime: paper.examDate };
    } else {
      timeInfo = { phase: 'ended', endedAt: endTs };
    }
  }

  res.json({
    success: true,
    data: {
      ...sanitizePaper(paper),
      timeInfo,
      isLive: paper.status === 'live',
      isLocked: paper.status === 'locked' && !paper.manuallyUnlocked,
      canView: paper.status === 'live' || paper.manuallyUnlocked,
    },
  });
}

/**
 * POST /api/start-exam
 * Manually start an exam (override — sets status to live).
 */
function startExam(req, res) {
  const { quizId } = req.body;
  if (!quizId) {
    return res.status(400).json({ success: false, message: 'quizId is required' });
  }

  const paper = store.getPaper(quizId);
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  if (paper.status === 'live') {
    return res.status(409).json({ success: false, message: 'Exam is already live' });
  }

  const updated = store.updatePaper(quizId, { status: 'live', manuallyUnlocked: false });
  res.json({
    success: true,
    message: 'Exam started — paper is now live and auto-unlocked',
    data: sanitizePaper(updated),
  });
}

module.exports = { getExamStatus, getExamStatusById, startExam };

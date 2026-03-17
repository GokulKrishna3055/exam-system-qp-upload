const express = require('express');
const router = express.Router();
const { getExamStatus, getExamStatusById, startExam } = require('../controllers/exam.controller');

// GET all exams status summary
router.get('/exam-status', getExamStatus);

// GET specific exam status
router.get('/exam-status/:id', getExamStatusById);

// POST manually start an exam
router.post('/start-exam', startExam);

module.exports = router;

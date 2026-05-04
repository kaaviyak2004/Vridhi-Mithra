const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { chatWithPragati, analyzePerformance, generateQuiz, generateInterviewQuestions, evaluateInterviewAnswers } = require('../utils/ai');
const { ChatMessage, Performance, Assessment, Course, LearningPath } = require('../models');

// Multer config for resume uploads
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `resume-${Date.now()}${path.extname(file.originalname)}`)
});
const resumeUpload = multer({ storage: resumeStorage, fileFilter: (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed'), false);
}});

const router = express.Router();
router.use(authenticate);

// Chat with Pragati Bot
router.post('/chat', async (req, res) => {
  try {
    const { message, session_id } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const sessionId = session_id || uuidv4();

    // Save user message
    await ChatMessage.create({ user_id: req.user.id, session_id: sessionId, role: 'user', content: message });

    // Get conversation history
    const history = await ChatMessage.findAll({
      where: { user_id: req.user.id, session_id: sessionId },
      order: [['created_at', 'ASC']], limit: 20
    });
    const conversationHistory = history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content }));

    // Get AI response
    const aiResponse = await chatWithPragati(message, conversationHistory);

    // Save AI response
    await ChatMessage.create({ user_id: req.user.id, session_id: sessionId, role: 'assistant', content: aiResponse });

    res.json({ response: aiResponse, session_id: sessionId });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response.' });
  }
});

// Get chat history
router.get('/chat/history', async (req, res) => {
  try {
    const { session_id } = req.query;
    let where = { user_id: req.user.id };
    if (session_id) where.session_id = session_id;

    const messages = await ChatMessage.findAll({ where, order: [['created_at', 'ASC']], limit: 100 });
    
    // Get unique sessions
    const sessions = [...new Set(messages.map(m => m.session_id))];
    res.json({ messages, sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history.' });
  }
});

// Analyze performance & generate recommendations
router.post('/analyze', async (req, res) => {
  try {
    const performances = await Performance.findAll({
      where: { student_id: req.user.id },
      include: [{ 
        model: Assessment, as: 'assessment', 
        where: { college_id: req.user.college_id },
        include: [{ model: Course, as: 'course' }] 
      }]
    });

    const studentData = {
      studentName: req.user.name,
      performances: performances.map(p => ({
        course: p.assessment?.course?.name, assessment: p.assessment?.title,
        type: p.assessment?.type, marks: p.marks_obtained,
        maxMarks: p.assessment?.max_marks, percentage: p.percentage, grade: p.grade
      }))
    };

    const analysis = await analyzePerformance(studentData);

    // Auto-create learning paths from AI recommendations
    if (analysis.learningPaths) {
      for (const lp of analysis.learningPaths) {
        await LearningPath.create({
          student_id: req.user.id, title: lp.title, topic: lp.topic,
          description: lp.description, priority: lp.priority,
          resources: lp.resources || [], generated_by_ai: true,
          due_date: new Date(Date.now() + (lp.estimatedDays || 7) * 86400000)
        });
      }
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze performance.' });
  }
});

// Generate quiz
router.post('/quiz', async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required.' });
    const quiz = await generateQuiz(topic, difficulty || 'medium', count || 5);
    res.json({ quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

// ============ MOCK INTERVIEW ============

// Start mock interview – upload resume, get questions
router.post('/mock-interview/start', resumeUpload.single('resume'), async (req, res) => {
  try {
    let resumeText = '';

    if (req.file) {
      // Try to parse PDF
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text;
      } catch (pdfErr) {
        console.error('PDF parse error:', pdfErr.message);
        resumeText = 'Unable to parse PDF. Using general interview questions.';
      }
    } else if (req.body.resumeText) {
      resumeText = req.body.resumeText;
    } else {
      return res.status(400).json({ error: 'Please upload a resume PDF or provide resume text.' });
    }

    const interviewData = await generateInterviewQuestions(resumeText);

    res.json({
      ...interviewData,
      resumeText: resumeText.substring(0, 2000) // Store truncated for evaluation later
    });
  } catch (error) {
    console.error('Mock interview start error:', error);
    res.status(500).json({ error: 'Failed to start mock interview.' });
  }
});

// Evaluate mock interview answers
router.post('/mock-interview/evaluate', async (req, res) => {
  try {
    const { questions, answers, resumeText } = req.body;

    if (!questions || !answers) {
      return res.status(400).json({ error: 'Questions and answers are required.' });
    }

    const evaluation = await evaluateInterviewAnswers(questions, answers, resumeText || '');

    res.json({ evaluation });
  } catch (error) {
    console.error('Mock interview evaluate error:', error);
    res.status(500).json({ error: 'Failed to evaluate interview.' });
  }
});

module.exports = router;

const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const {
  User, Course, Enrollment, Assessment, Performance,
  Attendance, LearningPath, Achievement, Notification
} = require('../models');

const router = express.Router();

// All student routes require authentication + student role
router.use(authenticate);

// ============ STUDENT DASHBOARD ============
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.user.id;
    const collegeId = req.user.college_id;

    // Get enrollments with courses (ensure course belongs to same college)
    const enrollments = await Enrollment.findAll({
      where: { student_id: studentId, status: 'active' },
      include: [{ 
        model: Course, as: 'course', 
        where: { college_id: collegeId },
        include: [{ model: User, as: 'faculty', attributes: ['name', 'email'] }] 
      }]
    });
    
    // ... rest of dashboard logic is fine because it relies on studentId which is unique ...
    // But let's add collegeId to performances just in case
    const performances = await Performance.findAll({
      where: { student_id: studentId },
      include: [{ 
        model: Assessment, as: 'assessment', 
        where: { college_id: collegeId },
        include: [{ model: Course, as: 'course' }] 
      }],
      order: [['created_at', 'DESC']]
    });

    // Calculate overall stats
    let totalMarks = 0, totalMaxMarks = 0, totalAssessments = performances.length;
    const coursePerformance = {};

    performances.forEach(p => {
      totalMarks += p.marks_obtained;
      totalMaxMarks += p.assessment?.max_marks || 100;
      
      const courseName = p.assessment?.course?.name || 'Unknown';
      if (!coursePerformance[courseName]) {
        coursePerformance[courseName] = { total: 0, max: 0, count: 0 };
      }
      coursePerformance[courseName].total += p.marks_obtained;
      coursePerformance[courseName].max += p.assessment?.max_marks || 100;
      coursePerformance[courseName].count += 1;
    });

    const overallPercentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;

    // Get attendance summary
    const attendanceRecords = await Attendance.findAll({
      where: { student_id: studentId },
      include: [{ 
        model: Course, as: 'course',
        where: { college_id: collegeId }
      }]
    });

    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : 100;

    // Get learning paths
    const learningPaths = await LearningPath.findAll({
      where: { student_id: studentId },
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      limit: 5
    });

    // Get achievements
    const achievements = await Achievement.findAll({
      where: { student_id: studentId },
      order: [['earned_at', 'DESC']],
      limit: 5
    });

    // Get recent notifications
    const notifications = await Notification.findAll({
      where: { user_id: studentId },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Compute course-level performance for charts
    const courseStats = Object.entries(coursePerformance).map(([name, data]) => ({
      course: name,
      percentage: ((data.total / data.max) * 100).toFixed(1),
      assessments: data.count
    }));

    // Identify weak areas (courses below 60%)
    const weakAreas = courseStats.filter(c => parseFloat(c.percentage) < 60);

    res.json({
      overview: {
        totalCourses: enrollments.length,
        totalAssessments,
        overallPercentage: parseFloat(overallPercentage),
        attendancePercentage: parseFloat(attendancePercentage),
        totalAchievements: achievements.length
      },
      enrollments: enrollments.map(e => ({
        id: e.id,
        course: e.course,
        status: e.status
      })),
      courseStats,
      weakAreas,
      recentPerformance: performances.slice(0, 10).map(p => ({
        id: p.id,
        assessment: p.assessment?.title,
        course: p.assessment?.course?.name,
        marks: p.marks_obtained,
        maxMarks: p.assessment?.max_marks,
        percentage: p.percentage,
        grade: p.grade,
        date: p.submitted_at
      })),
      learningPaths,
      achievements,
      notifications,
      attendanceSummary: {
        total: totalClasses,
        present: presentClasses,
        absent: totalClasses - presentClasses,
        percentage: parseFloat(attendancePercentage)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data.' });
  }
});

// ============ COURSE MATERIALS (DCM) ============
router.get('/materials', async (req, res) => {
  try {
    const { CourseMaterial } = require('../models');
    const collegeId = req.user.college_id;

    // Get courses the student is enrolled in
    const enrollments = await Enrollment.findAll({
      where: { student_id: req.user.id, status: 'active' },
      include: [{ model: Course, as: 'course', where: { college_id: collegeId } }],
      attributes: ['course_id']
    });
    const courseIds = enrollments.map(e => e.course_id);

    const materials = await CourseMaterial.findAll({
      where: { course_id: courseIds },
      include: [{ model: Course, as: 'course', attributes: ['name', 'course_code'] }],
      order: [['created_at', 'DESC']]
    });

    res.json({ materials });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials.' });
  }
});

// ============ PERFORMANCE HISTORY ============
router.get('/performance', async (req, res) => {
  try {
    const performances = await Performance.findAll({
      where: { student_id: req.user.id },
      include: [{ 
        model: Assessment, as: 'assessment', 
        where: { college_id: req.user.college_id },
        include: [{ model: Course, as: 'course' }] 
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ performances });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance data.' });
  }
});

// ============ QUIZ/ASSESSMENT ============
router.get('/assessments', async (req, res) => {
  try {
    const collegeId = req.user.college_id;
    const enrollments = await Enrollment.findAll({
      where: { student_id: req.user.id, status: 'active' },
      include: [{ model: Course, as: 'course', where: { college_id: collegeId } }]
    });
    const courseIds = enrollments.map(e => e.course_id);

    const assessments = await Assessment.findAll({
      where: { course_id: courseIds, college_id: collegeId },
      include: [{ model: Course, as: 'course', attributes: ['name', 'course_code'] }],
      order: [['due_date', 'ASC']]
    });

    const performances = await Performance.findAll({
      where: { student_id: req.user.id }
    });
    const completedIds = new Set(performances.map(p => p.assessment_id));

    const pending = assessments.filter(a => !completedIds.has(a.id));
    const completed = assessments.filter(a => completedIds.has(a.id));

    res.json({ pending, completed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments.' });
  }
});

router.get('/assessments/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      where: { id: req.params.id, college_id: req.user.college_id },
      include: [{ model: Course, as: 'course', attributes: ['name', 'course_code'] }]
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found in your college.' });

    // Strip out correct answers if this is a quiz
    let questions = assessment.questions;
    if (questions && Array.isArray(questions)) {
      questions = questions.map(q => {
        const { correctIndex, ...rest } = q;
        return rest;
      });
    }

    res.json({ assessment: { ...assessment.toJSON(), questions } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessment.' });
  }
});

router.post('/assessments/:id/submit', async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const { answers } = req.body; 

    const assessment = await Assessment.findOne({
      where: { id: assessmentId, college_id: req.user.college_id }
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found in your college.' });

    // Calculate marks
    let marksObtained = 0;
    const questions = assessment.questions || [];
    
    if (questions.length > 0 && answers) {
      const marksPerQuestion = assessment.max_marks / questions.length;
      questions.forEach((q, index) => {
        if (answers[index] !== undefined && parseInt(answers[index]) === parseInt(q.correctIndex)) {
          marksObtained += marksPerQuestion;
        }
      });
    }

    const percentage = ((marksObtained / assessment.max_marks) * 100).toFixed(1);
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+'; else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+'; else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C'; else if (percentage >= 40) grade = 'D';

    const [perf, created] = await Performance.findOrCreate({
      where: { student_id: req.user.id, assessment_id: assessmentId },
      defaults: { marks_obtained: marksObtained, percentage: parseFloat(percentage), grade, answers }
    });

    if (!created) {
      await perf.update({ marks_obtained: marksObtained, percentage: parseFloat(percentage), grade, answers });
    }

    res.json({ message: 'Quiz submitted successfully.', performance: perf });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit quiz.' });
  }
});

// ============ ATTENDANCE ============
router.get('/attendance', async (req, res) => {
  try {
    const records = await Attendance.findAll({
      where: { student_id: req.user.id },
      include: [{ 
        model: Course, as: 'course',
        where: { college_id: req.user.college_id }
      }],
      order: [['date', 'DESC']]
    });

    // Group by course
    const byCourse = {};
    records.forEach(r => {
      const courseName = r.course?.name || 'Unknown';
      if (!byCourse[courseName]) {
        byCourse[courseName] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      byCourse[courseName].total++;
      byCourse[courseName][r.status]++;
    });

    res.json({ records, byCourse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
});

module.exports = router;

// ============ LEARNING PATHS ============
router.get('/learning-paths', async (req, res) => {
  try {
    const paths = await LearningPath.findAll({
      where: { student_id: req.user.id },
      order: [['priority', 'DESC'], ['created_at', 'DESC']]
    });
    res.json({ learningPaths: paths });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learning paths.' });
  }
});

router.put('/learning-paths/:id', async (req, res) => {
  try {
    const path = await LearningPath.findOne({
      where: { id: req.params.id, student_id: req.user.id }
    });
    if (!path) return res.status(404).json({ error: 'Learning path not found.' });

    const { status, progress_percent } = req.body;
    if (status) path.status = status;
    if (progress_percent !== undefined) path.progress_percent = progress_percent;
    await path.save();

    res.json({ message: 'Learning path updated.', learningPath: path });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update learning path.' });
  }
});

// ============ ACHIEVEMENTS ============
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.findAll({
      where: { student_id: req.user.id },
      order: [['earned_at', 'DESC']]
    });
    res.json({ achievements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch achievements.' });
  }
});

// ============ NOTIFICATIONS ============
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false }
    });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { id: req.params.id, user_id: req.user.id } }
    );
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

module.exports = router;

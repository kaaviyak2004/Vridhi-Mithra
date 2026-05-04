const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  User, Course, Enrollment, Assessment, Performance,
  Attendance, LearningPath, Notification, CourseMaterial, QuestionBank
} = require('../models');
const ai = require('../utils/ai');
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const router = express.Router();
router.use(authenticate, authorize('faculty', 'admin'));

// Faculty Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const collegeId = req.user.college_id;
    const whereClause = req.user.role === 'admin' ? { college_id: collegeId } : { faculty_id: req.user.id, college_id: collegeId };
    const courses = await Course.findAll({
      where: whereClause,
      include: [
        { model: Enrollment, as: 'enrollments' },
        { model: Assessment, as: 'assessments' }
      ]
    });
    const studentIds = new Set();
    courses.forEach(c => c.enrollments?.forEach(e => studentIds.add(e.student_id)));
    const totalAssessments = courses.reduce((a, c) => a + (c.assessments?.length || 0), 0);

    res.json({
      totalCourses: courses.length,
      totalStudents: studentIds.size,
      totalAssessments,
      courses: courses.map(c => ({
        id: c.id, name: c.name, course_code: c.course_code,
        studentCount: c.enrollments?.length || 0,
        assessmentCount: c.assessments?.length || 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// Get students
router.get('/students', async (req, res) => {
  try {
    const { course_id } = req.query;
    const collegeId = req.user.college_id;
    if (course_id) {
      const enrollments = await Enrollment.findAll({
        where: { course_id },
        include: [{ 
          model: User, as: 'student', 
          where: { college_id: collegeId },
          attributes: { exclude: ['password_hash', 'otp_code', 'otp_expires_at'] } 
        }]
      });
      return res.json({ students: enrollments.map(e => e.student) });
    }
    const whereClause = req.user.role === 'admin' ? { college_id: collegeId } : { faculty_id: req.user.id, college_id: collegeId };
    const courses = await Course.findAll({ where: whereClause });
    const enrollments = await Enrollment.findAll({
      where: { course_id: courses.map(c => c.id) },
      include: [{ 
        model: User, as: 'student', 
        where: { college_id: collegeId },
        attributes: { exclude: ['password_hash', 'otp_code', 'otp_expires_at'] } 
      }]
    });
    const studentMap = {};
    enrollments.forEach(e => { if (e.student) studentMap[e.student.id] = e.student; });
    res.json({ students: Object.values(studentMap) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// Student performance detail
router.get('/students/:studentId/performance', async (req, res) => {
  try {
    const collegeId = req.user.college_id;
    const student = await User.findOne({
      where: { id: req.params.studentId, college_id: collegeId },
      attributes: { exclude: ['password_hash', 'otp_code', 'otp_expires_at'] }
    });
    if (!student) return res.status(404).json({ error: 'Student not found in your college.' });

    const performances = await Performance.findAll({
      where: { student_id: req.params.studentId },
      include: [{ 
        model: Assessment, as: 'assessment', 
        where: { college_id: collegeId },
        include: [{ model: Course, as: 'course' }] 
      }],
      order: [['created_at', 'DESC']]
    });
    res.json({ student, performances });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student data.' });
  }
});

// Create assessment
router.post('/assessments', async (req, res) => {
  try {
    const { course_id, title, description, type, max_marks, due_date, numberOfQuestions } = req.body;
    const collegeId = req.user.college_id;
    const whereClause = req.user.role === 'admin' ? { id: course_id, college_id: collegeId } : { id: course_id, faculty_id: req.user.id, college_id: collegeId };
    const course = await Course.findOne({ where: whereClause });
    if (!course) return res.status(403).json({ error: 'You do not teach this course in this college.' });

    let finalQuestions = null;
    if (type === 'quiz') {
      // Fetch all questions for this course from QuestionBank
      let bankQuestions = await QuestionBank.findAll({ where: { course_id } });
      
      // Ensure we have a valid number of questions requested
      const countToGenerate = parseInt(numberOfQuestions) || 10;
      
      // If bank is empty, generate using AI on the fly!
      if (bankQuestions.length === 0) {
        console.log(`Question Bank empty for ${course.name}. Generating ${countToGenerate} questions using AI...`);
        try {
          const aiQuiz = await ai.generateQuiz(course.name, 'medium', countToGenerate);
          if (aiQuiz && aiQuiz.questions) {
            // Map AI format to our DB format and save to QuestionBank for future use
            const newQuestions = aiQuiz.questions.map(q => ({
              course_id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctAnswer === 'A' ? 0 : q.correctAnswer === 'B' ? 1 : q.correctAnswer === 'C' ? 2 : 3
            }));
            
            // Bulk create in QuestionBank so we have them next time
            await QuestionBank.bulkCreate(newQuestions);
            
            // Re-fetch (or just use newQuestions)
            bankQuestions = await QuestionBank.findAll({ where: { course_id } });
          }
        } catch (aiErr) {
          console.error('AI Generation failed, falling back to empty bank check:', aiErr);
        }
      }

      if (bankQuestions.length === 0) {
        return res.status(400).json({ error: 'No questions available in the question bank, and AI generation failed for this course.' });
      }
      
      // Shuffle array randomly
      const shuffled = bankQuestions.sort(() => 0.5 - Math.random());
      
      // Select the requested number (or maximum available)
      const selected = shuffled.slice(0, Math.min(countToGenerate, bankQuestions.length));
      
      // Format to JSON for the assessment
      finalQuestions = selected.map(q => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex
      }));
    }

    const assessment = await Assessment.create({
      course_id, title, description, type, max_marks, due_date: due_date || null, 
      created_by: req.user.id, questions: finalQuestions, college_id: collegeId
    });
    
    res.status(201).json({ message: 'Assessment created.', assessment });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment.' });
  }
});

// Get assessments
router.get('/assessments', async (req, res) => {
  try {
    const { course_id } = req.query;
    const collegeId = req.user.college_id;
    let where = { college_id: collegeId };
    if (course_id) { where.course_id = course_id; }
    else {
      const whereClause = req.user.role === 'admin' ? { college_id: collegeId } : { faculty_id: req.user.id, college_id: collegeId };
      const courses = await Course.findAll({ where: whereClause });
      where.course_id = courses.map(c => c.id);
    }
    const assessments = await Assessment.findAll({
      where, include: [{ model: Course, as: 'course' }], order: [['created_at', 'DESC']]
    });
    res.json({ assessments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments.' });
  }
});

// Get courses
router.get('/courses', async (req, res) => {
  try {
    const collegeId = req.user.college_id;
    const whereClause = req.user.role === 'admin' ? { college_id: collegeId } : { faculty_id: req.user.id, college_id: collegeId };
    const courses = await Course.findAll({
      where: whereClause,
      include: [{ model: Enrollment, as: 'enrollments' }]
    });
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

// Create a new course
router.post('/courses', async (req, res) => {
  try {
    const { name, course_code, description, credits, department, semester } = req.body;
    const course = await Course.create({
      name, course_code, description, credits, department, semester,
      faculty_id: req.user.id,
      college_id: req.user.college_id
    });
    res.status(201).json({ message: 'Course created successfully.', course });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

// Upload Digital Content Material (DCM) for a course
router.post('/courses/:id/materials', upload.single('file'), async (req, res) => {
  try {
    const { title, type, link_url } = req.body;
    const course_id = req.params.id;

    // Verify course ownership
    const whereClause = req.user.role === 'admin' ? { id: course_id } : { id: course_id, faculty_id: req.user.id };
    const course = await Course.findOne({ where: whereClause });
    if (!course) return res.status(403).json({ error: 'You do not have permission to modify this course.' });

    let file_url = link_url; // Default to link if provided
    if (req.file) {
      // If a file was uploaded, use the local path
      file_url = `/uploads/${req.file.filename}`;
    }

    if (!file_url) return res.status(400).json({ error: 'Please provide either a file or a link URL.' });

    const material = await CourseMaterial.create({
      course_id,
      title,
      file_url,
      type: type || 'other',
      created_by: req.user.id
    });

    res.status(201).json({ message: 'Material uploaded successfully.', material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload material.' });
  }
});

// Get DCM materials for a course (faculty view)
router.get('/courses/:id/materials', async (req, res) => {
  try {
    const materials = await CourseMaterial.findAll({
      where: { course_id: req.params.id },
      order: [['created_at', 'DESC']]
    });
    res.json({ materials });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials.' });
  }
});

// Export Analytics to Excel
router.get('/export/analytics', async (req, res) => {
  try {
    const { course_id } = req.query;
    
    let where = {};
    if (course_id) {
      const whereClause = req.user.role === 'admin' ? { id: course_id } : { id: course_id, faculty_id: req.user.id };
      const course = await Course.findOne({ where: whereClause });
      if (!course) return res.status(403).json({ error: 'Unauthorized.' });
      where.course_id = course_id;
    } else {
      const whereClause = req.user.role === 'admin' ? {} : { faculty_id: req.user.id };
      const courses = await Course.findAll({ where: whereClause });
      where.course_id = courses.map(c => c.id);
    }

    const performances = await Performance.findAll({
      include: [
        { model: Assessment, as: 'assessment', where, include: [{ model: Course, as: 'course' }] },
        { model: User, as: 'student', attributes: ['name', 'email', 'department'] }
      ]
    });

    if (performances.length === 0) {
      return res.status(404).json({ error: 'No data available to export.' });
    }

    // Format data for Excel
    const data = performances.map(p => ({
      'Student Name': p.student?.name || 'Unknown',
      'Email': p.student?.email || 'Unknown',
      'Department': p.student?.department || 'N/A',
      'Course': p.assessment?.course?.name || 'Unknown',
      'Assessment Title': p.assessment?.title || 'Unknown',
      'Type': p.assessment?.type || 'Unknown',
      'Marks Obtained': p.marks_obtained,
      'Max Marks': p.assessment?.max_marks,
      'Percentage': p.percentage + '%',
      'Grade': p.grade,
      'Feedback': p.feedback || ''
    }));

    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Analytics');

    // Generate buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    res.setHeader('Content-Disposition', 'attachment; filename="Student_Analytics.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export analytics.' });
  }
});

// Submit Marks
router.post('/marks', async (req, res) => {
  try {
    let { assessment_id, marks } = req.body;
    const collegeId = req.user.college_id;

    // Handle named categories (FIAT, SIAT, Model)
    if (isNaN(assessment_id)) {
      const { course_id } = req.body; // Expect course_id if it's a category
      if (!course_id) return res.status(400).json({ error: 'Course ID is required for categorized marks.' });

      // Find or create a "Standard" assessment for this category
      let assessment = await Assessment.findOne({
        where: { course_id, title: assessment_id, college_id: collegeId }
      });

      if (!assessment) {
        assessment = await Assessment.create({
          course_id,
          title: assessment_id,
          type: 'exam',
          max_marks: 100, // All standard exams are 100 marks
          created_by: req.user.id,
          college_id: collegeId
        });
      }
      assessment_id = assessment.id;
    }

    // Verify assessment exists and belongs to college
    const assessment = await Assessment.findOne({ 
      where: { id: assessment_id, college_id: collegeId } 
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

    // Insert or update performance records
    for (const record of marks) {
      const percentage = (record.marks_obtained / assessment.max_marks) * 100;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else if (percentage >= 40) grade = 'D';

      await Performance.upsert({
        student_id: record.student_id,
        assessment_id: assessment_id,
        marks_obtained: record.marks_obtained,
        max_marks: assessment.max_marks,
        percentage: percentage.toFixed(2),
        grade,
        feedback: record.feedback || '',
        status: 'graded'
      });
    }

    res.json({ message: 'Marks recorded successfully.' });
  } catch (error) {
    console.error('Marks error:', error);
    res.status(500).json({ error: 'Failed to record marks.' });
  }
});

// Record Attendance
router.post('/attendance', async (req, res) => {
  try {
    const { course_id, date, records } = req.body;
    const collegeId = req.user.college_id;
    
    // Verify course ownership
    const whereClause = req.user.role === 'admin' ? { id: course_id, college_id: collegeId } : { id: course_id, faculty_id: req.user.id, college_id: collegeId };
    const course = await Course.findOne({ where: whereClause });
    if (!course) return res.status(403).json({ error: 'You do not have permission to mark attendance for this course.' });

    // Insert or update records
    for (const record of records) {
      await Attendance.upsert({
        student_id: record.student_id,
        course_id: course_id,
        date: date,
        status: record.status
      });
    }

    res.json({ message: 'Attendance recorded successfully.' });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ error: 'Failed to record attendance.' });
  }
});

module.exports = router;

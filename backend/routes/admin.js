const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { User, Course, Enrollment, Assessment, Notification } = require('../models');

const router = express.Router();

// Institution settings file path
const SETTINGS_PATH = path.join(__dirname, '..', 'institution-settings.json');

const getDefaultSettings = () => ({
  collegeName: 'Vridhi Mitra',
  tagline: 'AI-Powered Student Learning Platform',
  logo: '🌱',
  primaryColor: '#6c5ce7',
  accentColor: '#00cec9',
  website: '',
  address: '',
  phone: '',
  email: ''
});

const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    }
  } catch (err) { console.error('Settings load error:', err); }
  return getDefaultSettings();
};

const saveSettings = (settings) => {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
};

// ===== PUBLIC: Get institution settings (no auth needed) =====
router.get('/settings', (req, res) => {
  res.json({ settings: loadSettings() });
});

// Protected admin routes below
router.use(authenticate, authorize('admin'));

// Admin Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const collegeId = req.user.college_id;
    const totalStudents = await User.count({ where: { role: 'student', college_id: collegeId } });
    const totalFaculty = await User.count({ where: { role: 'faculty', college_id: collegeId } });
    const totalCourses = await Course.count({ where: { college_id: collegeId } });
    const totalAssessments = await Assessment.count({ where: { college_id: collegeId } });
    const recentUsers = await User.findAll({
      where: { college_id: collegeId },
      attributes: { exclude: ['password_hash', 'otp_code', 'otp_expires_at'] },
      order: [['created_at', 'DESC']], limit: 10
    });
    res.json({ totalStudents, totalFaculty, totalCourses, totalAssessments, recentUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load admin dashboard.' });
  }
});

// Manage Users
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    let where = { college_id: req.user.college_id };
    if (role) where.role = role;
    const users = await User.findAll({
      where, attributes: { exclude: ['password_hash', 'otp_code', 'otp_expires_at'] },
      order: [['created_at', 'DESC']]
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, college_id: req.user.college_id } });
    if (!user) return res.status(404).json({ error: 'User not found in your college.' });
    const { name, role, department, semester, is_active } = req.body;
    await user.update({ name, role, department, semester, is_active });
    res.json({ message: 'User updated.', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, college_id: req.user.college_id } });
    if (!user) return res.status(404).json({ error: 'User not found in your college.' });
    await user.update({ is_active: false });
    res.json({ message: 'User deactivated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate user.' });
  }
});

// Manage Courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { college_id: req.user.college_id },
      include: [
        { model: User, as: 'faculty', attributes: ['id', 'name', 'email'] },
        { model: Enrollment, as: 'enrollments' }
      ]
    });
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { name, course_code, description, credits, department, semester, faculty_id } = req.body;
    const course = await Course.create({ 
      name, course_code, description, credits, department, semester, faculty_id,
      college_id: req.user.college_id 
    });
    res.status(201).json({ message: 'Course created.', course });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findOne({ where: { id: req.params.id, college_id: req.user.college_id } });
    if (!course) return res.status(404).json({ error: 'Course not found in your college.' });
    await course.update(req.body);
    res.json({ message: 'Course updated.', course });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

// Enroll student
router.post('/enrollments', async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    
    // Verify both belong to same college
    const student = await User.findOne({ where: { id: student_id, college_id: req.user.college_id } });
    const course = await Course.findOne({ where: { id: course_id, college_id: req.user.college_id } });
    
    if (!student || !course) return res.status(400).json({ error: 'Student or Course not found in your college.' });

    const [enrollment, created] = await Enrollment.findOrCreate({
      where: { student_id, course_id }, defaults: { status: 'active' }
    });
    if (!created) return res.status(409).json({ error: 'Student already enrolled.' });
    res.status(201).json({ message: 'Student enrolled.', enrollment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enroll student.' });
  }
});

// Send notification to user(s)
router.post('/notifications', async (req, res) => {
  try {
    const { user_ids, title, message, type } = req.body;
    
    // Verify all users belong to the college
    const validUsers = await User.findAll({
      where: { id: user_ids, college_id: req.user.college_id },
      attributes: ['id']
    });
    const validIds = validUsers.map(u => u.id);

    const notifications = await Notification.bulkCreate(
      validIds.map(uid => ({ user_id: uid, title, message, type: type || 'info' }))
    );
    res.json({ message: `Notification sent to ${notifications.length} users.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notifications.' });
  }
});

// Update institution settings
router.put('/settings', async (req, res) => {
  try {
    const { College } = require('../models');
    const college = await College.findByPk(req.user.college_id);
    if (!college) return res.status(404).json({ error: 'College not found.' });

    await college.update({
      name: req.body.collegeName,
      tagline: req.body.tagline,
      logo: req.body.logo,
      website: req.body.website,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    });

    res.json({ message: 'Institution settings updated.', settings: college });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

module.exports = router;

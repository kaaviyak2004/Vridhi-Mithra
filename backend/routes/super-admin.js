const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const { College, User, Course, Assessment } = require('../models');

const router = express.Router();

// Only Super Admins can access these routes
router.use(authenticate, authorize('super_admin'));

// Get all colleges with counts
router.get('/colleges', async (req, res) => {
  try {
    const colleges = await College.findAll({
      include: [
        { model: User, as: 'users', attributes: ['id', 'role'] },
        { model: Course, as: 'courses', attributes: ['id'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ colleges });
  } catch (error) {
    console.error('Fetch colleges error:', error);
    res.status(500).json({ error: 'Failed to fetch colleges.' });
  }
});

// Create a new college + optional admin user
router.post('/colleges', async (req, res) => {
  try {
    const { name, slug, tagline, logo, email, phone, website, admin_name, admin_email, admin_password } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'College name and slug are required.' });
    }

    // Check if slug is unique
    const existing = await College.findOne({ where: { slug } });
    if (existing) return res.status(400).json({ error: 'A college with this slug already exists.' });

    const college = await College.create({
      name, slug, tagline: tagline || '', logo: logo || '🏛️', 
      email: email || '', phone: phone || '', website: website || '',
      is_active: true
    });

    // If admin credentials provided, create the admin user for this college
    let adminUser = null;
    if (admin_email && admin_password) {
      const salt = await bcrypt.genSalt(12);
      const password_hash = await bcrypt.hash(admin_password, salt);
      adminUser = await User.create({
        name: admin_name || `${name} Admin`,
        email: admin_email,
        password_hash,
        role: 'admin',
        college_id: college.id,
        is_verified: true,
        is_active: true
      });
    }

    res.status(201).json({ 
      message: 'College created successfully!', 
      college,
      adminUser: adminUser ? { id: adminUser.id, email: adminUser.email } : null
    });
  } catch (error) {
    console.error('Create college error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Admin email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create college: ' + error.message });
  }
});

// Toggle college active status
router.put('/colleges/:id/toggle', async (req, res) => {
  try {
    const college = await College.findByPk(req.params.id);
    if (!college) return res.status(404).json({ error: 'College not found.' });
    
    await college.update({ is_active: !college.is_active });
    res.json({ 
      message: `College ${college.is_active ? 'activated' : 'suspended'}.`, 
      college 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle college status.' });
  }
});

// Get global stats
router.get('/stats', async (req, res) => {
  try {
    const totalColleges = await College.count();
    const activeColleges = await College.count({ where: { is_active: true } });
    const totalUsers = await User.count();
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalFaculty = await User.count({ where: { role: 'faculty' } });
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalCourses = await Course.count();
    const totalAssessments = await Assessment.count();
    
    res.json({ 
      totalColleges, activeColleges, totalUsers, totalStudents, 
      totalFaculty, totalAdmins, totalCourses, totalAssessments 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global stats.' });
  }
});

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { generateOTP, sendOTPEmail } = require('../utils/email');

const router = express.Router();

// ============ PUBLIC: GET COLLEGES ============
router.get('/colleges', async (req, res) => {
  try {
    const { College } = require('../models');
    const colleges = await College.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'slug', 'logo', 'tagline']
    });
    res.json({ colleges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch colleges.' });
  }
});

// ============ REGISTER ============
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, department, semester, college_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash,
      role: role || 'student',
      phone,
      department: department || null,
      semester: semester ? parseInt(semester, 10) : null,
      college_id: college_id || null,
      otp_code: otp,
      otp_expires_at: otpExpires,
      is_verified: false
    });

    // Send OTP email
    await sendOTPEmail(email, otp, name);

    res.status(201).json({
      message: 'Registration successful! Please verify your email with the OTP sent.',
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ============ VERIFY OTP ============
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'Account is already verified.' });
    }

    if (user.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Verify user
    await user.update({
      is_verified: true,
      otp_code: null,
      otp_expires_at: null
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, college_id: user.college_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Email verified successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        college_id: user.college_id
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// ============ LOGIN ============
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { College } = require('../models');
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: College, as: 'college', attributes: ['id', 'name', 'slug', 'logo', 'tagline'] }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    // For development: auto-verify unverified accounts
    if (!user.is_verified && process.env.NODE_ENV === 'development') {
      await user.update({ is_verified: true });
    } else if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, college_id: user.college_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        college_id: user.college_id,
        department: user.department,
        semester: user.semester,
        avatar_url: user.avatar_url,
        college: user.college
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ============ GET CURRENT USER ============
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user data.' });
  }
});

// ============ UPDATE PROFILE ============
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, department, semester, avatar_url } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (department) updates.department = department;
    if (semester) updates.semester = semester;
    if (avatar_url) updates.avatar_url = avatar_url;

    await req.user.update(updates);

    res.json({ message: 'Profile updated.', user: req.user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;

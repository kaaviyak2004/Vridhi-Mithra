const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/db');
const { initializeAI } = require('./utils/ai');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');
const superAdminRoutes = require('./routes/super-admin');
const aiRoutes = require('./routes/ai');
const discussionRoutes = require('./routes/discussion');

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/discussions', discussionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), name: 'Vridhi Mitra API' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ============ START SERVER ============
const startServer = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database tables synced.');
    
    initializeAI();

    app.listen(PORT, () => {
      console.log(`\n🚀 Vridhi Mitra Backend running on http://localhost:${PORT}`);
      console.log(`📊 API Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();

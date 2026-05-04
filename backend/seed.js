const { sequelize } = require('./config/db');
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const password_hash = await bcrypt.hash('password123', 10);

    const users = [
      { name: 'Aarav Sharma', email: 'aarav@student.com', role: 'student', password_hash, is_verified: true, department: 'CS', semester: 3, is_active: true },
      { name: 'Dr. Priya Desai', email: 'priya@vridhimitra.com', role: 'faculty', password_hash, is_verified: true, department: 'CS', is_active: true },
      { name: 'Admin', email: 'admin@vridhimitra.com', role: 'admin', password_hash, is_verified: true, is_active: true }
    ];

    for (let u of users) {
      const existing = await User.findOne({ where: { email: u.email } });
      if (!existing) {
        await User.create(u);
        console.log(`Created ${u.email}`);
      } else {
        console.log(`${u.email} already exists. Updating password.`);
        await existing.update({ password_hash, is_verified: true, is_active: true });
      }
    }
    console.log('Seed complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();

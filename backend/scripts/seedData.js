const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sequelize } = require('../config/db');
const { 
  User, Course, Enrollment, Assessment, Performance, 
  Attendance, LearningPath, Achievement, Notification, College 
} = require('../models');

const seedData = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (tables recreated).');

    const passwordHash = await bcrypt.hash('password123', 12);

    // 1. Create Super Admin (Global)
    await User.create({
      name: 'Global Super Admin',
      email: 'superadmin@vridhimitra.com',
      password_hash: passwordHash,
      role: 'super_admin',
      is_verified: true
    });

    // 2. Define 5 Colleges
    const collegesData = [
      { name: 'RMK Engineering College', tagline: 'Shaping Engineers of Tomorrow', logo: '🏗️' },
      { name: 'Rural Tech Institute', tagline: 'Empowering Rural Innovation', logo: '🌾' },
      { name: 'Village Academy', tagline: 'Education at Every Doorstep', logo: '🏡' },
      { name: 'Modern Polytechnic', tagline: 'Skill-Based Learning', logo: '⚙️' },
      { name: 'Greenwood Science College', tagline: 'Innovation for Sustainability', logo: '🍃' }
    ];

    for (const cData of collegesData) {
      const college = await College.create(cData);
      const collegeNamePrefix = college.name.split(' ')[0].toLowerCase();

      // 3. Create Admin for this college
      const admin = await User.create({
        name: `${college.name} Admin`,
        email: `admin@${collegeNamePrefix}.com`,
        password_hash: passwordHash,
        role: 'admin',
        college_id: college.id,
        is_verified: true
      });

      // 4. Create Faculty for this college
      const faculty = await User.create({
        name: `Dr. ${collegeNamePrefix.toUpperCase()} Faculty`,
        email: `faculty@${collegeNamePrefix}.com`,
        password_hash: passwordHash,
        role: 'faculty',
        college_id: college.id,
        is_verified: true
      });

      // 5. Create 3 Students for this college
      const students = [];
      for (let i = 1; i <= 3; i++) {
        const student = await User.create({
          name: `${collegeNamePrefix} Student ${i}`,
          email: `student${i}@${collegeNamePrefix}.com`,
          password_hash: passwordHash,
          role: 'student',
          college_id: college.id,
          is_verified: true
        });
        students.push(student);
      }

      // 6. Create a Course
      const course = await Course.create({
        name: `Intro to ${college.name} Studies`,
        course_code: `${collegeNamePrefix.toUpperCase()}101`,
        credits: 3,
        department: 'General Studies',
        semester: 1,
        faculty_id: faculty.id,
        college_id: college.id
      });

      // Enroll students in the course
      for (const s of students) {
        await Enrollment.create({ student_id: s.id, course_id: course.id });
      }

      // 7. Create an Assessment & Performance
      const assessment = await Assessment.create({
        course_id: course.id,
        title: 'Initial Evaluation',
        type: 'quiz',
        max_marks: 100,
        created_by: faculty.id,
        college_id: college.id
      });

      for (const s of students) {
        const marks = Math.floor(Math.random() * 41) + 60; // 60-100
        await Performance.create({
          student_id: s.id,
          assessment_id: assessment.id,
          marks_obtained: marks,
          percentage: marks,
          grade: marks >= 90 ? 'A+' : marks >= 80 ? 'A' : 'B'
        });
      }
    }

    console.log('\n✅ Multi-College Seed Data created successfully!');
    console.log('\n📋 Login Credentials Examples:');
    console.log('  Super Admin: superadmin@vridhimitra.com / password123');
    console.log('  RMK Admin:   admin@rmk.com / password123');
    console.log('  Rural Tech:  faculty@rural.com / password123');
    console.log('  Village Stu: student1@village.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();


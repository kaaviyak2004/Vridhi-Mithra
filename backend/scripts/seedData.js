const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Course, Enrollment, Assessment, Performance, Attendance, LearningPath, Achievement, Notification } = require('../models');

const seedData = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (tables recreated).');

    const passwordHash = await bcrypt.hash('password123', 12);

    // Create Admin
    const admin = await User.create({
      name: 'Admin User', email: 'admin@vridhimitra.com', password_hash: passwordHash,
      role: 'admin', department: 'Administration', is_verified: true
    });

    // Create Faculty
    const faculty1 = await User.create({
      name: 'Dr. Priya Sharma', email: 'priya@vridhimitra.com', password_hash: passwordHash,
      role: 'faculty', department: 'Computer Science', is_verified: true
    });
    const faculty2 = await User.create({
      name: 'Prof. Rajesh Kumar', email: 'rajesh@vridhimitra.com', password_hash: passwordHash,
      role: 'faculty', department: 'Mathematics', is_verified: true
    });

    // Create Students
    const students = [];
    const studentData = [
      { name: 'Aarav Patel', email: 'aarav@student.com', semester: 4 },
      { name: 'Diya Gupta', email: 'diya@student.com', semester: 4 },
      { name: 'Vivaan Singh', email: 'vivaan@student.com', semester: 3 },
      { name: 'Ananya Reddy', email: 'ananya@student.com', semester: 4 },
      { name: 'Arjun Nair', email: 'arjun@student.com', semester: 3 },
    ];
    for (const s of studentData) {
      const student = await User.create({
        ...s, password_hash: passwordHash, role: 'student',
        department: 'Computer Science', is_verified: true
      });
      students.push(student);
    }

    // Create Courses
    const course1 = await Course.create({ name: 'Data Structures & Algorithms', course_code: 'CS201', credits: 4, department: 'Computer Science', semester: 4, faculty_id: faculty1.id });
    const course2 = await Course.create({ name: 'Database Management Systems', course_code: 'CS301', credits: 3, department: 'Computer Science', semester: 4, faculty_id: faculty1.id });
    const course3 = await Course.create({ name: 'Engineering Mathematics III', course_code: 'MA301', credits: 4, department: 'Mathematics', semester: 3, faculty_id: faculty2.id });
    const course4 = await Course.create({ name: 'Operating Systems', course_code: 'CS302', credits: 3, department: 'Computer Science', semester: 4, faculty_id: faculty1.id });

    // Enroll students
    for (const s of students) {
      await Enrollment.create({ student_id: s.id, course_id: course1.id });
      await Enrollment.create({ student_id: s.id, course_id: course2.id });
      await Enrollment.create({ student_id: s.id, course_id: course3.id });
    }

    // Create Assessments
    const assessments = [
      { course_id: course1.id, title: 'DSA Quiz 1 - Arrays & Linked Lists', type: 'quiz', max_marks: 50, created_by: faculty1.id },
      { course_id: course1.id, title: 'DSA Midterm Exam', type: 'midterm', max_marks: 100, created_by: faculty1.id },
      { course_id: course1.id, title: 'DSA Assignment - Trees', type: 'assignment', max_marks: 30, created_by: faculty1.id },
      { course_id: course2.id, title: 'DBMS Quiz 1 - SQL Basics', type: 'quiz', max_marks: 40, created_by: faculty1.id },
      { course_id: course2.id, title: 'DBMS Midterm Exam', type: 'midterm', max_marks: 100, created_by: faculty1.id },
      { course_id: course3.id, title: 'Math Quiz 1 - Matrices', type: 'quiz', max_marks: 30, created_by: faculty2.id },
      { course_id: course3.id, title: 'Math Midterm Exam', type: 'midterm', max_marks: 100, created_by: faculty2.id },
    ];
    const createdAssessments = [];
    for (const a of assessments) {
      createdAssessments.push(await Assessment.create(a));
    }

    // Generate performance data for students
    const marksData = [
      [38, 72, 25, 30, 78, 22, 65],  // Aarav
      [45, 88, 28, 36, 92, 28, 85],  // Diya (strong)
      [25, 55, 18, 20, 48, 15, 42],  // Vivaan (weak)
      [40, 78, 26, 32, 80, 25, 75],  // Ananya
      [30, 62, 20, 28, 65, 18, 55],  // Arjun
    ];

    for (let i = 0; i < students.length; i++) {
      for (let j = 0; j < createdAssessments.length; j++) {
        const maxMarks = createdAssessments[j].max_marks;
        const marks = marksData[i][j];
        const pct = ((marks / maxMarks) * 100).toFixed(1);
        let grade = 'F';
        if (pct >= 90) grade = 'A+'; else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B+'; else if (pct >= 60) grade = 'B';
        else if (pct >= 50) grade = 'C'; else if (pct >= 40) grade = 'D';

        await Performance.create({
          student_id: students[i].id, assessment_id: createdAssessments[j].id,
          marks_obtained: marks, percentage: parseFloat(pct), grade
        });
      }
    }

    // Generate attendance data
    const today = new Date();
    for (let day = 0; day < 30; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const dateStr = date.toISOString().split('T')[0];

      for (const s of students) {
        const rand = Math.random();
        const status = rand > 0.15 ? 'present' : (rand > 0.05 ? 'late' : 'absent');
        await Attendance.create({ student_id: s.id, course_id: course1.id, date: dateStr, status });
        await Attendance.create({ student_id: s.id, course_id: course2.id, date: dateStr, status: Math.random() > 0.1 ? 'present' : 'absent' });
      }
    }

    // Create learning paths for weak student (Vivaan)
    await LearningPath.create({
      student_id: students[2].id, title: 'Master Arrays & Linked Lists',
      topic: 'Data Structures - Arrays', description: 'Focus on array manipulation techniques and linked list operations',
      priority: 'critical', status: 'in-progress', progress_percent: 30,
      resources: ['GeeksforGeeks Arrays', 'LeetCode Easy Array Problems'],
      due_date: new Date(Date.now() + 14 * 86400000)
    });
    await LearningPath.create({
      student_id: students[2].id, title: 'SQL Fundamentals Revision',
      topic: 'DBMS - SQL', description: 'Revise SQL queries, joins, and normalization',
      priority: 'high', status: 'pending', progress_percent: 0,
      resources: ['W3Schools SQL Tutorial', 'HackerRank SQL Practice'],
      due_date: new Date(Date.now() + 21 * 86400000)
    });

    // Create achievements
    await Achievement.create({ student_id: students[1].id, title: 'Top Scorer', description: 'Scored highest in DBMS Midterm', badge_icon: '🏆', category: 'academic' });
    await Achievement.create({ student_id: students[0].id, title: 'Perfect Attendance', description: '30 days consecutive attendance', badge_icon: '📅', category: 'consistency' });
    await Achievement.create({ student_id: students[3].id, title: 'Rising Star', description: 'Improved performance by 20%', badge_icon: '⭐', category: 'improvement' });

    // Create notifications
    for (const s of students) {
      await Notification.create({ user_id: s.id, title: 'Welcome to Vridhi Mitra!', message: 'Start exploring your personalized dashboard.', type: 'info' });
    }
    await Notification.create({ user_id: students[2].id, title: 'New Learning Path', message: 'AI has generated a new study plan for you.', type: 'warning' });

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('  Admin:   admin@vridhimitra.com / password123');
    console.log('  Faculty: priya@vridhimitra.com / password123');
    console.log('  Student: aarav@student.com / password123');
    console.log('  Student: diya@student.com / password123');
    console.log('  Student (weak): vivaan@student.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();

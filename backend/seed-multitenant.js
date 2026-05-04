const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');
const { College, User, Course, Assessment, Enrollment, DiscussionPost } = require('./models');
const { Op } = require('sequelize');

async function seedMultiTenant() {
  try {
    console.log('🔄 Starting multi-tenant seed...\n');

    // ============ 1. CLEAR OLD DATA ============
    console.log('🧹 Cleaning old data...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await DiscussionPost.destroy({ where: {}, force: true });
    await Enrollment.destroy({ where: {}, force: true });
    const { Performance } = require('./models');
    await Performance.destroy({ where: {}, force: true });
    await Assessment.destroy({ where: {}, force: true });
    await Course.destroy({ where: {}, force: true });
    await User.destroy({ where: { role: { [Op.ne]: 'super_admin' } }, force: true });
    await College.destroy({ where: {}, force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old data cleared.\n');

    // ============ 2. DEFINE 4 COLLEGES ============
    const collegesData = [
      {
        name: 'RMK Engineering College',
        slug: 'rmk',
        tagline: 'Shaping Engineers of Tomorrow',
        logo: '🏗️',
        email: 'admin@rmkec.ac.in',
        website: 'https://www.rmkec.ac.in',
        admin: { name: 'RMK Admin', email: 'admin@rmk.ac.in' },
        faculty: [
          { name: 'Dr. Priya Natarajan', email: 'priya@rmkec.ac.in', dept: 'CSE' },
        ],
        students: [
          { name: 'Aarav Sharma', email: 'aarav@rmkec.ac.in', dept: 'CSE', sem: 3 },
          { name: 'Diya Patel', email: 'diya@rmkec.ac.in', dept: 'CSE', sem: 5 },
          { name: 'Kabir Reddy', email: 'kabir@rmkec.ac.in', dept: 'CSE', sem: 7 },
        ],
        courses: [
          { name: 'Data Structures & Algorithms', code: 'CS201', dept: 'CSE', sem: 3 },
          { name: 'Database Management Systems', code: 'CS301', dept: 'CSE', sem: 5 },
          { name: 'Artificial Intelligence', code: 'CS401', dept: 'CSE', sem: 7 },
        ],
      },
      {
        name: 'RMK College of Engineering & Technology',
        slug: 'rmkcet',
        tagline: 'Innovation Meets Excellence',
        logo: '⚙️',
        email: 'admin@rmkcet.ac.in',
        website: 'https://www.rmkcet.ac.in',
        admin: { name: 'RMKCET Admin', email: 'admin@rmkcet.ac.in' },
        faculty: [
          { name: 'Prof. Karthik Subramanian', email: 'karthik@rmkcet.ac.in', dept: 'IT' },
        ],
        students: [
          { name: 'Meera Iyer', email: 'meera@rmkcet.ac.in', dept: 'IT', sem: 3 },
          { name: 'Rohan Das', email: 'rohan@rmkcet.ac.in', dept: 'IT', sem: 5 },
        ],
        courses: [
          { name: 'Web Technologies', code: 'IT201', dept: 'IT', sem: 3 },
          { name: 'Cloud Computing', code: 'IT301', dept: 'IT', sem: 5 },
        ],
      },
      {
        name: 'Easwari Medical & Dental College',
        slug: 'emd',
        tagline: 'Healing Hands, Caring Hearts',
        logo: '🏥',
        email: 'admin@emd.ac.in',
        website: 'https://www.emd.ac.in',
        admin: { name: 'EMD Admin', email: 'admin@emd.ac.in' },
        faculty: [
          { name: 'Dr. Lakshmi Venkatesh', email: 'lakshmi@emd.ac.in', dept: 'Medicine' },
        ],
        students: [
          { name: 'Ananya Krishnan', email: 'ananya@emd.ac.in', dept: 'Medicine', sem: 1 },
          { name: 'Vikram Sundaram', email: 'vikram@emd.ac.in', dept: 'Medicine', sem: 3 },
        ],
        courses: [
          { name: 'Human Anatomy', code: 'MD101', dept: 'Medicine', sem: 1 },
          { name: 'Pharmacology', code: 'MD201', dept: 'Medicine', sem: 3 },
        ],
      },
      {
        name: 'Saveetha Engineering College',
        slug: 'saveetha',
        tagline: 'Nurturing Global Engineers',
        logo: '🎓',
        email: 'admin@saveetha.ac.in',
        website: 'https://www.saveetha.ac.in',
        admin: { name: 'Saveetha Admin', email: 'admin@saveetha.ac.in' },
        faculty: [
          { name: 'Dr. Ramesh Babu', email: 'ramesh@saveetha.ac.in', dept: 'AI&DS' },
        ],
        students: [
          { name: 'Sneha Rajendran', email: 'sneha@saveetha.ac.in', dept: 'AI&DS', sem: 5 },
          { name: 'Arjun Menon', email: 'arjun@saveetha.ac.in', dept: 'ECE', sem: 3 },
          { name: 'Divya Narayanan', email: 'divya@saveetha.ac.in', dept: 'CSE', sem: 7 },
        ],
        courses: [
          { name: 'Machine Learning', code: 'AI301', dept: 'AI&DS', sem: 5 },
          { name: 'Internet of Things', code: 'EC201', dept: 'ECE', sem: 3 },
          { name: 'Cyber Security', code: 'CS501', dept: 'CSE', sem: 7 },
        ],
      }
    ];

    const salt = await bcrypt.genSalt(12);
    const defaultHash = await bcrypt.hash('password123', salt);

    for (const cd of collegesData) {
      console.log(`\n📌 Creating: ${cd.name}`);

      // Step 1: Create College
      const college = await College.create({
        name: cd.name, slug: cd.slug, tagline: cd.tagline,
        logo: cd.logo, email: cd.email, website: cd.website, is_active: true
      });

      // Step 2: Create Admin
      await User.create({
        name: cd.admin.name, email: cd.admin.email,
        password_hash: defaultHash, role: 'admin',
        college_id: college.id, department: 'Administration',
        is_verified: true, is_active: true
      });
      console.log(`   👤 Admin: ${cd.admin.email}`);

      // Step 3: Create ALL Students FIRST (before courses/enrollments)
      const studentRecords = [];
      for (const s of cd.students) {
        const student = await User.create({
          name: s.name, email: s.email,
          password_hash: defaultHash, role: 'student',
          college_id: college.id, department: s.dept, semester: s.sem,
          is_verified: true, is_active: true
        });
        studentRecords.push(student);
        console.log(`   🎒 Student: ${s.email}`);
      }

      // Step 4: Create Faculty
      for (const f of cd.faculty) {
        const faculty = await User.create({
          name: f.name, email: f.email,
          password_hash: defaultHash, role: 'faculty',
          college_id: college.id, department: f.dept,
          is_verified: true, is_active: true
        });
        console.log(`   👨‍🏫 Faculty: ${f.email}`);

        // Step 5: Create Courses assigned to this faculty
        for (const c of cd.courses) {
          const course = await Course.create({
            name: c.name, course_code: c.code,
            department: c.dept, semester: c.sem, credits: 4,
            faculty_id: faculty.id, college_id: college.id
          });
          console.log(`   📚 Course: ${c.name}`);

          // Step 6: Create Assessment for each course
          await Assessment.create({
            title: `${c.name} - Mid Term Quiz`,
            description: `Mid-semester evaluation for ${c.name}`,
            type: 'quiz', max_marks: 50,
            course_id: course.id, created_by: faculty.id,
            college_id: college.id,
            questions: [
              { question: `What is the core concept of ${c.name}?`, options: ['Theory A', 'Theory B', 'Theory C', 'Theory D'], correctIndex: 0 },
              { question: `Which tool is most used in ${c.name}?`, options: ['Tool X', 'Tool Y', 'Tool Z', 'Tool W'], correctIndex: 1 },
              { question: `Best practice in ${c.name}?`, options: ['Practice A', 'Practice B', 'Practice C', 'Practice D'], correctIndex: 2 },
            ]
          });

          // Step 7: Enroll ALL students into ALL courses of their college
          for (const student of studentRecords) {
            await Enrollment.create({
              student_id: student.id, course_id: course.id, status: 'active'
            });
          }
          console.log(`      ✅ Enrolled ${studentRecords.length} students`);
        }
      }

      // Step 8: Create discussion post
      if (studentRecords.length > 0) {
        await DiscussionPost.create({
          title: `Welcome to ${cd.name} Discussion Forum!`,
          content: `This is the official discussion space for ${cd.name}. Ask questions, share resources, and collaborate with your classmates!`,
          user_id: studentRecords[0].id,
          college_id: college.id,
          category: 'discussion'
        });
      }

      console.log(`   ✅ ${cd.name} setup complete!`);
    }

    // ============ 3. VERIFY SUPER ADMIN ============
    let superAdmin = await User.findOne({ where: { role: 'super_admin' } });
    if (!superAdmin) {
      const superHash = await bcrypt.hash('superadmin123', salt);
      superAdmin = await User.create({
        name: 'Vridhi Mitra Super Admin',
        email: 'super@vridhimitra.com',
        password_hash: superHash,
        role: 'super_admin',
        is_verified: true, is_active: true
      });
      console.log('\n✅ Super Admin CREATED: super@vridhimitra.com');
    } else {
      console.log('\n✅ Super Admin exists: ' + superAdmin.email);
    }

    // ============ 4. SUMMARY ============
    const totalColleges = await College.count();
    const totalUsers = await User.count();
    const totalCourses = await Course.count();
    const totalAssessments = await Assessment.count();
    const totalEnrollments = await Enrollment.count();

    console.log('\n' + '='.repeat(60));
    console.log('🚀 MULTI-TENANT SEED COMPLETE!');
    console.log('='.repeat(60));
    console.log(`   Colleges:     ${totalColleges}`);
    console.log(`   Users:        ${totalUsers}`);
    console.log(`   Courses:      ${totalCourses}`);
    console.log(`   Assessments:  ${totalAssessments}`);
    console.log(`   Enrollments:  ${totalEnrollments}`);
    console.log('='.repeat(60));
    console.log('\n📋 LOGIN CREDENTIALS (all passwords: password123)');
    console.log('─'.repeat(60));
    console.log('  🛡️  SUPER ADMIN: super@vridhimitra.com / superadmin123');
    console.log('─'.repeat(60));
    for (const cd of collegesData) {
      console.log(`\n  ${cd.logo} ${cd.name}:`);
      console.log(`     Admin:   ${cd.admin.email}`);
      cd.faculty.forEach(f => console.log(`     Faculty: ${f.email}`));
      cd.students.forEach(s => console.log(`     Student: ${s.email}`));
    }
    console.log('\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seedMultiTenant();

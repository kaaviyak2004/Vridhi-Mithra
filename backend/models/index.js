const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Assessment = require('./Assessment');
const Performance = require('./Performance');
const Attendance = require('./Attendance');
const LearningPath = require('./LearningPath');
const CourseMaterial = require('./CourseMaterial');
const ChatMessage = require('./ChatMessage');
const Notification = require('./Notification');
const Achievement = require('./Achievement');
const College = require('./College');
const { DiscussionPost, DiscussionReply } = require('./Discussion');
const QuestionBank = require('./QuestionBank');

// ============ MULTI-TENANCY ASSOCIATIONS ============

// College <-> User
College.hasMany(User, { foreignKey: 'college_id', as: 'users' });
User.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

// College <-> Course
College.hasMany(Course, { foreignKey: 'college_id', as: 'courses' });
Course.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

// College <-> Assessment
College.hasMany(Assessment, { foreignKey: 'college_id', as: 'assessments' });
Assessment.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

// College <-> Discussion
College.hasMany(DiscussionPost, { foreignKey: 'college_id', as: 'discussionPosts' });
DiscussionPost.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

// ============ DATA ASSOCIATIONS ============

// User <-> Course (Faculty teaches courses)
User.hasMany(Course, { foreignKey: 'faculty_id', as: 'taughtCourses' });
Course.belongsTo(User, { foreignKey: 'faculty_id', as: 'faculty' });

// User <-> Enrollment <-> Course (Students enroll in courses)
User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Course <-> Assessment
Course.hasMany(Assessment, { foreignKey: 'course_id', as: 'assessments' });
Assessment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
User.hasMany(Assessment, { foreignKey: 'created_by', as: 'createdAssessments' });
Assessment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Course <-> QuestionBank
Course.hasMany(QuestionBank, { foreignKey: 'course_id', as: 'questionBank' });
QuestionBank.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// User <-> Performance <-> Assessment
User.hasMany(Performance, { foreignKey: 'student_id', as: 'performances' });
Performance.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Assessment.hasMany(Performance, { foreignKey: 'assessment_id', as: 'performances' });
Performance.belongsTo(Assessment, { foreignKey: 'assessment_id', as: 'assessment' });

// User <-> Attendance <-> Course
User.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendanceRecords' });
Attendance.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Course.hasMany(Attendance, { foreignKey: 'course_id', as: 'attendanceRecords' });
Attendance.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// User <-> LearningPath
User.hasMany(LearningPath, { foreignKey: 'student_id', as: 'learningPaths' });
LearningPath.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// User <-> ChatMessage
User.hasMany(ChatMessage, { foreignKey: 'user_id', as: 'chatMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Achievement
User.hasMany(Achievement, { foreignKey: 'student_id', as: 'achievements' });
Achievement.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Discussion associations
User.hasMany(DiscussionPost, { foreignKey: 'user_id', as: 'posts' });
DiscussionPost.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Course.hasMany(DiscussionPost, { foreignKey: 'course_id', as: 'posts' });
DiscussionPost.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

DiscussionPost.hasMany(DiscussionReply, { foreignKey: 'post_id', as: 'replies' });
DiscussionReply.belongsTo(DiscussionPost, { foreignKey: 'post_id', as: 'post' });
User.hasMany(DiscussionReply, { foreignKey: 'user_id', as: 'replies' });
DiscussionReply.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// Course Material Associations
Course.hasMany(CourseMaterial, { foreignKey: 'course_id', as: 'materials', onDelete: 'CASCADE' });
CourseMaterial.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
User.hasMany(CourseMaterial, { foreignKey: 'created_by', as: 'uploadedMaterials', onDelete: 'SET NULL' });
CourseMaterial.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  User,
  Course,
  Enrollment,
  Assessment,
  Performance,
  Attendance,
  LearningPath,
  CourseMaterial,
  ChatMessage,
  Notification,
  Achievement,
  College,
  DiscussionPost,
  DiscussionReply,
  QuestionBank
};

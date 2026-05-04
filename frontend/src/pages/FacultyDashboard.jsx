import { useState, useEffect } from 'react';
import { FiUsers, FiBookOpen, FiFileText, FiPlus, FiEye, FiDownload, FiUploadCloud, FiCheckCircle, FiEdit3 } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerf, setStudentPerf] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Forms state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', course_code: '', description: '', credits: 3, department: '', semester: 1 });
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialForm, setMaterialForm] = useState({ title: '', type: 'document', link_url: '', file: null });

  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', type: 'quiz', max_marks: 100, due_date: '', numberOfQuestions: 10 });

  // Attendance state
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [courseStudents, setCourseStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Marks entry state
  const [showMarksForm, setShowMarksForm] = useState(false);
  const [courseAssessments, setCourseAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [marksEntries, setMarksEntries] = useState({});
  const [feedbackEntries, setFeedbackEntries] = useState({});
  const [marksLoading, setMarksLoading] = useState(false);

  const fetchData = async () => {
    try {
      const { data: d } = await api.get('/faculty/dashboard');
      setData(d);
      const { data: s } = await api.get('/faculty/students');
      setStudents(s.students || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const viewStudent = async (id) => {
    try {
      const { data: d } = await api.get(`/faculty/students/${id}/performance`);
      setStudentPerf(d);
      setSelectedStudent(id);
      setTab('student');
    } catch (err) { toast.error('Failed to load student data'); }
  };

  const openCourse = async (course) => {
    setSelectedCourse(course);
    setTab('course_manage');
    fetchMaterials(course.id);
  };

  const fetchMaterials = async (courseId) => {
    try {
      const { data: m } = await api.get(`/faculty/courses/${courseId}/materials`);
      setCourseMaterials(m.materials || []);
    } catch (err) { console.error(err); }
  };

  // CREATE COURSE
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/faculty/courses', courseForm);
      toast.success('Course created!');
      setShowCourseForm(false);
      setCourseForm({ name: '', course_code: '', description: '', credits: 3, department: '', semester: 1 });
      fetchData();
    } catch (err) { toast.error('Failed to create course'); }
  };

  // UPLOAD MATERIAL (DCM)
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const formData = new FormData();
      formData.append('title', materialForm.title);
      formData.append('type', materialForm.type);
      if (materialForm.link_url) formData.append('link_url', materialForm.link_url);
      if (materialForm.file) formData.append('file', materialForm.file);

      await api.post(`/faculty/courses/${selectedCourse.id}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Material uploaded!');
      setShowMaterialForm(false);
      setMaterialForm({ title: '', type: 'document', link_url: '', file: null });
      fetchMaterials(selectedCourse.id);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to upload material'); }
  };

  // CREATE QUIZ/ASSESSMENT
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await api.post('/faculty/assessments', { ...quizForm, course_id: selectedCourse.id });
      toast.success('Assessment created!');
      setShowQuizForm(false);
      setQuizForm({ title: '', description: '', type: 'quiz', max_marks: 100, due_date: '', numberOfQuestions: 10 });
      fetchData(); // refresh dashboard stats
    } catch (err) { toast.error('Failed to create assessment'); }
  };

  // EXPORT EXCEL
  const handleExportAnalytics = () => {
    const url = `http://localhost:5000/api/faculty/export/analytics?token=${localStorage.getItem('vridhi_token')}`;
    window.open(url, '_blank');
  };

  // FETCH COURSE STUDENTS for attendance/marks
  const fetchCourseStudents = async (courseId) => {
    try {
      const { data } = await api.get(`/faculty/students?course_id=${courseId}`);
      setCourseStudents(data.students || []);
      // Initialize attendance records to 'present' for all students
      const records = {};
      (data.students || []).forEach(s => { records[s.id] = 'present'; });
      setAttendanceRecords(records);
    } catch (err) { console.error(err); }
  };

  // FETCH COURSE ASSESSMENTS for marks entry
  const fetchCourseAssessments = async (courseId) => {
    try {
      const { data } = await api.get(`/faculty/assessments?course_id=${courseId}`);
      setCourseAssessments(data.assessments || []);
    } catch (err) { console.error(err); }
  };

  // OPEN ATTENDANCE FORM
  const openAttendanceForm = async () => {
    setShowAttendanceForm(true);
    setShowMarksForm(false);
    await fetchCourseStudents(selectedCourse.id);
  };

  // OPEN MARKS FORM
  const openMarksForm = async () => {
    setShowMarksForm(true);
    setShowAttendanceForm(false);
    await fetchCourseStudents(selectedCourse.id);
    await fetchCourseAssessments(selectedCourse.id);
  };

  // SUBMIT ATTENDANCE
  const handleSubmitAttendance = async () => {
    if (courseStudents.length === 0) return toast.error('No students to mark.');
    setAttendanceLoading(true);
    try {
      const records = courseStudents.map(s => ({ student_id: s.id, status: attendanceRecords[s.id] || 'present' }));
      await api.post('/faculty/attendance', { course_id: selectedCourse.id, date: attendanceDate, records });
      toast.success(`Attendance marked for ${records.length} students!`);
      setShowAttendanceForm(false);
    } catch (err) { toast.error('Failed to record attendance'); }
    finally { setAttendanceLoading(false); }
  };

  // SUBMIT MARKS
  const handleSubmitMarks = async () => {
    if (!selectedAssessment) return toast.error('Select an assessment first.');
    const entries = courseStudents
      .filter(s => marksEntries[s.id] !== undefined && marksEntries[s.id] !== '')
      .map(s => ({ student_id: s.id, marks_obtained: parseFloat(marksEntries[s.id]), feedback: feedbackEntries[s.id] || '' }));
    if (entries.length === 0) return toast.error('Enter marks for at least one student.');
    setMarksLoading(true);
    try {
      await api.post('/faculty/marks', { 
        assessment_id: selectedAssessment, 
        course_id: selectedCourse.id,
        marks: entries 
      });
      toast.success(`Marks entered for ${entries.length} students!`);
      setShowMarksForm(false);
      setMarksEntries({});
      setFeedbackEntries({});
    } catch (err) { toast.error('Failed to submit marks'); }
    finally { setMarksLoading(false); }
  };

  if (loading) return <div className="skeleton" style={{height: 400, borderRadius: 16}} />;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap: 16}}>
        <div>
          <h1>👨‍🏫 Faculty Dashboard</h1>
          <p>Manage your courses, students, and assessments</p>
        </div>
        <div style={{display:'flex', gap: 8}}>
          <button className="btn btn-primary" onClick={() => setShowCourseForm(true)}><FiPlus /> Create Course</button>
          <button className="btn btn-secondary" onClick={handleExportAnalytics}><FiDownload /> Export Analytics</button>
        </div>
      </div>

      {showCourseForm && (
        <div className="card" style={{marginBottom: 24, border: '1px solid var(--primary)'}}>
          <h3 style={{marginBottom: 16}}>Create New Course</h3>
          <form onSubmit={handleCreateCourse} className="grid grid-2" style={{gap: 16}}>
            <div className="form-group"><label>Course Name</label><input className="form-input" required value={courseForm.name} onChange={e=>setCourseForm(f=>({...f,name:e.target.value}))}/></div>
            <div className="form-group"><label>Course Code</label><input className="form-input" required value={courseForm.course_code} onChange={e=>setCourseForm(f=>({...f,course_code:e.target.value}))}/></div>
            <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Description</label><textarea className="form-input" required value={courseForm.description} onChange={e=>setCourseForm(f=>({...f,description:e.target.value}))}/></div>
            <div className="form-group"><label>Credits</label><input type="number" className="form-input" required value={courseForm.credits} onChange={e=>setCourseForm(f=>({...f,credits:e.target.value}))}/></div>
            <div className="form-group"><label>Department</label><input className="form-input" required value={courseForm.department} onChange={e=>setCourseForm(f=>({...f,department:e.target.value}))}/></div>
            <div className="form-group"><label>Semester</label><input type="number" className="form-input" required value={courseForm.semester} onChange={e=>setCourseForm(f=>({...f,semester:e.target.value}))}/></div>
            <div style={{gridColumn: '1 / -1', display:'flex', gap:8}}>
              <button type="submit" className="btn btn-primary">Create</button>
              <button type="button" className="btn btn-secondary" onClick={()=>setShowCourseForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-3">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(138, 43, 226, 0.15)',color:'var(--primary)'}}><FiBookOpen /></div>
          <div className="stat-value">{data?.totalCourses || 0}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(217, 70, 239, 0.15)',color:'var(--accent)'}}><FiUsers /></div>
          <div className="stat-value">{data?.totalStudents || 0}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(138, 43, 226, 0.15)',color:'var(--primary)'}}><FiFileText /></div>
          <div className="stat-value">{data?.totalAssessments || 0}</div>
          <div className="stat-label">Assessments</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,margin:'24px 0 16px', flexWrap:'wrap'}}>
        <button className={`btn ${tab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('overview')}>Courses</button>
        <button className={`btn ${tab === 'students' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('students')}>Students</button>
        {selectedCourse && <button className={`btn ${tab === 'course_manage' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('course_manage')}>Manage: {selectedCourse.course_code}</button>}
        {studentPerf && <button className={`btn ${tab === 'student' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('student')}>Student Detail</button>}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-2">
          {(data?.courses || []).map(c => (
            <div key={c.id} className="card" style={{cursor:'pointer'}} onClick={() => openCourse(c)}>
              <h3 style={{fontSize:16,fontWeight:700}}>{c.name}</h3>
              <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:12}}>{c.course_code}</p>
              <div style={{display:'flex',gap:16}}>
                <span className="badge badge-primary">{c.studentCount} students</span>
                <span className="badge badge-info">{c.assessmentCount} assessments</span>
              </div>
              <div style={{marginTop:16}}><span className="btn btn-sm btn-secondary">Manage Course →</span></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'course_manage' && selectedCourse && (
        <div>
          <div className="card" style={{marginBottom:16}}>
            <h2>{selectedCourse.name} ({selectedCourse.course_code})</h2>
            <div style={{display:'flex', gap:8, marginTop: 16, flexWrap:'wrap'}}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMaterialForm(true)}><FiUploadCloud /> Add Material (DCM)</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowQuizForm(true)}><FiPlus /> Post Assessment</button>
              <button className="btn btn-primary btn-sm" onClick={openAttendanceForm}><FiCheckCircle /> Mark Attendance</button>
              <button className="btn btn-primary btn-sm" onClick={openMarksForm}><FiEdit3 /> Enter Marks</button>
            </div>
          </div>

          {showMaterialForm && (
            <div className="card" style={{marginBottom: 16, border: '1px solid var(--primary)'}}>
              <h3>Upload Digital Content Material</h3>
              <form onSubmit={handleUploadMaterial} className="grid grid-2" style={{gap:16, marginTop:16}}>
                <div className="form-group"><label>Title</label><input className="form-input" required value={materialForm.title} onChange={e=>setMaterialForm(f=>({...f,title:e.target.value}))}/></div>
                <div className="form-group"><label>Type</label><select className="form-input" value={materialForm.type} onChange={e=>setMaterialForm(f=>({...f,type:e.target.value}))}><option value="document">Document</option><option value="pdf">PDF</option><option value="video">Video</option><option value="link">Link</option></select></div>
                <div className="form-group"><label>Resource Link (If linking)</label><input className="form-input" type="url" value={materialForm.link_url} onChange={e=>setMaterialForm(f=>({...f,link_url:e.target.value}))}/></div>
                <div className="form-group"><label>Or Upload File</label><input className="form-input" type="file" onChange={e=>setMaterialForm(f=>({...f,file:e.target.files[0]}))}/></div>
                <div style={{gridColumn: '1 / -1', display:'flex', gap:8}}>
                  <button type="submit" className="btn btn-primary">Upload</button>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowMaterialForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {showQuizForm && (
             <div className="card" style={{marginBottom: 16, border: '1px solid var(--success)'}}>
              <h3>Create Assessment/Quiz</h3>
              <form onSubmit={handleCreateQuiz} className="grid grid-2" style={{gap:16, marginTop:16}}>
                <div className="form-group"><label>Title</label><input className="form-input" required value={quizForm.title} onChange={e=>setQuizForm(f=>({...f,title:e.target.value}))}/></div>
                <div className="form-group"><label>Type</label><select className="form-input" value={quizForm.type} onChange={e=>setQuizForm(f=>({...f,type:e.target.value}))}><option value="quiz">Quiz</option><option value="assignment">Assignment</option><option value="project">Project</option></select></div>
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  {quizForm.type === 'quiz' ? (
                    <div>
                      <label style={{marginBottom: 12, display:'block'}}>Automated Quiz Generation</label>
                      <div style={{padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--primary-glow)'}}>
                        <p style={{fontSize: 13, color: 'var(--text-muted)', marginBottom: 16}}>
                          The system will randomly pull questions from the course's Question Bank and assign them to each student.
                        </p>
                        <div className="form-group" style={{maxWidth: 200}}>
                          <label>Number of Random Questions</label>
                          <input type="number" min="1" max="50" className="form-input" required value={quizForm.numberOfQuestions} onChange={e => setQuizForm(f => ({ ...f, numberOfQuestions: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label>Description/Instructions</label>
                      <textarea className="form-input" required value={quizForm.description} onChange={e=>setQuizForm(f=>({...f,description:e.target.value}))}/>
                    </>
                  )}
                </div>
                <div className="form-group"><label>Max Marks</label><input type="number" className="form-input" required value={quizForm.max_marks} onChange={e=>setQuizForm(f=>({...f,max_marks:e.target.value}))}/></div>
                <div className="form-group"><label>Due Date</label><input type="date" className="form-input" value={quizForm.due_date} onChange={e=>setQuizForm(f=>({...f,due_date:e.target.value}))}/></div>
                <div style={{gridColumn: '1 / -1', display:'flex', gap:8}}>
                  <button type="submit" className="btn btn-success">Create Assessment</button>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowQuizForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ===== ATTENDANCE FORM ===== */}
          {showAttendanceForm && (
            <div className="card" style={{marginBottom: 16, border: '1px solid var(--success)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16}}>
                <h3>📋 Mark Attendance</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => setShowAttendanceForm(false)}>✕ Close</button>
              </div>
              <div className="form-group" style={{marginBottom: 16, maxWidth: 250}}>
                <label>Date</label>
                <input type="date" className="form-input" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
              </div>
              {courseStudents.length === 0 ? <p style={{color:'var(--text-muted)'}}>No students enrolled in this course.</p> : (
                <>
                  <div style={{overflowX:'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr><th>#</th><th>Student Name</th><th>Email</th><th style={{textAlign:'center'}}>Present</th><th style={{textAlign:'center'}}>Absent</th><th style={{textAlign:'center'}}>Late</th></tr>
                      </thead>
                      <tbody>
                        {courseStudents.map((s, i) => (
                          <tr key={s.id}>
                            <td>{i+1}</td>
                            <td style={{fontWeight:600, color:'var(--text-primary)'}}>{s.name}</td>
                            <td style={{fontSize:13, color:'var(--text-muted)'}}>{s.email}</td>
                            <td style={{textAlign:'center'}}>
                              <input type="radio" name={`att-${s.id}`} checked={attendanceRecords[s.id] === 'present'}
                                onChange={() => setAttendanceRecords(prev => ({...prev, [s.id]: 'present'}))} />
                            </td>
                            <td style={{textAlign:'center'}}>
                              <input type="radio" name={`att-${s.id}`} checked={attendanceRecords[s.id] === 'absent'}
                                onChange={() => setAttendanceRecords(prev => ({...prev, [s.id]: 'absent'}))} />
                            </td>
                            <td style={{textAlign:'center'}}>
                              <input type="radio" name={`att-${s.id}`} checked={attendanceRecords[s.id] === 'late'}
                                onChange={() => setAttendanceRecords(prev => ({...prev, [s.id]: 'late'}))} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{display:'flex', gap: 8, marginTop: 16}}>
                    <button className="btn btn-success" onClick={handleSubmitAttendance} disabled={attendanceLoading}>
                      {attendanceLoading ? 'Saving...' : `✓ Submit Attendance (${courseStudents.length} students)`}
                    </button>
                    <button className="btn btn-secondary" onClick={() => {
                      const records = {};
                      courseStudents.forEach(s => { records[s.id] = 'present'; });
                      setAttendanceRecords(records);
                    }}>Mark All Present</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== MARKS ENTRY FORM ===== */}
          {showMarksForm && (
            <div className="card" style={{marginBottom: 16, border: '1px solid var(--warning)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16}}>
                <h3>📝 Enter Marks</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => setShowMarksForm(false)}>✕ Close</button>
              </div>
              <div className="form-group" style={{marginBottom: 16, maxWidth: 400}}>
                <label>Select Exam Category</label>
                <select className="form-input" value={selectedAssessment || ''} onChange={e => setSelectedAssessment(e.target.value)}>
                  <option value="">-- Choose Category --</option>
                  <option value="FIAT">FIAT (First Internal Assessment Test)</option>
                  <option value="SIAT">SIAT (Second Internal Assessment Test)</option>
                  <option value="Model">Model Exam</option>
                </select>
              </div>
              {selectedAssessment && courseStudents.length > 0 && (
                <>
                  <p style={{fontSize:13, color:'var(--text-muted)', marginBottom:12}}>
                    Max Marks: <strong>{
                      (selectedAssessment === 'FIAT' || selectedAssessment === 'SIAT' || selectedAssessment === 'Model') ? 100 : 
                      (courseAssessments.find(a => a.id == selectedAssessment)?.max_marks || '—')
                    }</strong>
                  </p>
                  <div style={{overflowX:'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr><th>#</th><th>Student Name</th><th>Marks</th><th>Feedback (optional)</th></tr>
                      </thead>
                      <tbody>
                        {courseStudents.map((s, i) => (
                          <tr key={s.id}>
                            <td>{i+1}</td>
                            <td style={{fontWeight:600, color:'var(--text-primary)'}}>{s.name}</td>
                            <td style={{width: 120}}>
                              <input type="number" className="form-input" placeholder="0" min="0"
                                max={
                                  (selectedAssessment === 'FIAT' || selectedAssessment === 'SIAT' || selectedAssessment === 'Model') ? 100 : 
                                  (courseAssessments.find(a => a.id == selectedAssessment)?.max_marks || 100)
                                }
                                value={marksEntries[s.id] || ''}
                                onChange={e => setMarksEntries(prev => ({...prev, [s.id]: e.target.value}))} />
                            </td>
                            <td>
                              <input className="form-input" placeholder="Optional feedback..."
                                value={feedbackEntries[s.id] || ''}
                                onChange={e => setFeedbackEntries(prev => ({...prev, [s.id]: e.target.value}))} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button className="btn btn-success" style={{marginTop:16}} onClick={handleSubmitMarks} disabled={marksLoading}>
                    {marksLoading ? 'Saving...' : '✓ Submit Marks'}
                  </button>
                </>
              )}
              {selectedAssessment && courseStudents.length === 0 && <p style={{color:'var(--text-muted)'}}>No students enrolled.</p>}
              {!selectedAssessment && <p style={{color:'var(--text-muted)'}}>Select an assessment above to enter marks.</p>}
            </div>
          )}

          <div className="card">
            <h3>Course Materials (DCM)</h3>
            {courseMaterials.length === 0 ? <p style={{color:'var(--text-muted)'}}>No materials uploaded yet.</p> : (
              <ul style={{listStyle:'none', padding:0, marginTop:16}}>
                {courseMaterials.map(m => (
                  <li key={m.id} style={{padding: '12px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between'}}>
                    <div>
                      <strong>{m.title}</strong> <span className="badge badge-info">{m.type}</span>
                    </div>
                    <a href={m.file_url.startsWith('http') ? m.file_url : `http://localhost:5000${m.file_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">Open</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div className="card">
          <h3 style={{marginBottom:16}}>All Students</h3>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Department</th><th>Semester</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td style={{fontWeight:600,color:'var(--text-primary)'}}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.department || 'N/A'}</td>
                    <td>{s.semester || 'N/A'}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => viewStudent(s.id)}>
                        <FiEye /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'student' && studentPerf && (
        <div>
          <div className="card" style={{marginBottom:16}}>
            <h3>📊 {studentPerf.student?.name}'s Performance</h3>
            <p style={{color:'var(--text-muted)',fontSize:13}}>{studentPerf.student?.email} · {studentPerf.student?.department} · Sem {studentPerf.student?.semester}</p>
          </div>
          <div className="card">
            <div style={{overflowX:'auto'}}>
              <table className="data-table">
                <thead>
                  <tr><th>Assessment</th><th>Course</th><th>Marks</th><th>Grade</th></tr>
                </thead>
                <tbody>
                  {(studentPerf.performances || []).map(p => (
                    <tr key={p.id}>
                      <td style={{fontWeight:600,color:'var(--text-primary)'}}>{p.assessment?.title}</td>
                      <td>{p.assessment?.course?.name}</td>
                      <td>{p.marks_obtained} / {p.assessment?.max_marks}</td>
                      <td><span className={`badge ${p.grade === 'A+' || p.grade === 'A' ? 'badge-success' : 'badge-warning'}`}>{p.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

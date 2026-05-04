import { useState, useEffect } from 'react';
import { FiUsers, FiBookOpen, FiShield, FiPlus, FiEdit, FiTrash2, FiSettings, FiSave } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState('overview');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', course_code: '', credits: 3, department: '', semester: '', faculty_id: '' });
  const [loading, setLoading] = useState(true);

  // Institution settings
  const [instSettings, setInstSettings] = useState({
    collegeName: 'Vridhi Mitra',
    tagline: 'AI-Powered Student Learning Platform',
    logo: '🌱'
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: d } = await api.get('/admin/dashboard');
        setData(d);
        const { data: u } = await api.get('/admin/users');
        setUsers(u.users || []);
        const { data: c } = await api.get('/admin/courses');
        setCourses(c.courses || []);
      } catch (err) { console.error('Dashboard data fetch error:', err); }

      try {
        const { data: s } = await api.get('/admin/settings');
        if (s.settings) setInstSettings(s.settings);
      } catch (err) { console.error('Settings fetch error:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const toggleUserStatus = async (id, isActive) => {
    try {
      await api.put(`/admin/users/${id}`, { is_active: !isActive });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !isActive } : u));
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (err) { toast.error('Failed to update user'); }
  };

  const createCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/courses', courseForm);
      toast.success('Course created!');
      setShowCourseForm(false);
      setCourseForm({ name: '', course_code: '', credits: 3, department: '', semester: '', faculty_id: '' });
      const { data: c } = await api.get('/admin/courses');
      setCourses(c.courses || []);
    } catch (err) { toast.error('Failed to create course'); }
  };

  const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;
  const faculty = users.filter(u => u.role === 'faculty');

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const { data } = await api.put('/admin/settings', instSettings);
      setInstSettings(data.settings);
      toast.success('Institution settings saved! Refresh to see changes across the app.');
    } catch (err) { toast.error('Failed to save settings'); }
    finally { setSettingsSaving(false); }
  };

  if (loading) return <div className="skeleton" style={{height: 400, borderRadius: 16}} />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🛡️ Admin Panel</h1>
        <p>Manage users, courses, and system settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(138, 43, 226, 0.15)',color:'var(--primary)'}}><FiUsers /></div>
          <div className="stat-value">{data?.totalStudents || 0}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(217, 70, 239, 0.15)',color:'var(--accent)'}}><FiShield /></div>
          <div className="stat-value">{data?.totalFaculty || 0}</div>
          <div className="stat-label">Faculty</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(138, 43, 226, 0.15)',color:'var(--primary)'}}><FiBookOpen /></div>
          <div className="stat-value">{data?.totalCourses || 0}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(217, 70, 239, 0.15)',color:'var(--accent)'}}><FiEdit /></div>
          <div className="stat-value">{data?.totalAssessments || 0}</div>
          <div className="stat-label">Assessments</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,margin:'24px 0 16px', flexWrap:'wrap'}}>
        <button className={`btn ${tab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('users')}>Users</button>
        <button className={`btn ${tab === 'courses' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('courses')}>Courses</button>
        <button className={`btn ${tab === 'settings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('settings')}><FiSettings style={{marginRight:4}} /> Institution Settings</button>
      </div>

      {tab === 'overview' && (
        <div className="card">
          <h3 style={{marginBottom:16}}>Recent Registrations</h3>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.recentUsers || []).map(u => (
                  <tr key={u.id}>
                    <td style={{fontWeight:600,color:'var(--text-primary)'}}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'faculty' ? 'warning' : 'primary'}`}>{u.role}</span></td>
                    <td>{u.created_at || u.createdAt ? new Date(u.created_at || u.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <h3>Manage Users</h3>
            <div style={{display:'flex',gap:6}}>
              {['', 'student', 'faculty', 'admin'].map(r => (
                <button key={r} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter(r)}>
                  {r || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Dept</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{fontWeight:600,color:'var(--text-primary)'}}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'faculty' ? 'warning' : 'primary'}`}>{u.role}</span></td>
                    <td>{u.department || '-'}</td>
                    <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleUserStatus(u.id, u.is_active)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'courses' && (
        <div>
          <div style={{marginBottom:16}}>
            <button className="btn btn-primary" onClick={() => setShowCourseForm(!showCourseForm)}>
              <FiPlus /> Add Course
            </button>
          </div>

          {showCourseForm && (
            <div className="card" style={{marginBottom:16}}>
              <h3 style={{marginBottom:16}}>New Course</h3>
              <form onSubmit={createCourse}>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Course Name</label>
                    <input className="form-input" value={courseForm.name} onChange={(e) => setCourseForm(p => ({...p, name: e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course Code</label>
                    <input className="form-input" value={courseForm.course_code} onChange={(e) => setCourseForm(p => ({...p, course_code: e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits</label>
                    <input className="form-input" type="number" value={courseForm.credits} onChange={(e) => setCourseForm(p => ({...p, credits: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Faculty</label>
                    <select className="form-input" value={courseForm.faculty_id} onChange={(e) => setCourseForm(p => ({...p, faculty_id: e.target.value}))}>
                      <option value="">Select Faculty</option>
                      {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button type="submit" className="btn btn-primary">Create</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCourseForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-2">
            {courses.map(c => (
              <div key={c.id} className="card">
                <h3 style={{fontSize:15,fontWeight:700}}>{c.name}</h3>
                <p style={{fontSize:13,color:'var(--text-muted)',margin:'4px 0 12px'}}>{c.course_code} · {c.credits} credits</p>
                <div style={{display:'flex',gap:8}}>
                  <span className="badge badge-info">{c.enrollments?.length || 0} students</span>
                  {c.faculty && <span className="badge" style={{background: 'rgba(138, 43, 226, 0.15)', color: 'var(--primary)', border: '1px solid rgba(138, 43, 226, 0.3)'}}>👨‍🏫 {c.faculty.name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && instSettings && (
        <div>
          <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--primary)'}}>
            <h3 style={{marginBottom:8}}>🏛️ Institution Branding</h3>
            <p style={{color:'var(--text-muted)', fontSize:13, marginBottom:24}}>Customize this platform for your college. These settings will appear on the login page, sidebar, and across the entire application.</p>

            <div className="grid grid-2" style={{gap:16}}>
              <div className="form-group">
                <label className="form-label">College / Institution Name</label>
                <input className="form-input" value={instSettings.collegeName || ''}
                  placeholder="e.g. St. Joseph's College of Engineering"
                  onChange={e => setInstSettings(p => ({...p, collegeName: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tagline</label>
                <input className="form-input" value={instSettings.tagline || ''}
                  placeholder="e.g. Empowering Students with AI"
                  onChange={e => setInstSettings(p => ({...p, tagline: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Logo Emoji / Symbol</label>
                <input className="form-input" value={instSettings.logo || ''}
                  placeholder="e.g. 🎓 or 🏛️"
                  onChange={e => setInstSettings(p => ({...p, logo: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Institution Website</label>
                <input className="form-input" type="url" value={instSettings.website || ''}
                  placeholder="https://www.yourcollege.edu"
                  onChange={e => setInstSettings(p => ({...p, website: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input className="form-input" type="email" value={instSettings.email || ''}
                  placeholder="admin@yourcollege.edu"
                  onChange={e => setInstSettings(p => ({...p, email: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input className="form-input" value={instSettings.phone || ''}
                  placeholder="+91 XXXXXXXXXX"
                  onChange={e => setInstSettings(p => ({...p, phone: e.target.value}))} />
              </div>
              <div className="form-group" style={{gridColumn:'1 / -1'}}>
                <label className="form-label">Address</label>
                <input className="form-input" value={instSettings.address || ''}
                  placeholder="123 College Road, City, State - PIN"
                  onChange={e => setInstSettings(p => ({...p, address: e.target.value}))} />
              </div>
            </div>

            <div style={{marginTop:20, display:'flex', gap:12, alignItems:'center'}}>
              <button className="btn btn-primary" onClick={handleSaveSettings} disabled={settingsSaving}>
                <FiSave style={{marginRight:6}} />
                {settingsSaving ? 'Saving...' : 'Save Institution Settings'}
              </button>
              <span style={{fontSize:12, color:'var(--text-muted)'}}>Changes will reflect across the entire platform</span>
            </div>
          </div>

          {/* Preview */}
          <div className="card" style={{border:'1px solid var(--border)'}}>
            <h3 style={{marginBottom:16}}>👁️ Live Preview</h3>
            <div style={{display:'flex', alignItems:'center', gap:16, padding:20, background:'var(--bg-secondary)', borderRadius:12}}>
              <div style={{fontSize:48}}>{instSettings.logo || '🌱'}</div>
              <div>
                <h2 style={{fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0}}>{instSettings.collegeName || 'Your College Name'}</h2>
                <p style={{fontSize:14, color:'var(--text-muted)', margin:'4px 0 0'}}>{instSettings.tagline || 'Your tagline here'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

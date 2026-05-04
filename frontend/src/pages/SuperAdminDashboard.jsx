import { useState, useEffect } from 'react';
import { 
  FiPlus, FiGrid, FiUsers, FiCheck, FiX, FiActivity, 
  FiSearch, FiBookOpen, FiAward, FiGlobe, FiShield,
  FiToggleLeft, FiToggleRight, FiMail, FiUser, FiLock
} from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './SuperAdmin.css';

export default function SuperAdminDashboard() {
  const [colleges, setColleges] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    name: '', slug: '', tagline: '', logo: '🏛️', email: '', website: '',
    admin_name: '', admin_email: '', admin_password: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/super-admin/colleges'),
        api.get('/super-admin/stats')
      ]);
      setColleges(cRes.data.colleges || []);
      setStats(sRes.data);
    } catch (err) {
      toast.error('Failed to load platform data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlugify = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (val) => {
    setForm({ ...form, name: val, slug: handleSlugify(val) });
  };

  const createCollege = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      toast.error('College name and slug are required.');
      return;
    }
    try {
      const { data } = await api.post('/super-admin/colleges', form);
      toast.success(data.message);
      setShowForm(false);
      setForm({ name: '', slug: '', tagline: '', logo: '🏛️', email: '', website: '', admin_name: '', admin_email: '', admin_password: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add college.');
    }
  };

  const toggleCollege = async (id) => {
    try {
      const { data } = await api.put(`/super-admin/colleges/${id}/toggle`);
      toast.success(data.message);
      fetchData();
    } catch (err) {
      toast.error('Failed to update college status.');
    }
  };

  const filtered = colleges.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="sa-loading">
        <div className="sa-loading-spinner"></div>
        <p>Initializing Global Control Panel...</p>
      </div>
    );
  }

  return (
    <div className="sa-page">
      {/* Hero Header */}
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-header-badge"><FiShield /></div>
          <div>
            <h1>Global Control Panel</h1>
            <p>Manage all institutions on the Vridhi Mitra platform</p>
          </div>
        </div>
        <button className="sa-add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Add Institution</>}
        </button>
      </header>

      {/* Stats Grid */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card sa-stat-purple">
          <div className="sa-stat-icon"><FiGrid /></div>
          <div className="sa-stat-value">{stats.totalColleges || 0}</div>
          <div className="sa-stat-label">Colleges</div>
          <div className="sa-stat-sub">{stats.activeColleges || 0} active</div>
        </div>
        <div className="sa-stat-card sa-stat-cyan">
          <div className="sa-stat-icon"><FiUsers /></div>
          <div className="sa-stat-value">{stats.totalUsers || 0}</div>
          <div className="sa-stat-label">Total Users</div>
          <div className="sa-stat-sub">{stats.totalStudents || 0} students</div>
        </div>
        <div className="sa-stat-card sa-stat-green">
          <div className="sa-stat-icon"><FiBookOpen /></div>
          <div className="sa-stat-value">{stats.totalCourses || 0}</div>
          <div className="sa-stat-label">Courses</div>
          <div className="sa-stat-sub">across all colleges</div>
        </div>
        <div className="sa-stat-card sa-stat-purple">
          <div className="sa-stat-icon"><FiAward /></div>
          <div className="sa-stat-value">{stats.totalAssessments || 0}</div>
          <div className="sa-stat-label">Assessments</div>
          <div className="sa-stat-sub">{stats.totalFaculty || 0} faculty</div>
        </div>
      </div>

      {/* Add College Form */}
      {showForm && (
        <div className="sa-form-card animate-slide-up">
          <div className="sa-form-header">
            <h2><FiGlobe /> Register New Institution</h2>
            <p>Add a college to the Vridhi Mitra platform. Optionally create an admin account.</p>
          </div>
          <form onSubmit={createCollege}>
            <div className="sa-form-section">
              <h3>Institution Details</h3>
              <div className="sa-form-grid">
                <div className="sa-form-group sa-form-wide">
                  <label>College Name <span className="required">*</span></label>
                  <input value={form.name} onChange={e => handleNameChange(e.target.value)} 
                    placeholder="e.g. St. Joseph's Engineering College" required />
                </div>
                <div className="sa-form-group">
                  <label>Unique Slug <span className="required">*</span></label>
                  <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} 
                    placeholder="auto-generated" required />
                </div>
                <div className="sa-form-group">
                  <label>Logo Emoji</label>
                  <input value={form.logo} onChange={e => setForm({...form, logo: e.target.value})} />
                </div>
                <div className="sa-form-group sa-form-wide">
                  <label>Tagline</label>
                  <input value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} 
                    placeholder="e.g. Excellence in Education Since 1990" />
                </div>
                <div className="sa-form-group">
                  <label>Contact Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                    placeholder="admin@college.edu" />
                </div>
                <div className="sa-form-group">
                  <label>Website</label>
                  <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} 
                    placeholder="https://college.edu" />
                </div>
              </div>
            </div>

            <div className="sa-form-section">
              <h3><FiUser /> College Admin Account <span className="sa-optional">(Optional)</span></h3>
              <p className="sa-form-hint">Create an admin login for this college so they can manage their own data.</p>
              <div className="sa-form-grid">
                <div className="sa-form-group">
                  <label><FiUser size={14} /> Admin Name</label>
                  <input value={form.admin_name} onChange={e => setForm({...form, admin_name: e.target.value})} 
                    placeholder="College Administrator" />
                </div>
                <div className="sa-form-group">
                  <label><FiMail size={14} /> Admin Email</label>
                  <input type="email" value={form.admin_email} onChange={e => setForm({...form, admin_email: e.target.value})} 
                    placeholder="admin@college.edu" />
                </div>
                <div className="sa-form-group">
                  <label><FiLock size={14} /> Admin Password</label>
                  <input type="password" value={form.admin_password} onChange={e => setForm({...form, admin_password: e.target.value})} 
                    placeholder="Min 6 characters" />
                </div>
              </div>
            </div>

            <div className="sa-form-actions">
              <button type="submit" className="sa-btn-create"><FiCheck /> Create Institution</button>
              <button type="button" className="sa-btn-cancel" onClick={() => setShowForm(false)}><FiX /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Colleges Table */}
      <div className="sa-table-card">
        <div className="sa-table-header">
          <h2><FiGrid /> Registered Institutions ({filtered.length})</h2>
          <div className="sa-search">
            <FiSearch />
            <input placeholder="Search colleges..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="sa-empty">
            <FiGlobe size={48} />
            <h3>No institutions found</h3>
            <p>Click "Add Institution" to register the first college on the platform.</p>
          </div>
        ) : (
          <div className="sa-college-grid">
            {filtered.map(c => {
              const studentCount = c.users?.filter(u => u.role === 'student').length || 0;
              const facultyCount = c.users?.filter(u => u.role === 'faculty').length || 0;
              const adminCount = c.users?.filter(u => u.role === 'admin').length || 0;
              const courseCount = c.courses?.length || 0;

              return (
                <div key={c.id} className={`sa-college-card ${!c.is_active ? 'sa-suspended' : ''}`}>
                  <div className="sa-college-top">
                    <div className="sa-college-logo">{c.logo || '🏛️'}</div>
                    <div className="sa-college-info">
                      <h3>{c.name}</h3>
                      <span className="sa-college-slug">/{c.slug}</span>
                      {c.tagline && <p className="sa-college-tagline">{c.tagline}</p>}
                    </div>
                    <div className={`sa-status-badge ${c.is_active ? 'sa-active' : 'sa-inactive'}`}>
                      {c.is_active ? 'Active' : 'Suspended'}
                    </div>
                  </div>

                  <div className="sa-college-stats">
                    <div className="sa-mini-stat">
                      <span className="sa-mini-val">{studentCount}</span>
                      <span className="sa-mini-label">Students</span>
                    </div>
                    <div className="sa-mini-stat">
                      <span className="sa-mini-val">{facultyCount}</span>
                      <span className="sa-mini-label">Faculty</span>
                    </div>
                    <div className="sa-mini-stat">
                      <span className="sa-mini-val">{adminCount}</span>
                      <span className="sa-mini-label">Admins</span>
                    </div>
                    <div className="sa-mini-stat">
                      <span className="sa-mini-val">{courseCount}</span>
                      <span className="sa-mini-label">Courses</span>
                    </div>
                  </div>

                  <div className="sa-college-footer">
                    {c.email && <span className="sa-college-email"><FiMail size={12} /> {c.email}</span>}
                    <button 
                      className={`sa-toggle-btn ${c.is_active ? 'sa-toggle-off' : 'sa-toggle-on'}`}
                      onClick={() => toggleCollege(c.id)}
                    >
                      {c.is_active ? <><FiToggleRight /> Suspend</> : <><FiToggleLeft /> Activate</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

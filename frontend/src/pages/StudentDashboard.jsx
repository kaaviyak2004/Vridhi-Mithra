import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { FiBookOpen, FiAward, FiTrendingUp, FiClock, FiTarget, FiZap, FiChevronRight } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/student/dashboard');
        setData(res);
        const { data: matRes } = await api.get('/student/materials');
        setMaterials(matRes.materials || []);
        const { data: assRes } = await api.get('/student/assessments');
        setPendingAssessments(assRes.pending || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="grid grid-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{height: 140, borderRadius: 16}} />)}
        </div>
        <div className="grid grid-2" style={{marginTop: 24}}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{height: 300, borderRadius: 16}} />)}
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const courseStats = data?.courseStats || [];
  const weakAreas = data?.weakAreas || [];
  const learningPaths = data?.learningPaths || [];
  const achievements = data?.achievements || [];
  const recentPerformance = data?.recentPerformance || [];

  const COLORS = ['var(--primary)', 'var(--accent)', 'var(--primary-light)', 'var(--accent-light)', 'var(--primary-dark)', 'var(--accent-dark)'];

  const pieData = courseStats.map((c, i) => ({ name: c.course, value: parseFloat(c.percentage) }));

  const gradeToNum = (g) => {
    const map = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 2 };
    return map[g] || 0;
  };
  const trendData = recentPerformance.slice().reverse().map((p, i) => ({
    name: p.assessment?.substring(0, 15) || `Test ${i+1}`,
    percentage: p.marks && p.maxMarks ? ((p.marks / p.maxMarks) * 100).toFixed(0) : 0,
  }));

  return (
    <div className="dashboard animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="header-greeting">
          <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>Here's your academic overview and personalized insights</p>
        </div>
        <Link to="/student/pragati" className="btn btn-accent">
          <FiZap /> Ask Pragati AI
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4 stats-grid">
        <div className="stat-card" style={{animationDelay: '0.1s'}}>
          <div className="stat-icon" style={{background: 'rgba(138, 43, 226, 0.15)', color: 'var(--primary)'}}>
            <FiBookOpen />
          </div>
          <div className="stat-value">{overview.totalCourses || 0}</div>
          <div className="stat-label">Enrolled Courses</div>
        </div>
        <div className="stat-card" style={{animationDelay: '0.2s'}}>
          <div className="stat-icon" style={{background: 'rgba(217, 70, 239, 0.15)', color: 'var(--accent)'}}>
            <FiTrendingUp />
          </div>
          <div className="stat-value">{overview.overallPercentage || 0}%</div>
          <div className="stat-label">Overall Score</div>
        </div>
        <div className="stat-card" style={{animationDelay: '0.3s'}}>
          <div className="stat-icon" style={{background: 'rgba(138, 43, 226, 0.15)', color: 'var(--primary)'}}>
            <FiClock />
          </div>
          <div className="stat-value">{overview.attendancePercentage || 0}%</div>
          <div className="stat-label">Attendance</div>
        </div>
        <div className="stat-card" style={{animationDelay: '0.4s'}}>
          <div className="stat-icon" style={{background: 'rgba(217, 70, 239, 0.15)', color: 'var(--accent)'}}>
            <FiAward />
          </div>
          <div className="stat-value">{overview.totalAchievements || 0}</div>
          <div className="stat-label">Achievements</div>
        </div>
      </div>

      {/* Weak Areas Alert */}
      {weakAreas.length > 0 && (
        <div className="weak-areas-alert animate-slide-up">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>Areas Needing Attention</h3>
            <p>You're scoring below 60% in: <strong>{weakAreas.map(w => w.course).join(', ')}</strong></p>
          </div>
          <Link to="/student/learning" className="btn btn-sm btn-primary">
            Get AI Help <FiChevronRight />
          </Link>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-2" style={{marginTop: 24}}>
        {/* Performance Bar Chart */}
        <div className="chart-container animate-slide-up" style={{animationDelay: '0.2s'}}>
          <h3>📊 Course-wise Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={courseStats} margin={{top: 5, right: 20, left: 0, bottom: 60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="course" tick={{fill: 'var(--text-secondary)', fontSize: 11}} angle={-30} textAnchor="end" />
              <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 12}} domain={[0, 100]} />
              <Tooltip cursor={{fill: 'var(--border-light)'}} contentStyle={{background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)'}} />
              <Bar dataKey="percentage" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-container animate-slide-up" style={{animationDelay: '0.3s'}}>
          <h3>🎯 Score Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {pieData.map((entry, i) => (
              <div key={i} className="legend-item">
                <span className="legend-dot" style={{background: COLORS[i % COLORS.length]}} />
                <span className="legend-label">{entry.name}</span>
                <span className="legend-value">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Line & Learning Paths */}
      <div className="grid grid-2" style={{marginTop: 24}}>
        {/* Trend Chart */}
        <div className="chart-container animate-slide-up" style={{animationDelay: '0.4s'}}>
          <h3>📈 Performance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="name" tick={{fill: 'var(--text-secondary)', fontSize: 10}} />
              <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 12}} domain={[0, 100]} />
              <Tooltip contentStyle={{background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)'}} />
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="percentage" stroke="var(--primary)" fill="url(#areaGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Learning Paths */}
        <div className="card animate-slide-up" style={{animationDelay: '0.5s'}}>
          <div className="card-header-row">
            <h3>🤖 AI Recommended Learning</h3>
            <Link to="/student/learning" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {learningPaths.length === 0 ? (
            <div className="empty-state" style={{padding: '30px 0'}}>
              <p>No learning paths yet. Ask Pragati AI to analyze your performance!</p>
            </div>
          ) : (
            <div className="learning-paths-list">
              {learningPaths.slice(0, 4).map((lp) => (
                <div key={lp.id} className="learning-path-item">
                  <div className="lp-info">
                    <h4>{lp.title}</h4>
                    <span className={`badge badge-${lp.priority === 'critical' ? 'danger' : lp.priority === 'high' ? 'warning' : 'info'}`}>
                      {lp.priority}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{width: `${lp.progress_percent}%`}} />
                  </div>
                  <span className="lp-progress-text">{lp.progress_percent}% complete</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card animate-slide-up" style={{marginTop: 24}}>
          <h3>🏅 Recent Achievements</h3>
          <div className="achievements-grid">
            {achievements.map((a) => (
              <div key={a.id} className="achievement-card">
                <div className="achievement-icon">{a.badge_icon}</div>
                <div className="achievement-info">
                  <h4>{a.title}</h4>
                  <p>{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Materials */}
      <div className="card animate-slide-up" style={{marginTop: 24}}>
        <div className="card-header-row">
          <h3>📚 Digital Content Materials (DCM)</h3>
        </div>
        {materials.length === 0 ? (
          <div className="empty-state" style={{padding: '30px 0'}}>
            <p>No study materials uploaded by your faculty yet.</p>
          </div>
        ) : (
          <div className="materials-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, marginTop:16}}>
            {materials.map(m => (
              <div key={m.id} className="card" style={{border:'1px solid rgba(255,255,255,0.1)', background:'var(--surface-light)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div>
                    <h4 style={{marginBottom:4}}>{m.title}</h4>
                    <span className="badge badge-info">{m.course?.course_code} - {m.type}</span>
                  </div>
                </div>
                <div style={{marginTop: 16}}>
                  <a href={m.file_url.startsWith('http') ? m.file_url : `http://localhost:5000${m.file_url}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                    Access Material
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Assessments */}
      <div className="card animate-slide-up" style={{marginTop: 24, border: '1px solid var(--warning)'}}>
        <div className="card-header-row">
          <h3>📝 Pending Assessments & Quizzes</h3>
        </div>
        {pendingAssessments.length === 0 ? (
          <div className="empty-state" style={{padding: '30px 0'}}>
            <p>You have no pending assessments. Great job!</p>
          </div>
        ) : (
          <div className="materials-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, marginTop:16}}>
            {pendingAssessments.map(a => (
              <div key={a.id} className="card" style={{border:'1px solid rgba(255,255,255,0.1)', background:'var(--surface-light)'}}>
                <div>
                  <h4 style={{marginBottom:4}}>{a.title}</h4>
                  <span className="badge badge-warning">{a.course?.course_code} - {a.type}</span>
                  <p style={{fontSize: 12, marginTop: 8, color:'var(--text-muted)'}}>Max Marks: {a.max_marks}</p>
                </div>
                <div style={{marginTop: 16}}>
                  {a.type === 'quiz' && (
                    <button className="btn btn-sm btn-success" onClick={async () => {
                      try {
                        const { data } = await api.get(`/student/assessments/${a.id}`);
                        setActiveQuiz(data.assessment);
                        setQuizAnswers({});
                      } catch (err) {
                        console.error('Failed to load quiz details', err);
                        // Fallback to the assessment data we have if API fails
                        setActiveQuiz(a);
                        setQuizAnswers({});
                      }
                    }}>Take Quiz</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Take Quiz Modal */}
      {activeQuiz && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center', padding: 24, backdropFilter: 'blur(8px)'}}>
          <div className="card" style={{width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--primary)'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 24, borderBottom: '1px solid var(--border-light)', paddingBottom: 16}}>
              <h2 style={{color: 'var(--text-primary)'}}>{activeQuiz.title}</h2>
              <button className="btn btn-sm btn-secondary" onClick={() => setActiveQuiz(null)}>Close</button>
            </div>
            
            <div style={{marginBottom: 24}}>
              {activeQuiz.questions && activeQuiz.questions.length > 0 ? activeQuiz.questions.map((q, i) => (
                <div key={i} style={{marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-light)'}}>
                  <p style={{fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)'}}>{i + 1}. {q.question}</p>
                  <div style={{display:'flex', flexDirection:'column', gap: 12}}>
                    {q.options && q.options.map((opt, optIdx) => (
                      <label key={optIdx} className={`quiz-option-label ${quizAnswers[i] === optIdx ? 'selected' : ''}`} style={{
                        display:'flex', 
                        alignItems:'center', 
                        gap: 12, 
                        cursor:'pointer', 
                        color: 'var(--text-secondary)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: quizAnswers[i] === optIdx ? 'var(--primary-glow)' : 'transparent',
                        border: '1px solid',
                        borderColor: quizAnswers[i] === optIdx ? 'var(--primary)' : 'var(--border-light)',
                        transition: 'all 0.2s ease'
                      }}>
                        <input type="radio" name={`question-${i}`} checked={quizAnswers[i] === optIdx} onChange={() => setQuizAnswers({...quizAnswers, [i]: optIdx})} style={{accentColor: 'var(--primary)', width: '18px', height: '18px'}} />
                        <span style={{fontSize: 15}}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <p>No questions have been added to this quiz yet.</p>
                </div>
              )}
            </div>
            
            <button className="btn btn-success" style={{width:'100%'}} onClick={async () => {
              try {
                const { data: res } = await api.post(`/student/assessments/${activeQuiz.id}/submit`, { answers: quizAnswers });
                alert(`Quiz submitted! You scored ${res.performance.percentage}% (Grade: ${res.performance.grade})`);
                setActiveQuiz(null);
                setPendingAssessments(prev => prev.filter(a => a.id !== activeQuiz.id));
              } catch (err) {
                alert('Failed to submit quiz.');
              }
            }}>Submit Quiz</button>
          </div>
        </div>
      )}
    </div>
  );
}

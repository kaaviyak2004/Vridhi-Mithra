import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

export default function Performance() {
  const [data, setData] = useState({ performances: [] });
  const [attendance, setAttendance] = useState({ records: [], byCourse: {} });
  const [tab, setTab] = useState('marks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perfRes, attRes] = await Promise.all([
          api.get('/student/performance'),
          api.get('/student/attendance')
        ]);
        setData(perfRes.data);
        setAttendance(attRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="skeleton" style={{height: 500, borderRadius: 16}} />;

  const performances = data.performances || [];

  // Group by course for charts
  const courseData = {};
  performances.forEach(p => {
    const course = p.assessment?.course?.name || 'Unknown';
    if (!courseData[course]) courseData[course] = { marks: 0, max: 0, count: 0 };
    courseData[course].marks += p.marks_obtained;
    courseData[course].max += p.assessment?.max_marks || 100;
    courseData[course].count++;
  });
  const chartData = Object.entries(courseData).map(([name, d]) => ({
    name: name.length > 20 ? name.substring(0, 20) + '...' : name,
    percentage: ((d.marks / d.max) * 100).toFixed(1)
  }));

  const attData = Object.entries(attendance.byCourse || {}).map(([name, d]) => ({
    name: name.length > 20 ? name.substring(0, 20) + '...' : name,
    present: d.present, absent: d.absent, late: d.late || 0
  }));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>📊 Performance Analytics</h1>
        <p>Detailed view of your marks, grades, and attendance</p>
      </div>

      {/* Tab buttons */}
      <div style={{display:'flex',gap:8,marginBottom:24}}>
        <button className={`btn ${tab === 'marks' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('marks')}>
          📝 Marks & Grades
        </button>
        <button className={`btn ${tab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('attendance')}>
          📅 Attendance
        </button>
      </div>

      {tab === 'marks' && (
        <>
          {/* Chart */}
          <div className="chart-container" style={{marginBottom:24}}>
            <h3>Course-wise Average Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{top:5,right:20,left:0,bottom:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{fill:'#a7a9be',fontSize:11}} angle={-25} textAnchor="end" />
                <YAxis tick={{fill:'#a7a9be'}} domain={[0,100]} />
                <Tooltip cursor={{fill: 'var(--border-light)'}} contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)'}} />
                <Bar dataKey="percentage" fill="url(#perfGrad)" radius={[6,6,0,0]} />
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="card">
            <h3 style={{marginBottom:16}}>All Assessment Results</h3>
            <div style={{overflowX:'auto'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Marks</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map(p => (
                    <tr key={p.id}>
                      <td style={{fontWeight:600,color:'var(--text-primary)'}}>{p.assessment?.title || 'N/A'}</td>
                      <td>{p.assessment?.course?.name || 'N/A'}</td>
                      <td><span className="badge badge-primary">{p.assessment?.type}</span></td>
                      <td>{p.marks_obtained} / {p.assessment?.max_marks}</td>
                      <td>
                        <span style={{color: p.percentage >= 60 ? 'var(--success)' : p.percentage >= 40 ? 'var(--warning)' : 'var(--danger)', fontWeight:600}}>
                          {p.percentage?.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.grade === 'A+' || p.grade === 'A' ? 'badge-success' : p.grade === 'B+' || p.grade === 'B' ? 'badge-warning' : 'badge-danger'}`}>
                          {p.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {performances.length === 0 && (
              <div className="empty-state"><div className="empty-icon">📋</div><h3>No results yet</h3></div>
            )}
          </div>
        </>
      )}

      {tab === 'attendance' && (
        <>
          <div className="chart-container" style={{marginBottom:24}}>
            <h3>Attendance by Course</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attData} margin={{top:5,right:20,left:0,bottom:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{fill:'var(--text-secondary)',fontSize:11}} angle={-25} textAnchor="end" />
                <YAxis tick={{fill:'var(--text-secondary)'}} />
                <Tooltip cursor={{fill: 'var(--border-light)'}} contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)'}} />
                <Bar dataKey="present" fill="var(--primary)" radius={[4,4,0,0]} name="Present" />
                <Bar dataKey="absent" fill="var(--danger)" radius={[4,4,0,0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-3">
            {Object.entries(attendance.byCourse || {}).map(([name, d]) => {
              const pct = d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : 0;
              return (
                <div key={name} className="card">
                  <h4 style={{fontSize:14,fontWeight:700,marginBottom:12}}>{name}</h4>
                  <div className="progress-bar" style={{height:10,marginBottom:8}}>
                    <div className="progress-bar-fill" style={{width:`${pct}%`, background: pct >= 75 ? 'linear-gradient(90deg, var(--primary), var(--primary-light))' : 'linear-gradient(90deg, var(--danger), var(--warning))'}} />
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-secondary)'}}>
                    <span>{pct}% attendance</span>
                    <span>{d.present}/{d.total} classes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { FiTarget, FiClock, FiCheckCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function LearningPaths() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchPaths = async () => {
    try {
      const { data } = await api.get('/student/learning-paths');
      setPaths(data.learningPaths || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPaths(); }, []);

  const updatePath = async (id, updates) => {
    try {
      await api.put(`/student/learning-paths/${id}`, updates);
      setPaths(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('Progress updated!');
    } catch (err) { toast.error('Update failed'); }
  };

  const generatePaths = async () => {
    setAnalyzing(true);
    try {
      await api.post('/ai/analyze');
      toast.success('New learning paths generated!');
      fetchPaths();
    } catch (err) { toast.error('Analysis failed'); }
    finally { setAnalyzing(false); }
  };

  const priorityColors = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--success)' };
  const statusIcons = { pending: <FiClock />, 'in-progress': <FiRefreshCw />, completed: <FiCheckCircle /> };

  if (loading) return <div className="dashboard-loading"><div className="skeleton" style={{height: 400, borderRadius: 16}} /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div>
          <h1>🎯 Learning Paths</h1>
          <p>AI-generated personalized study plans to improve your weak areas</p>
        </div>
        <button className="btn btn-primary" onClick={generatePaths} disabled={analyzing}>
          {analyzing ? '🔍 Analyzing...' : '🤖 Generate AI Paths'}
        </button>
      </div>

      {paths.length === 0 ? (
        <div className="card" style={{marginTop: 24}}>
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Learning Paths Yet</h3>
            <p>Click "Generate AI Paths" to analyze your performance and get personalized recommendations!</p>
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16,marginTop:24}}>
          {paths.map((path) => (
            <div key={path.id} className="card" style={{position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,width:'100%',height:3,background:`linear-gradient(90deg, var(--primary), var(--accent))`}} />
              
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <h3 style={{fontSize:16,fontWeight:700}}>{path.title}</h3>
                    <span className={`badge badge-${path.priority === 'critical' ? 'danger' : path.priority === 'high' ? 'warning' : 'info'}`}>
                      {path.priority}
                    </span>
                    <span className={`badge badge-${path.status === 'completed' ? 'success' : path.status === 'in-progress' ? 'primary' : 'info'}`}>
                      {statusIcons[path.status]} {path.status}
                    </span>
                  </div>
                  <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:8}}>{path.topic}</p>
                  <p style={{fontSize:14,color:'var(--text-secondary)'}}>{path.description}</p>
                  
                  {path.resources && path.resources.length > 0 && (
                    <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
                      {(typeof path.resources === 'string' ? JSON.parse(path.resources) : path.resources).map((r, i) => (
                        <span key={i} style={{padding:'4px 12px',background:'rgba(138, 43, 226, 0.15)',border:'1px solid rgba(138, 43, 226, 0.3)',borderRadius:20,fontSize:12,color:'var(--text-primary)'}}>
                          📎 {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{minWidth:200,textAlign:'right'}}>
                  {path.due_date && (
                    <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>
                      Due: {new Date(path.due_date).toLocaleDateString()}
                    </p>
                  )}
                  <div style={{marginBottom:8}}>
                    <div className="progress-bar" style={{height:10}}>
                      <div className="progress-bar-fill" style={{width:`${path.progress_percent}%`}} />
                    </div>
                    <span style={{fontSize:13,color:'var(--text-secondary)',fontWeight:600}}>{path.progress_percent}%</span>
                  </div>
                  <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                    {path.status !== 'completed' && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => updatePath(path.id, { progress_percent: Math.min(100, path.progress_percent + 25), status: path.progress_percent + 25 >= 100 ? 'completed' : 'in-progress' })}>
                          +25%
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={() => updatePath(path.id, { status: 'completed', progress_percent: 100 })}>
                          ✓ Done
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

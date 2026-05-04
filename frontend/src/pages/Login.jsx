import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [branding, setBranding] = useState({ collegeName: 'Vridhi Mitra', tagline: 'AI Personalized Learning for Rural Students', logo: '🌱' });

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      if (data.settings) setBranding(data.settings);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.user.name}!`);
      const role = data.user.role;
      navigate(
        role === 'super_admin' ? '/super-admin' :
        role === 'admin' ? '/admin' :
        role === 'faculty' ? '/faculty' : '/student'
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">{branding.logo || '🌱'}</div>
          <h1>{branding.collegeName || 'Vridhi Mitra'}</h1>
          <p>{branding.tagline || 'AI Personalized Learning for Rural Students'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue your learning journey</p>

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input id="login-email" type="email" className="form-input" placeholder="Enter your email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input id="login-password" type="password" className="form-input" placeholder="Enter your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="auth-link-text">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>

          <div className="demo-credentials">
            <p><strong>Demo Accounts:</strong></p>
            <span onClick={() => { setEmail('super@vridhimitra.com'); setPassword('superadmin123'); }}>Super Admin</span>
            <span onClick={() => { setEmail('admin@vridhimitra.com'); setPassword('password123'); }}>Admin</span>
            <span onClick={() => { setEmail('priya@vridhimitra.com'); setPassword('password123'); }}>Faculty</span>
            <span onClick={() => { setEmail('aarav@student.com'); setPassword('password123'); }}>Student</span>
          </div>
        </form>
      </div>
    </div>
  );
}

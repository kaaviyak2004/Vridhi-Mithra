import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', semester: '', college_id: '' });
  const [otp, setOtp] = useState('');
  const [colleges, setColleges] = useState([]);
  const { register, verifyOTP, loading } = useAuthStore();
  const navigate = useNavigate();
  const [branding, setBranding] = useState({ collegeName: 'Vridhi Mitra', tagline: 'AI-Powered Student Learning Platform', logo: '🌱' });

  useEffect(() => {
    // Fetch branding for the page
    api.get('/admin/settings').then(({ data }) => {
      if (data.settings) setBranding(data.settings);
    }).catch(() => {});

    // Fetch colleges for selection
    api.get('/auth/colleges').then(({ data }) => {
      setColleges(data.colleges || []);
    }).catch(() => {});
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.college_id) {
      toast.error('Please select your college.');
      return;
    }
    try {
      await register(form);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) { toast.error(err.message); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const data = await verifyOTP(form.email, otp);
      toast.success('Account verified!');
      const role = data.user.role;
      navigate(role === 'super_admin' ? '/super-admin' : role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/student');
    } catch (err) { toast.error(err.message); }
  };

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

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
          <p>{branding.tagline || 'AI-Powered Student Learning Platform'}</p>
        </div>

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleRegister}>
            <h2>Create Account</h2>
            <p className="auth-subtitle">Start your personalized learning journey</p>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input id="reg-name" className="form-input" placeholder="Enter your full name"
                value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input id="reg-email" type="email" className="form-input" placeholder="Enter your email"
                value={form.email} onChange={(e) => updateForm('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" className="form-input" placeholder="Create a strong password"
                value={form.password} onChange={(e) => updateForm('password', e.target.value)} required minLength={6} />
            </div>

            <div className="form-group">
              <label className="form-label">Select Your College</label>
              <select className="form-input" value={form.college_id} onChange={(e) => updateForm('college_id', e.target.value)} required>
                <option value="">-- Select College --</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-role">Role</label>
                <select id="reg-role" className="form-input" value={form.role} onChange={(e) => updateForm('role', e.target.value)}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-dept">Department</label>
                <input id="reg-dept" className="form-input" placeholder="e.g. CSE"
                  value={form.department} onChange={(e) => updateForm('department', e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            <p className="auth-link-text">Already have an account? <Link to="/login">Sign In</Link></p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerify}>
            <h2>Verify Email</h2>
            <p className="auth-subtitle">Enter the 6-digit OTP sent to <strong>{form.email}</strong></p>

            <div className="form-group">
              <label className="form-label" htmlFor="otp-input">Verification Code</label>
              <input id="otp-input" className="form-input otp-input" placeholder="000000"
                value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <p className="auth-link-text">
              <span className="link-action" onClick={() => setStep(1)}>← Go back</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

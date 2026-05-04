import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import api from './utils/api';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PragatiBot from './pages/PragatiBot';
import LearningPaths from './pages/LearningPaths';
import Performance from './pages/Performance';
import Discussions from './pages/Discussions';
import MockInterview from './pages/MockInterview';
import Sidebar from './components/Sidebar';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function DashboardRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'super_admin') return <Navigate to="/super-admin" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'faculty') return <Navigate to="/faculty" />;
  return <Navigate to="/student" />;
}

function AppLayout({ children }) {
  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="page-content">{children}</main>
    </div>
  );
}

function App() {
  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      if (data.settings?.collegeName) {
        document.title = data.settings.collegeName;
      }
    }).catch(() => {});
  }, []);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
        duration: 4000,
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute roles={['student']}><AppLayout><StudentDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/student/performance" element={<ProtectedRoute roles={['student']}><AppLayout><Performance /></AppLayout></ProtectedRoute>} />
        <Route path="/student/learning" element={<ProtectedRoute roles={['student']}><AppLayout><LearningPaths /></AppLayout></ProtectedRoute>} />
        <Route path="/student/pragati" element={<ProtectedRoute roles={['student']}><AppLayout><PragatiBot /></AppLayout></ProtectedRoute>} />
        <Route path="/student/discussions" element={<ProtectedRoute roles={['student']}><AppLayout><Discussions /></AppLayout></ProtectedRoute>} />
        <Route path="/student/interview" element={<ProtectedRoute roles={['student']}><AppLayout><MockInterview /></AppLayout></ProtectedRoute>} />

        <Route path="/faculty" element={<ProtectedRoute roles={['faculty','admin']}><AppLayout><FacultyDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/faculty/pragati" element={<ProtectedRoute roles={['faculty','admin']}><AppLayout><PragatiBot /></AppLayout></ProtectedRoute>} />
        <Route path="/faculty/discussions" element={<ProtectedRoute roles={['faculty','admin']}><AppLayout><Discussions /></AppLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/super-admin" element={<ProtectedRoute roles={['super_admin']}><AppLayout><SuperAdminDashboard /></AppLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

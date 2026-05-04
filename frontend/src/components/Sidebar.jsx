import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { FiHome, FiBarChart2, FiBook, FiMessageCircle, FiUsers, FiSettings, FiLogOut, FiMenu, FiX, FiCpu, FiShield, FiSun, FiMoon, FiMic } from 'react-icons/fi';
import api from '../utils/api';
import './Sidebar.css';

const studentLinks = [
  { path: '/student', icon: <FiHome />, label: 'Dashboard' },
  { path: '/student/performance', icon: <FiBarChart2 />, label: 'Performance' },
  { path: '/student/learning', icon: <FiBook />, label: 'Learning Paths' },
  { path: '/student/pragati', icon: <FiCpu />, label: 'Pragati Bot' },
  { path: '/student/interview', icon: <FiMic />, label: 'Mock Interview' },
  { path: '/student/discussions', icon: <FiMessageCircle />, label: 'Discussions' },
];

const facultyLinks = [
  { path: '/faculty', icon: <FiHome />, label: 'Dashboard' },
  { path: '/faculty/discussions', icon: <FiMessageCircle />, label: 'Discussions' },
  { path: '/faculty/pragati', icon: <FiCpu />, label: 'Pragati Bot' },
];

const adminLinks = [
  { path: '/admin', icon: <FiShield />, label: 'Admin Panel' },
];

const superAdminLinks = [
  { path: '/super-admin', icon: <FiShield />, label: 'Global Admin' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [branding, setBranding] = useState({ collegeName: 'Vridhi Mitra', tagline: 'AI Learning Platform', logo: '🌱' });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user?.college) {
      setBranding({
        collegeName: user.college.name,
        tagline: user.college.tagline,
        logo: user.college.logo
      });
    } else {
      api.get('/admin/settings').then(({ data }) => {
        if (data.settings) setBranding(data.settings);
      }).catch(() => {});
    }
  }, [user]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const links = user?.role === 'super_admin' ? superAdminLinks : user?.role === 'admin' ? adminLinks : user?.role === 'faculty' ? facultyLinks : studentLinks;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile toggle */}
      <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">{branding.logo || '🌱'}</div>
          {!collapsed && (
            <div className="logo-text">
              <h2>{branding.collegeName || 'Vridhi Mitra'}</h2>
              <span>{branding.tagline || 'AI Learning Platform'}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/student' || link.path === '/faculty' || link.path === '/admin'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">{link.icon}</span>
              {!collapsed && <span className="nav-label">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="sidebar-footer">
          <button className="nav-link theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme" style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            <span className="nav-icon">{theme === 'dark' ? <FiSun /> : <FiMoon />}</span>
            {!collapsed && <span className="nav-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {!collapsed && (
            <div className="user-info">
              <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
              <div className="user-details">
                <span className="user-name">{user?.name || 'User'}</span>
                <span className="user-role">{user?.role || 'student'}</span>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '←'}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}

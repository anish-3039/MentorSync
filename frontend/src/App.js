
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from './components/AuthPage';

import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppRoutes() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
  }, [token, role]);

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/login" element={<AuthPage onAuth={(t, r) => { setToken(t); setRole(r); navigate('/dashboard'); }} />} />
      <Route path="/dashboard" element={
        token ? (
          role === 'admin'
            ? <AdminDashboard onLogout={handleLogout} />
            : <Dashboard token={token} role={role} onLogout={handleLogout} />
        ) : <Navigate to="/login" />
      } />
      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;

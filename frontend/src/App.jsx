import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import AdminSidebar from './components/users/admin/AdminSidebars'
import UserSidebar from './components/users/user/UserSidebar'
import api from './api'
import './index.css'

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }
  }, [location]);

  const handleLogout = async () => {
    try {
      await api.post('/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("is_staff");
    localStorage.removeItem("user");
    setUser(null);
    navigate('/');
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage goToLogin={() => navigate('/login')} goToRegister={() => navigate('/register')} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register goToLogin={() => navigate('/login')} goToLanding={() => navigate('/')} />} />
      
      <Route path="/dashboard/*" element={
        user && user.is_staff === false ? <UserSidebar user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
      } />

      <Route path="/admin/*" element={
        user && user.is_staff === true ? <AdminSidebar user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
      } />
    </Routes>
  )
}

export default App

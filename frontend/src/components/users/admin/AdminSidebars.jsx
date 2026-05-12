import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ListFilter, Repeat2, Flag,
  MessageSquare, Settings, LogOut
} from 'lucide-react'
import DashboardPage from './AdminDashboards'
import UsersPage from './AdminUsers'
import SwapsPage from './AdminSwaps'
import ReportsPage from './AdminReports'
import MessagesPage from './AdminMessages'
import SettingsPage from './AdminSettings'
import "./../../styles/AdminDashboard.css"
import Logo from './../../../assets/logo.png'

const mgmtItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users',     label: 'Users',     icon: Users },
  { id: 'swaps',     label: 'Swaps',     icon: Repeat2 },
  { id: 'reports',   label: 'Reports',   icon: Flag,           badge: 3 },
  { id: 'messages',  label: 'Messages',  icon: MessageSquare, badge: 7 },
]

const sysItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  const navigateTo = (id) => {
    navigate(`/admin/${id}`)
    setMobileOpen(false)
  }

  const renderPage = () => {
    return (
      <Routes>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="swaps" element={<SwapsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="settings" element={<SettingsPage isDark={isDark} setIsDark={setIsDark} />} />
        <Route path="*" element={<Navigate to="dashboard" />} />
      </Routes>
    )
  }

  const NavItem = ({ id, label, icon: Icon, badge }) => (
    <div
      className={`sw-nav-item${currentPath === id ? ' active' : ''}`}
      onClick={() => navigateTo(id)}
      title={collapsed ? label : undefined}
    >
      <span className="sw-nav-icon"><Icon size={17} /></span>
      {!collapsed && <span className="sw-nav-text">{label}</span>}
      {!collapsed && badge && <span className="sw-nav-badge">{badge}</span>}
    </div>
  )

  return (
    <div className={`sw-dashboard${isDark ? '' : ' light'}`}>
      <div
        className={`sw-overlay${mobileOpen ? ' show' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <div className="sw-layout">
        {/* SIDEBAR */}
        <aside className={`sw-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
          <div className="sw-sidebar-logo">
            <div className="sw-logo-icon">
                <img 
                    src={Logo}
                    alt="SwapWise Logo" 
                    style={{ width: '24px', height: '24px', objectFit: 'contain', display: 'block'}} 
                />
            </div>
            {!collapsed && (
              <div className="sw-logo-text">
                <h1>SwapWise</h1>
              </div>
            )}
          </div>

          <div className="sw-nav-section">
            {!collapsed && <div className="sw-nav-label">Management</div>}
            {mgmtItems.map(item => <NavItem key={item.id} {...item} />)}
          </div>

          <div className="sw-sidebar-spacer" />

          <div className="sw-nav-section">
            {!collapsed && <div className="sw-nav-label">System</div>}
            {sysItems.map(item => <NavItem key={item.id} {...item} />)}
            <div
              className="sw-nav-item"
              title={collapsed ? 'Logout' : undefined}
              style={{ color: 'var(--sw-red)', cursor: 'pointer' }}
              onClick={onLogout}
            >
              <span className="sw-nav-icon" style={{ color: 'var(--sw-red)' }}><LogOut size={17} /></span>
              {!collapsed && <span className="sw-nav-text" style={{ color: 'var(--sw-red)' }}>Logout</span>}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="sw-main">
          {/* Topbar removed from here */}
          <div className="sw-content">
            <div className="sw-page-content">
              {renderPage()}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { Shield, Bell, User, Monitor, Lock, Globe, Database, Save } from 'lucide-react'

export default function SettingsPage({ isDark, setIsDark }) {
  const [profile, setProfile] = useState({ 
    name: 'Admin User', 
    email: 'admin@swapwise.io', 
    role: 'Super Admin', 
    bio: 'Platform administrator for SwapWise.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  })

  const [notifToggles, setNotifToggles] = useState([
    { label: 'New User Registrations',  desc: 'Get notified when a new user joins the platform',  key: 'newUser',  on: true },
    { label: 'New Reports Filed',        desc: 'Alert when users submit moderation reports',           key: 'reports',  on: true },
    { label: 'Swap Completions',         desc: 'Notify when a swap is marked as completed',            key: 'swaps',    on: false },
    { label: 'Listing Approvals',        desc: 'Alert when listings are submitted for review',        key: 'listings', on: true },
    { label: 'System Alerts',            desc: 'Critical system and security notifications',           key: 'system',   on: true },
  ])

  const [secToggles, setSecToggles] = useState([
    { label: 'Two-Factor Authentication', desc: 'Require 2FA for admin login',               key: '2fa',      on: true },
    { label: 'Session Timeout',           desc: 'Auto-logout after 30 min of inactivity',  key: 'timeout', on: true },
    { label: 'Login Alerts',              desc: 'Send email on new admin login',             key: 'login',    on: false },
    { label: 'API Access',                desc: 'Enable external API access for integrations', key: 'api',      on: false },
  ])

  const [sysToggles, setSysToggles] = useState([
    { label: 'Maintenance Mode',    desc: 'Temporarily take the platform offline',           key: 'maintenance', on: false },
    { label: 'Auto-moderation',     desc: 'Use AI to auto-flag suspicious listings',          key: 'automod',      on: true },
    { label: 'New User Approvals',  desc: 'Require admin approval for new registrations',    key: 'approval',     on: false },
    { label: 'Email Notifications', desc: 'Platform sends automated emails to users',         key: 'emails',       on: true },
    { label: 'Audit Log',           desc: 'Keep a full admin action audit trail',               key: 'audit',        on: true },
  ])

  const toggleItem = (list, setter, key) => {
    setter(list.map(t => t.key === key ? { ...t, on: !t.on } : t))
  }

  const ToggleRow = ({ t, onToggle }) => (
    <div className="sw-settings-row">
      <div className="sw-settings-row-info">
        <h4>{t.label}</h4>
        <p>{t.desc}</p>
      </div>
      <div className={`sw-toggle-switch ${t.on ? 'on' : 'off'}`} onClick={onToggle}>
        <div className="sw-toggle-switch-thumb" />
      </div>
    </div>
  )

  return (
    <>
      <div className="sw-page-header">
        <h1 className="sw-page-title">Settings</h1>
        <p className="sw-page-subtitle">Configure your admin panel, preferences and platform settings</p>
      </div>

      <div className="sw-grid-2" style={{ alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div>
          {/* Admin Profile */}
          <div className="sw-card sw-section">
            <div className="sw-settings-title">
              <User size={13} /> Admin Profile
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              {/* UPDATED TO IMAGE AVATAR */}
              <div className="sw-avatar" style={{ width: 64, height: 64, overflow: 'hidden', position: 'relative' }}>
                <img src={profile.img} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="sw-avatar-online" style={{ border: '2px solid var(--sw-card-bg)', width: 12, height: 12 }} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--sw-text1)', marginBottom: 2 }}>{profile.name}</div>
                <div style={{ fontSize: 12, color: 'var(--sw-blue)', fontWeight: 600 }}>{profile.role}</div>
                <div style={{ fontSize: 12, color: 'var(--sw-text3)' }}>{profile.email}</div>
              </div>
              
              <button className="sw-btn sw-btn-ghost sw-btn-sm">
                Change Photo
              </button>
            </div>

            <div className="sw-form-group">
              <label className="sw-label">Display Name</label>
              <input className="sw-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className="sw-form-group">
              <label className="sw-label">Email Address</label>
              <input className="sw-input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="sw-form-group">
              <label className="sw-label">Bio</label>
              <textarea className="sw-textarea" rows={3} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
            </div>
            <button className="sw-btn sw-btn-primary">
              <Save size={13} /> Save Profile Changes
            </button>
          </div>

          {/* Security */}
          <div className="sw-card sw-section">
            <div className="sw-settings-title">
              <Lock size={13} /> Security & Access
            </div>
            {secToggles.map(t => (
              <ToggleRow key={t.key} t={t} onToggle={() => toggleItem(secToggles, setSecToggles, t.key)} />
            ))}
            <div className="sw-divider" />
            <div className="sw-form-group">
              <label className="sw-label">Password Management</label>
              <input className="sw-input" type="password" placeholder="Current password" style={{ marginBottom: 8 }} />
              <input className="sw-input" type="password" placeholder="New password" style={{ marginBottom: 8 }} />
              <input className="sw-input" type="password" placeholder="Confirm new password" />
            </div>
            <button className="sw-btn sw-btn-primary" style={{ marginTop: 4 }}>
              <Shield size={13} /> Update Password
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Notifications */}
          <div className="sw-card sw-section">
            <div className="sw-settings-title">
              <Bell size={13} /> System Notifications
            </div>
            {notifToggles.map(t => (
              <ToggleRow key={t.key} t={t} onToggle={() => toggleItem(notifToggles, setNotifToggles, t.key)} />
            ))}
          </div>

          {/* System */}
          <div className="sw-card sw-section">
            <div className="sw-settings-title">
              <Database size={13} /> Platform Configuration
            </div>
            {sysToggles.map(t => (
              <ToggleRow key={t.key} t={t} onToggle={() => toggleItem(sysToggles, setSysToggles, t.key)} />
            ))}
            <div className="sw-divider" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="sw-btn sw-btn-ghost sw-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Globe size={12} /> Export Audit Logs
              </button>
              <button className="sw-btn sw-btn-danger sw-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Database size={12} /> Purge Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
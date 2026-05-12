import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Users, Repeat2, Flag, BookOpen,
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Activity, Zap, Clock, Search, Bell
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [liveActivity, setLiveActivity] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [userGrowth, setUserGrowth] = useState({ bars: [], labels: [], raw_data: [] })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const backendUrl = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [statsRes, activityRes, topUsersRes, growthRes, recentRes] = await Promise.all([
          axios.get(`${backendUrl}/api/admin/dashboard-stats/`, { headers }),
          axios.get(`${backendUrl}/api/admin/recent-activities/`, { headers }),
          axios.get(`${backendUrl}/api/accounts/admin/top-users/`, { headers }),
          axios.get(`${backendUrl}/api/accounts/admin/user-growth/`, { headers }),
          axios.get(`${backendUrl}/api/accounts/admin/recent-transactions/`, { headers }),
        ])

        setStats(statsRes.data)
        setLiveActivity(activityRes.data)
        setTopUsers(topUsersRes.data)
        setUserGrowth(growthRes.data)
        setRecentTransactions(recentRes.data)
      } catch (fetchError) {
        console.error('Error fetching admin dashboard data:', fetchError)
        setError('Error loading admin dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/admin/notifications/`, { headers })
        setNotifications(response.data)
      } catch (fetchError) {
        console.error('Error fetching admin notifications:', fetchError)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAllNotificationsRead = async () => {
    try {
      await axios.post(`${backendUrl}/api/admin/notifications/`, {}, { headers })
      setNotifications(prev => prev.map(notification => ({ ...notification, unread: false })))
    } catch (markError) {
      console.error('Error marking notifications as read:', markError)
    }
  }

  const formatChange = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value}%`
  }

  const getChangeElement = (value) => {
    const isUp = value >= 0
    return (
      <div className={`sw-stat-change ${isUp ? 'up' : 'down'}`}>
        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {formatChange(value)}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="sw-loading-screen">
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sw-error-screen">
        <p>{error}</p>
      </div>
    )
  }

  const chartBars = userGrowth.bars.length ? userGrowth.bars : [30, 45, 28, 60, 50, 72, 55, 80, 65, 90, 74, 100]
  const chartLabels = userGrowth.labels.length ? userGrowth.labels : ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']

  return (
    <>
      {/* TOPBAR */}
      <header className="sw-topbar" style={{ marginBottom: '24px', padding: '0' }}>
        <div className="sw-search">
          <Search size={15} className="sw-search-icon" />
          <input type="text" placeholder="Search users, listings, swaps..." />
        </div>

        <div className="sw-topbar-right">
          <div
            className="sw-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <Bell size={16} />
            {notifications.filter((notification) => notification.unread).length > 0 && (
              <div className="sw-notif-badge">
                {notifications.filter((notification) => notification.unread).length}
              </div>
            )}
          </div>

          <div className="sw-admin-profile">
            <div className="sw-avatar">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                alt="Admin"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div className="sw-avatar-online" />
            </div>
            <div className="sw-admin-info">
              <span className="sw-admin-name">Admin User</span>
              <span className="sw-admin-role">Super Admin</span>
            </div>
          </div>
        </div>
      </header>

      {showNotifications && (
        <div className="sw-notification-dropdown">
          <div className="sw-notification-header">
            <h3>Admin notifications</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="sw-btn sw-btn-ghost" onClick={markAllNotificationsRead}>
                Mark all read
              </button>
              <button className="sw-btn sw-btn-ghost" onClick={() => setShowNotifications(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="sw-notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`sw-notification-item ${notification.unread ? 'unread' : ''}`}
                >
                  <div style={{ flex: 1 }}>
                    <div className="sw-notification-message">{notification.message}</div>
                    <div className="sw-notification-time">{notification.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="sw-empty-state">No recent notifications</div>
            )}
          </div>
        </div>
      )}

      {/* WELCOME BANNER */}
      <div className="sw-welcome-banner">
        <div>
          <p className="sw-welcome-title">Welcome back, Admin</p>
          <p className="sw-welcome-sub">{today} · Platform is running smoothly</p>
        </div>
        <div className="sw-welcome-stats">
          <div className="sw-welcome-stat">
            <div className="sw-welcome-stat-value">99.8%</div>
            <div className="sw-welcome-stat-label">Uptime</div>
          </div>
          <div className="sw-welcome-stat">
            <div className="sw-welcome-stat-value">+142</div>
            <div className="sw-welcome-stat-label">New Today</div>
          </div>
          <div className="sw-welcome-stat">
            <div className="sw-welcome-stat-value">4.9★</div>
            <div className="sw-welcome-stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="sw-stats-grid">
        <div className="sw-stat-card">
          <div className="sw-stat-top">
            <div className="sw-stat-icon blue"><Users size={20} /></div>
            {stats ? getChangeElement(stats.total_users_change) : <div className="sw-stat-change up">...</div>}
          </div>
          <div className="sw-stat-value">{stats ? stats.total_users.toLocaleString() : '...'}</div>
          <div className="sw-stat-label">Total Users</div>
        </div>
        <div className="sw-stat-card">
          <div className="sw-stat-top">
            <div className="sw-stat-icon green"><Repeat2 size={20} /></div>
            {stats ? getChangeElement(stats.active_swaps_change) : <div className="sw-stat-change up">...</div>}
          </div>
          <div className="sw-stat-value">{stats ? stats.active_swaps.toLocaleString() : '...'}</div>
          <div className="sw-stat-label">Active Swaps</div>
        </div>
        <div className="sw-stat-card">
          <div className="sw-stat-top">
            <div className="sw-stat-icon red"><Flag size={20} /></div>
            {stats ? getChangeElement(stats.pending_reports_change) : <div className="sw-stat-change down">...</div>}
          </div>
          <div className="sw-stat-value">{stats ? stats.pending_reports.toLocaleString() : '...'}</div>
          <div className="sw-stat-label">Pending Reports</div>
        </div>
        <div className="sw-stat-card">
          <div className="sw-stat-top">
            <div className="sw-stat-icon purple"><BookOpen size={20} /></div>
            {stats ? getChangeElement(stats.skill_listings_change) : <div className="sw-stat-change up">...</div>}
          </div>
          <div className="sw-stat-value">{stats ? stats.skill_listings.toLocaleString() : '...'}</div>
          <div className="sw-stat-label">Skill Listings</div>
        </div>
      </div>

      {/* TWO COLUMN ROW */}
      <div className="sw-grid-2 sw-section">
        <div className="sw-card">
          <div className="sw-card-header">
            <h3 className="sw-card-title">
              <Activity size={16} style={{ color: 'var(--sw-blue)' }} />
              Live Activity
            </h3>
            <span className="sw-card-action">View all</span>
          </div>
          {liveActivity.length > 0 ? (
            liveActivity.map((activity, index) => (
              <div key={index} className="sw-activity-item">
                <div className="sw-activity-dot" style={{ background: activity.color }} />
                <div className="sw-activity-content">
                  <div className="sw-activity-text">{activity.message}</div>
                  <span className="sw-activity-time">
                    <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                    {activity.time}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="sw-empty-state">Loading activity...</div>
          )}
        </div>

        <div className="sw-card">
          <div className="sw-card-header">
            <h3 className="sw-card-title">
              <Zap size={16} style={{ color: 'var(--sw-yellow)' }} />
              Top Active Users
            </h3>
            <span className="sw-card-action">View all</span>
          </div>
          {topUsers.length > 0 ? (
            topUsers.map((u, i) => (
              <div key={i} className="sw-user-row">
                <div className="sw-table-avatar" style={{ overflow: 'hidden' }}>
                  <img src={u.img} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="sw-user-meta">
                  <p className="sw-user-meta-name">{u.name}</p>
                  <span className="sw-user-meta-sub">{u.sub}</span>
                </div>
                <div className="sw-user-rank">{u.rank}</div>
              </div>
            ))
          ) : (
            <div className="sw-empty-state">Loading top users...</div>
          )}
        </div>
      </div>

      {/* GROWTH CHART */}
      <div className="sw-card sw-section">
        <div className="sw-card-header">
          <h3 className="sw-card-title">
            <TrendingUp size={16} style={{ color: 'var(--sw-green)' }} />
            User Growth · Last 12 Months
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="sw-badge blue">2026</span>
            <span className="sw-card-action">Export</span>
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--sw-text3)', marginBottom: 2 }}>New Users</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sw-green)' }}>
              {userGrowth.raw_data.length ? userGrowth.raw_data.reduce((sum, value) => sum + value, 0) : '...'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--sw-text3)', marginBottom: 2 }}>Peak Month</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sw-blue)' }}>
              {userGrowth.labels.length && userGrowth.raw_data.length
                ? userGrowth.labels[userGrowth.raw_data.indexOf(Math.max(...userGrowth.raw_data))] || '—'
                : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--sw-text3)', marginBottom: 2 }}>Avg / Month</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--sw-purple)' }}>
              {userGrowth.raw_data.length ? Math.round(userGrowth.raw_data.reduce((sum, value) => sum + value, 0) / userGrowth.raw_data.length) : '...'}
            </div>
          </div>
        </div>
        <div className="sw-mini-chart" style={{ height: 80 }}>
          {chartBars.map((height, index) => (
            <div
              key={index}
              className={`sw-mini-bar${index === chartBars.length - 1 ? ' highlight' : ''}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {chartLabels.map((label) => (
            <span key={label} style={{ fontSize: 10, color: 'var(--sw-text3)', flex: 1, textAlign: 'center' }}>{label}</span>
          ))}
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="sw-card sw-section">
        <div className="sw-card-header">
          <h3 className="sw-card-title">
            <Repeat2 size={16} style={{ color: 'var(--sw-blue)' }} />
            Recent Transactions
          </h3>
          <span className="sw-card-action">View all swaps</span>
        </div>
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>From</th>
                <th>To</th>
                <th>Skills Exchanged</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 12, color: 'var(--sw-blue)' }}>{t.id}</td>
                    <td className="sw-table-name">{t.from_user}</td>
                    <td className="sw-table-name">{t.to_user}</td>
                    <td>
                      <span style={{ fontSize: 12 }}>{t.skill1}</span>
                      <span style={{ color: 'var(--sw-blue)', margin: '0 6px' }}>↔</span>
                      <span style={{ fontSize: 12 }}>{t.skill2}</span>
                    </td>
                    <td>
                      <span className={`sw-badge ${t.status}`}>
                        <span className="sw-badge-dot" style={{ background: t.status === 'active' ? 'var(--sw-green)' : t.status === 'pending' ? 'var(--sw-yellow)' : 'var(--sw-blue)' }} />
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{t.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--sw-text3)' }}>
                    Loading recent transactions...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

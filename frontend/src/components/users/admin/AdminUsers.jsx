import React, { useState } from 'react'
import { Search, UserPlus, Eye, Edit2, Trash2, Shield, Ban } from 'lucide-react'
import api from '../../../api'

// --- UPDATED DATA WITH MOCK IMAGES ---
const users = [
  { id: 1,  name: 'Alex Chen',      email: 'alex.chen@email.com',    joined: 'Jan 12, 2026', status: 'active',   skills: 12, swaps: 28, img: 'https://i.pravatar.cc/150?u=1', role: 'User' },
  { id: 2,  name: 'Maria Santos',    email: 'maria.s@email.com',      joined: 'Feb 3, 2026',  status: 'active',   skills: 8,  swaps: 19, img: 'https://i.pravatar.cc/150?u=2', role: 'User' },
  { id: 3,  name: 'James Wilson',    email: 'j.wilson@email.com',     joined: 'Nov 28, 2025', status: 'inactive', skills: 5,  swaps: 7,  img: 'https://i.pravatar.cc/150?u=3', role: 'User' },
  { id: 4,  name: 'Priya Patel',     email: 'priya.p@email.com',      joined: 'Dec 15, 2025', status: 'active',   skills: 10, swaps: 34, img: 'https://i.pravatar.cc/150?u=4', role: 'User' },
  { id: 5,  name: 'Lucas Oliveira',  email: 'lucas.o@email.com',      joined: 'Mar 7, 2026',  status: 'active',   skills: 9,  swaps: 22, img: 'https://i.pravatar.cc/150?u=5', role: 'User' },
  { id: 6,  name: 'Sophie Laurent',  email: 'sophie.l@email.com',     joined: 'Apr 1, 2026',  status: 'pending',  skills: 6,  swaps: 4,  img: 'https://i.pravatar.cc/150?u=6', role: 'User' },
  { id: 7,  name: 'Mohammed Ali',    email: 'moh.ali@email.com',      joined: 'Jan 30, 2026', status: 'active',   skills: 7,  swaps: 16, img: 'https://i.pravatar.cc/150?u=7', role: 'User' },
  { id: 8,  name: 'Emma Thompson',   email: 'emma.t@email.com',       joined: 'Oct 12, 2025', status: 'inactive', skills: 4,  swaps: 3,  img: 'https://i.pravatar.cc/150?u=8', role: 'User' },
  { id: 9,  name: 'Raj Sharma',      email: 'raj.sharma@email.com',   joined: 'May 2, 2026',  status: 'active',   skills: 11, swaps: 25, img: 'https://i.pravatar.cc/150?u=9', role: 'User' },
  { id: 10, name: 'Yuki Tanaka',     email: 'yuki.t@email.com',       joined: 'Mar 19, 2026', status: 'banned',   skills: 2,  swaps: 1,  img: 'https://i.pravatar.cc/150?u=10', role: 'User' },
]

const summaryCards = [
  { label: 'Total Users',     value: '12,847', color: 'blue',   sub: '+142 this week' },
  { label: 'Active Users',    value: '9,204',  color: 'green',  sub: '71.6% of total' },
  { label: 'Inactive Users', value: '3,421',  color: 'yellow', sub: '26.6% of total' },
  { label: 'Banned Accounts',value: '222',    color: 'red',    sub: '1.7% of total' },
]

export default function UsersPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [realUsers, setRealUsers] = useState([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users/');
        setRealUsers(response.data);
      } catch (error) {
        console.error("Error fetching admin users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const dataToUse = realUsers.length > 0 ? realUsers : users;

  const filtered = dataToUse.filter(u => {
    const matchStatus = filter === 'all' || u.status === filter
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading users...</div>;

  const totalUsersCount = realUsers.length > 0 ? realUsers.length : '12,847';
  const activeUsersCount = realUsers.length > 0 ? realUsers.filter(u => u.status === 'active').length : '9,204';
  const inactiveUsersCount = realUsers.length > 0 ? realUsers.filter(u => u.status === 'inactive').length : '3,421';
  const bannedUsersCount = realUsers.length > 0 ? realUsers.filter(u => u.status === 'banned').length : '222';

  const updatedSummaryCards = [
    { label: 'Total Users',     value: totalUsersCount, color: 'blue',   sub: '+142 this week' },
    { label: 'Active Users',    value: activeUsersCount,  color: 'green',  sub: 'Active now' },
    { label: 'Inactive Users', value: inactiveUsersCount,  color: 'yellow', sub: 'Need engagement' },
    { label: 'Banned Accounts',value: bannedUsersCount,    color: 'red',    sub: 'Restricted' },
  ]

  return (
    <>
      <div className="sw-page-header">
        <h1 className="sw-page-title">User Management</h1>
        <p className="sw-page-subtitle">Manage, monitor and moderate all platform users</p>
      </div>

      {/* Summary Cards */}
      <div className="sw-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {updatedSummaryCards.map((c, i) => (
          <div key={i} className="sw-stat-card">
            <div className="sw-stat-label">{c.label}</div>
            <div className={`sw-stat-value`} style={{ fontSize: 26 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--sw-text3)' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sw-toolbar">
        <div className="sw-filter-bar" style={{ margin: 0 }}>
          {['all', 'active', 'inactive', 'pending', 'banned'].map(f => (
            <button key={f} className={`sw-filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' && ` (${dataToUse.length})`}
            </button>
          ))}
        </div>
        <div className="sw-toolbar-right">
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--sw-text3)' }} />
            <input
              className="sw-input"
              style={{ paddingLeft: 34, width: 220 }}
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="sw-btn sw-btn-primary">
            <UserPlus size={14} />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="sw-card" style={{ padding: 0 }}>
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Skills</th>
                <th>Swaps</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--sw-text3)', fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div className="sw-user-cell">
                      {/* UPDATED TO IMAGE AVATAR */}
                      <div className="sw-table-avatar" style={{ overflow: 'hidden' }}>
                         <img src={u.img} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="sw-table-name">{u.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--sw-text3)' }}>{u.role}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{u.email}</td>
                  <td style={{ fontSize: 12 }}>{u.joined}</td>
                  <td>
                    <span className={`sw-badge ${u.status}`}>
                      <span className="sw-badge-dot" style={{
                        background: u.status === 'active' ? 'var(--sw-green)'
                          : u.status === 'pending' ? 'var(--sw-yellow)'
                          : u.status === 'banned' ? 'var(--sw-red)'
                          : 'var(--sw-text3)'
                      }} />
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{u.skills}</td>
                  <td style={{ fontWeight: 600 }}>{u.swaps}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="sw-btn sw-btn-ghost sw-btn-icon sw-btn-sm" title="View">
                        <Eye size={13} />
                      </button>
                      <button className="sw-btn sw-btn-ghost sw-btn-icon sw-btn-sm" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      {u.status !== 'banned' ? (
                        <button className="sw-btn sw-btn-danger sw-btn-icon sw-btn-sm" title="Ban">
                          <Ban size={13} />
                        </button>
                      ) : (
                        <button className="sw-btn sw-btn-success sw-btn-icon sw-btn-sm" title="Restore">
                          <Shield size={13} />
                        </button>
                      )}
                      <button className="sw-btn sw-btn-danger sw-btn-icon sw-btn-sm" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--sw-text3)' }}>
            No users found matching your search.
          </div>
        )}
      </div>
    </>
  )
}
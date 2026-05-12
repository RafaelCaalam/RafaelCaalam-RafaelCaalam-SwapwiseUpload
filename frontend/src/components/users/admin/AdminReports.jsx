import React, { useState, useEffect } from 'react'
import { Flag, AlertTriangle, CheckCircle, Eye, Trash2, ShieldAlert } from 'lucide-react'
import api from '../../../api'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await api.get('/admin/reports/')
      const data = response.data.map(r => ({
        id: `#RPT-${r.id}`,
        reporter: r.reporter_name,
        reporterImg: r.reporter_avatar,
        reported: r.reported_user_name || 'Platform',
        reportedImg: r.reported_user_avatar,
        reason: r.reason,
        category: r.category || 'Platform Issue',
        severity: r.severity,
        status: r.status,
        date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        description: r.reason,
      }))
      setReports(data)
    } catch (err) {
      setError('Failed to load reports')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (reportId, action) => {
    try {
      const id = reportId.replace('#RPT-', '')
      await api.patch(`/admin/reports/${id}/action/`, { action })
      // Update local state
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed' } : r
      ))
    } catch (err) {
      console.error('Action failed', err)
      // Could show a toast or alert
    }
  }

  const filtered = reports.filter(r => filter === 'all' || r.status === filter)

  const counts = {
    pending: reports.filter(r => r.status === 'pending').length,
    review: reports.filter(r => r.status === 'review').length, // Assuming review is a status, but model has pending/resolved/dismissed
    resolved: reports.filter(r => r.status === 'resolved').length,
    high: reports.filter(r => r.severity === 'high').length,
  }

  if (loading) return <div>Loading reports...</div>
  if (error) return <div>{error}</div>

  return (
    <>
      <div className="sw-page-header">
        <h1 className="sw-page-title">Reports & Moderation</h1>
        <p className="sw-page-subtitle">Review reported users, listings, and content</p>
      </div>

      {/* Summary */}
      <div className="sw-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {[
          { label: 'Total Reports',    value: reports.length,   color: 'blue',   icon: Flag },
          { label: 'High Severity',    value: counts.high,      color: 'red',    icon: ShieldAlert },
          { label: 'Pending Review',   value: counts.pending,   color: 'yellow', icon: AlertTriangle },
          { label: 'Resolved',         value: counts.resolved,  color: 'green',  icon: CheckCircle },
        ].map((c, i) => {
          const Icon = c.icon
          return (
            <div key={i} className="sw-stat-card">
              <div className="sw-stat-top">
                <div className={`sw-stat-icon ${c.color}`}><Icon size={18} /></div>
              </div>
              <div className="sw-stat-value" style={{ fontSize: 24 }}>{c.value}</div>
              <div className="sw-stat-label">{c.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      <div className="sw-filter-bar">
        {['all', 'pending', 'review', 'resolved'].map(f => (
          <button key={f} className={`sw-filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && ` (${reports.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="sw-card" style={{ padding: 0 }}>
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <React.Fragment key={r.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === r.id ? null : r.id)}>
                    <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--sw-blue)' }}>{r.id}</td>
                    <td>
                      <div className="sw-user-cell">
                        {/* REPORTER IMAGE */}
                        <div className="sw-table-avatar" style={{ overflow: 'hidden' }}>
                          <img src={r.reporterImg} alt={r.reporter} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span className="sw-table-name">{r.reporter}</span>
                      </div>
                    </td>
                    <td>
                      <div className="sw-user-cell">
                        {/* TARGET IMAGE */}
                        <div className="sw-table-avatar" style={{ overflow: 'hidden' }}>
                           <img src={r.reportedImg} alt={r.reported} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontSize: 12.5, color: 'var(--sw-text1)', fontWeight: 500 }}>{r.reported}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--sw-text1)', fontSize: 13 }}>{r.reason}</td>
                    <td><span className="sw-badge blue">{r.category}</span></td>
                    <td>
                      <div className={`sw-severity ${r.severity}`}>
                        <div className="sw-severity-dot" />
                        {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                      </div>
                    </td>
                    <td><span className={`sw-badge ${r.status}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
                    <td style={{ fontSize: 12 }}>{r.date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="sw-btn sw-btn-ghost sw-btn-icon sw-btn-sm" onClick={e => e.stopPropagation()} title="View">
                          <Eye size={12} />
                        </button>
                        <button className="sw-btn sw-btn-success sw-btn-icon sw-btn-sm" onClick={e => { e.stopPropagation(); handleAction(r.id, 'resolve') }} title="Resolve">
                          <CheckCircle size={12} />
                        </button>
                        <button className="sw-btn sw-btn-danger sw-btn-icon sw-btn-sm" onClick={e => { e.stopPropagation(); handleAction(r.id, 'dismiss') }} title="Dismiss">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selected === r.id && (
                    <tr key={`${r.id}-detail`}>
                      <td colSpan={9} style={{ background: 'var(--sw-blue-dim)', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <AlertTriangle size={15} style={{ color: 'var(--sw-yellow)', flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sw-text1)' }}>Report Detail: </span>
                            <span style={{ fontSize: 12, color: 'var(--sw-text2)' }}>{r.description}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--sw-text3)' }}>
            No reports found.
          </div>
        )}
      </div>
    </>
  )
}
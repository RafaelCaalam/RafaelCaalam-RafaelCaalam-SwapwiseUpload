import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Clock, CheckCircle2, XCircle, Eye, MessageSquare } from 'lucide-react'
import api from '../../../api'

const statusConfig = {
  confirmed:    { color: 'var(--sw-green)',  bgColor: 'rgba(34,197,94,0.1)' },  // Active
  pending:   { color: 'var(--sw-yellow)', bgColor: 'rgba(234,179,8,0.1)' },
  completed: { color: 'var(--sw-blue)',   bgColor: 'var(--sw-blue-dim)' },
  cancelled: { color: 'var(--sw-red)',    bgColor: 'rgba(239,68,68,0.1)' },
}

const statusTabs = ['all', 'confirmed', 'pending', 'completed', 'cancelled']

export default function SwapsPage() {
  const [swaps, setSwaps] = useState([])
  const [counts, setCounts] = useState({ total: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0 })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSwap, setSelectedSwap] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSwaps = async () => {
      try {
        setLoading(true)
        const params = filter === 'all' ? {} : { status: filter }
        const response = await api.get('/admin/swaps/', { params })
        console.log('Fetched admin swaps data:', response.data)
        setSwaps(response.data.swaps || [])
        setCounts(response.data.counts || { total: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0 })
      } catch (err) {
        console.error('Error fetching admin swaps:', err)
        setError('Unable to load swap transactions at this time.')
      } finally {
        setLoading(false)
      }
    }

    fetchSwaps()
  }, [filter])

  const handleView = (swap) => {
    setSelectedSwap(swap)
  }

  const handleMessage = () => {
    navigate('/admin/messages')
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading swaps...</div>
  }

  return (
    <>
      <div className="sw-page-header">
        <h1 className="sw-page-title">Swap Transactions</h1>
        <p className="sw-page-subtitle">Manage and monitor all skill exchange transactions</p>
      </div>

      {selectedSwap && (
        <div className="sw-card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sw-blue)' }}>{selectedSwap.swap_id}</div>
              <div style={{ marginTop: 6, color: 'var(--sw-text3)' }}>
                Viewing swap between {selectedSwap.requester_name} and {selectedSwap.receiver_name}
              </div>
            </div>
            <button className="sw-btn sw-btn-ghost sw-btn-sm" onClick={() => setSelectedSwap(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="sw-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {[
          { label: 'Total Swaps', value: counts.total, icon: ArrowLeftRight, color: 'blue' },
          { label: 'Active', value: counts.confirmed, icon: Clock, color: 'green' },
          { label: 'Pending', value: counts.pending, icon: Clock, color: 'yellow' },
          { label: 'Completed', value: counts.completed, icon: CheckCircle2, color: 'cyan' },
          { label: 'Cancelled', value: counts.cancelled, icon: XCircle, color: 'red' },
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

      <div className="sw-filter-bar">
        {statusTabs.map(f => (
          <button key={f} className={`sw-filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: 'var(--sw-red)', padding: 20, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div className="sw-grid-auto">
        {swaps.map((s, i) => {
          const sc = statusConfig[s.status] || statusConfig.pending
          return (
            <div key={s.swap_id || i} className="sw-swap-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--sw-blue)' }}>{s.swap_id}</span>
                <span className={`sw-badge ${s.status}`}>
                  <span className="sw-badge-dot" style={{ background: sc.color }} />
                  {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                </span>
              </div>

              <div className="sw-swap-users">
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div className="sw-table-avatar" style={{ margin: '0 auto 8px', overflow: 'hidden' }}>
                    <img src={s.requester_profile_pic} alt={s.requester_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="sw-swap-user-name">{s.requester_name}</div>
                  <div className="sw-swap-skill">{s.skills_exchanged?.[0]?.skill}</div>
                </div>

                <div className="sw-swap-arrow">
                  <ArrowLeftRight size={13} />
                </div>

                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div className="sw-table-avatar" style={{ margin: '0 auto 8px', overflow: 'hidden' }}>
                    <img src={s.receiver_profile_pic} alt={s.receiver_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="sw-swap-user-name">{s.receiver_name}</div>
                  <div className="sw-swap-skill">{s.skills_exchanged?.[1]?.skill}</div>
                </div>
              </div>

              {(s.status === 'confirmed' || s.status === 'completed' || s.status === 'pending') && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, color: 'var(--sw-text3)' }}>
                    <span>Progress</span>
                    <span style={{ color: 'var(--sw-blue)', fontWeight: 600 }}>{s.progress_percentage}%</span>
                  </div>
                  <div className="sw-progress">
                    <div className="sw-progress-fill" style={{ width: `${s.progress_percentage}%` }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--sw-text3)', marginBottom: 12 }}>
                <span>Started: {s.start_date}</span>
                <span>Duration: {s.duration}</span>
              </div>

              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={() => handleView(s)} className="sw-btn sw-btn-ghost sw-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  <Eye size={12} /> View
                </button>
                <button onClick={handleMessage} className="sw-btn sw-btn-ghost sw-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  <MessageSquare size={12} /> Message
                </button>
                {s.status === 'confirmed' && (
                  <button className="sw-btn sw-btn-danger sw-btn-sm">
                    <XCircle size={12} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {swaps.length === 0 && (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--sw-text3)' }}>
          No swaps found for this filter.
        </div>
      )}
    </>
  )
}

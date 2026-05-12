import React, { useState, useEffect } from 'react'
import { Send, Paperclip, Search, MoreHorizontal, Loader } from 'lucide-react'
import api from '../../../api'

export default function MessagesPage() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [messageLoading, setMessageLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  const currentAdminUser = (() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) return null
    try {
      return JSON.parse(savedUser)
    } catch {
      return null
    }
  })()

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const currentAdminId = storedUser?.id || storedUser?.pk || 22
  const currentAdminUsername = currentAdminUser?.username
  console.log("ADMIN SETUP: storedUser:", storedUser, "currentAdminId:", currentAdminId)

  // Fetch all support conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/admin/support/conversations/')
      const data = response.data || []
      setConversations(data)
      
      // Set the first conversation as active if available
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].user_id)
        fetchMessages(data[0].user_id)
      }
    } catch (err) {
      setError('Failed to load conversations')
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages for a specific user when activeId changes
  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId)
    }
  }, [activeId])

  const fetchMessages = async (userId) => {
    try {
      setMessageLoading(true)
      const response = await api.get(`/admin/support/messages/${userId}/`)
      setMessages(response.data || [])
    } catch (err) {
      setError('Failed to load messages')
      console.error('Error fetching messages:', err)
      setMessages([])
    } finally {
      setMessageLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!reply.trim() || !activeId) return

    try {
      const response = await api.post('/admin/support/send/', {
        receiver_id: activeId,
        content: reply.trim(),
      })

      // Add the new message to the chat
      setMessages([...messages, response.data])
      setReply('')

      // Update the conversation's last message
      setConversations(
        conversations.map(c =>
          c.user_id === activeId
            ? {
                ...c,
                last_message: reply.trim().substring(0, 50),
                last_message_time: new Date(),
              }
            : c
        )
      )
    } catch (err) {
      setError('Failed to send message')
      console.error('Error sending message:', err)
    }
  }

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const active = conversations.find(c => c.user_id === activeId)

  return (
    <>
      <div className="sw-page-header">
        <h1 className="sw-page-title">Support Messages</h1>
        <p className="sw-page-subtitle">Handle admin support inquiries and user communications</p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--sw-red)', color: '#fff', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="sw-messages-layout">
        {/* Sidebar */}
        <div className="sw-msg-sidebar">
          <div className="sw-msg-search">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--sw-text3)' }} />
              <input
                className="sw-input"
                style={{ paddingLeft: 34 }}
                placeholder="Search messages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="sw-msg-list">
            {loading ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--sw-text3)' }}>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--sw-text3)', fontSize: 13 }}>
                {searchTerm ? 'No conversations found' : 'No support messages yet'}
              </div>
            ) : (
              filteredConversations.map(c => (
                <div
                  key={c.user_id}
                  className={`sw-msg-item${activeId === c.user_id ? ' active' : ''}`}
                  onClick={() => setActiveId(c.user_id)}
                >
                  <div className="sw-table-avatar" style={{ flexShrink: 0, overflow: 'hidden' }}>
                    <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="sw-msg-item-content">
                    <div className="sw-msg-name">
                      {c.name}
                      <span className="sw-msg-time">
                        {new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="sw-msg-preview">{c.last_message}</div>
                  </div>
                  {c.unread_count > 0 && <div className="sw-msg-unread">{c.unread_count}</div>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat main */}
        {active ? (
          <div className="sw-msg-main">
            {/* Header */}
            <div className="sw-msg-header">
              <div className="sw-table-avatar" style={{ overflow: 'hidden' }}>
                <img src={active.avatar} alt={active.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--sw-text1)' }}>{active.name}</div>
                <div style={{ fontSize: 11, color: 'var(--sw-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sw-green)', display: 'inline-block' }} />
                  Online
                </div>
              </div>
              <button className="sw-btn sw-btn-ghost sw-btn-sm">
                <MoreHorizontal size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="sw-msg-body">
              {messageLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : messages && messages.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--sw-text3)', fontSize: 13 }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages && messages.map((msg, i) => {
                  const senderId = typeof msg.sender === 'object' ? msg.sender?.id : Number(msg.sender)
                  const isSentByAdmin = senderId === Number(currentAdminId) || msg.is_staff === true
                  console.log("DEBUG: Sender ID:", senderId, "Current Admin ID:", currentAdminId, "Match:", senderId === Number(currentAdminId), "is_staff:", msg.is_staff)
                  const messageText = msg.text ?? msg.content
                  const senderLabel = isSentByAdmin ? currentAdminUser?.name || currentAdminUsername || 'Admin' : active?.name || msg.sender

                  return (
                    <div 
                      key={msg.id ?? i} 
                      className={`sw-bubble-wrap ${isSentByAdmin ? 'own' : ''}`} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: isSentByAdmin ? 'flex-end' : 'flex-start',
                        justifyContent: isSentByAdmin ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div className={`sw-bubble ${isSentByAdmin ? 'own' : 'other'}`}>
                        {messageText}
                      </div>
                      <small className="msg-meta" style={{ color: 'var(--sw-text3)', marginTop: 4 }}>
                        {senderLabel} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                  )
                })
              )}
            </div>

            {/* Compose */}
            <div className="sw-msg-compose">
              <button className="sw-icon-btn" title="Attach">
                <Paperclip size={15} />
              </button>
              <input
                className="sw-input"
                placeholder="Type your reply..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                style={{ flex: 1 }}
              />
              <button className="sw-btn sw-btn-primary" onClick={handleSendMessage} disabled={!reply.trim()}>
                <Send size={14} />
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="sw-msg-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--sw-text3)' }}>
            {loading ? 'Loading conversations...' : 'Select a conversation to start messaging'}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .sw-msg-bubble.sent {
          background-color: var(--sw-blue);
          color: white;
          border-radius: 12px 12px 4px 12px;
          padding: 8px 12px;
          max-width: 70%;
          margin-left: auto;
          margin-bottom: 8px;
          word-wrap: break-word;
        }
        .sw-msg-bubble.received {
          background-color: var(--sw-bg2);
          color: var(--sw-text1);
          border-radius: 12px 12px 12px 4px;
          padding: 8px 12px;
          max-width: 70%;
          margin-right: auto;
          margin-bottom: 8px;
          word-wrap: break-word;
        }
      `}</style>
    </>
  )
}
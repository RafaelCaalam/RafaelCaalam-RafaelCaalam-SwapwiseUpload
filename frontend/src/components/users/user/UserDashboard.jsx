import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  Calendar,
  Star,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Zap,
  Search,
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  MessageCircle
} from "lucide-react";
import { getNotifications, respondToConnectionRequest, getDashboardData } from "../../../api/skillService";

const stats = [
  { label: "Skills Offered", value: "12", change: "+3", up: true, icon: BookOpen },
  { label: "Skill Matches", value: "47", change: "+8", up: true, icon: Users },
  { label: "Sessions Done", value: "23", change: "+5", up: true, icon: Calendar },
  { label: "Avg Rating", value: "4.9", change: "+0.2", up: true, icon: Star },
];

export default function UserDashboard({ isDark, setIsDark, sidebarOpen, setSidebarOpen, onNavigate, selectedChatContact, setSelectedChatContact, user }) {
  // Dynamic current user data based on logged-in user
  const currentUser = user ? {
    name: user.full_name || user.username || "User",
    initials: user.username ? user.username.substring(0, 2).toUpperCase() : "U",
    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username || "User")}&background=3b82f6&color=fff&size=150`
  } : {
    name: "Loading...",
    initials: "LD",
    image: "https://ui-avatars.com/api/?name=Loading&background=gray&color=fff&size=150"
  };

  // State for dashboard functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    recent_matches: [],
    upcoming_bookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const response = await getNotifications();
        const formatted = response.data.map((n) => {
          // parse time ago roughly
          const date = new Date(n.created_at);
          const diff = Math.floor((new Date() - date) / 1000 / 60);
          const timestamp = diff < 60 ? `${diff} minutes ago` : diff < 1440 ? `${Math.floor(diff / 60)} hours ago` : `${Math.floor(diff / 1440)} days ago`;

          // extract user name from message simply if it matches standard format
          let notifUser = "System";
          let message = n.content;
          if (n.content.includes("sent you a connection request")) {
            notifUser = n.content.split(" sent you a connection request")[0];
            message = "sent you a connection request";
          }
          
          return {
            id: n.id,
            type: "connection",
            user: notifUser,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(notifUser)}&background=3b82f6&color=fff`,
            message: message,
            timestamp: timestamp,
            unread: !n.is_read,
            connectionId: n.connection_id
          };
        });
        setNotifications(formatted);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifs();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardData();
        setDashboardData(response.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();

  }, []);

  const handleConnectionResponse = async (notificationId, connectionId, action) => {
    try {
      await respondToConnectionRequest(connectionId, action);
      
      setNotifications(prev => prev.map(n => {
        if (n.id === notificationId) {
          return {
            ...n,
            responded: true,
            responseMessage: action === 'accept' ? "You are now connected!" : "Request declined."
          };
        }
        return n;
      }));
    } catch (err) {
      console.error("Error responding to connection request:", err);
    }
  };

  // Handle message button click
  const handleMessageUser = (user) => {
    setSelectedChatContact(user.id || user);
    onNavigate('messages');
  };

  // Handle browse matches click
  const handleBrowseMatches = () => {
    onNavigate('matches');
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.type === 'message') {
      onNavigate('messages');
    }
    setShowNotifications(false);
  };

  // Handle profile dropdown actions
  const handleProfileAction = (action) => {
    if (action === 'settings') {
      onNavigate('settings');
    } else if (action === 'profile') {
      onNavigate('settings');
    }
    setShowProfileDropdown(false);
  };

  // Format booking data for display
  const formattedBookings = (dashboardData.upcoming_bookings || []).map(b => {
    const date = new Date(b.scheduled_at);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      day: date.getDate(),
      mon: date.toLocaleString('default', { month: 'short' }),
      title: b.skill_topic,
      meta: `${time} · ${b.duration_minutes} min`,
      partner: b.partner,
      status: b.status,
    };
  });

  return (
    <div className="sw-page-enter">
      {/* Integrated Topbar Header */}
      <header className="sw-topbar" style={{ marginBottom: '24px' }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Search */}
          <div className="sw-search-bar">
            <Search size={16} />
            <input 
              placeholder="Search skills (e.g. React, Python)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="sw-topbar-right">

          <button 
            className="sw-icon-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <Bell size={17} />
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="sw-notif-badge">
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>

          <div className="sw-user-pill" style={{ position: 'relative' }}>
            {/* Updated: Topbar User Avatar Image */}
            <div 
              className="sw-avatar" 
              style={{ borderRadius: '50%', overflow: 'hidden', padding: 0, cursor: 'pointer' }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <img 
                src={currentUser.image} 
                alt={currentUser.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="sw-user-info">
              <div className="sw-user-name">{currentUser.name}</div>
              <div className="sw-user-status">Online</div>
            </div>
            <button 
              className="sw-icon-btn"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{ marginLeft: '8px' }}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="sw-notification-dropdown">
          <div className="sw-notification-header">
            <h3>Notifications</h3>
            <button onClick={() => setShowNotifications(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="sw-notification-list">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`sw-notification-item ${notification.unread ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <img src={notification.avatar} alt={notification.user} className="sw-notification-avatar" />
                <div className="sw-notification-content">
                  <div className="sw-notification-message">
                    <strong>{notification.user}</strong> {notification.message}
                  </div>
                  <div className="sw-notification-time">{notification.timestamp}</div>
                  {notification.type === 'connection' && notification.message === "sent you a connection request" && !notification.responded && notification.connectionId && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button 
                        className="sw-btn-primary" 
                        style={{ padding: '4px 12px', fontSize: '12px', minHeight: 'auto' }}
                        onClick={(e) => { e.stopPropagation(); handleConnectionResponse(notification.id, notification.connectionId, 'accept'); }}
                      >
                        Accept
                      </button>
                      <button 
                        className="sw-btn-ghost" 
                        style={{ padding: '4px 12px', fontSize: '12px', minHeight: 'auto', border: '1px solid var(--sw-border-color)' }}
                        onClick={(e) => { e.stopPropagation(); handleConnectionResponse(notification.id, notification.connectionId, 'decline'); }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {notification.responded && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--sw-text-secondary)' }}>
                      {notification.responseMessage}
                    </div>
                  )}
                </div>
                {notification.unread && <div className="sw-notification-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Dropdown */}
      {showProfileDropdown && (
        <div className="sw-profile-dropdown">
          <div className="sw-profile-item" onClick={() => handleProfileAction('profile')}>
            <User size={16} />
            Profile
          </div>
          <div className="sw-profile-item" onClick={() => handleProfileAction('settings')}>
            <Settings size={16} />
            Settings
          </div>
          <div className="sw-profile-item logout" onClick={() => handleProfileAction('logout')}>
            <LogOut size={16} />
            Logout
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="sw-hero">
        <div className="sw-hero-greeting">Good morning, {currentUser.name.split(' ')[0]}</div>
        <div className="sw-hero-title">Welcome back to SwapWise</div>
        <div className="sw-hero-subtitle">
          You have 3 new skill match requests and 2 upcoming sessions today.
        </div>
        <div className="sw-hero-actions">
          <button className="sw-btn-ghost" onClick={handleBrowseMatches}>
            <Users size={15} />
            Browse Matches
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="sw-stats-grid">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div className="sw-stat-card" key={s.label}>
              <div className="sw-stat-icon">
                <Icon size={20} />
              </div>
              <div className="sw-stat-label">{s.label}</div>
              <div className="sw-stat-value">{s.value}</div>
              <div className={`sw-stat-change ${s.up ? "up" : "down"}`}>
                <TrendingUp size={12} />
                {s.change} this month
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Matches */}
      <div style={{ marginBottom: 24 }}>
        <div className="sw-section-head">
          <div className="sw-section-title">Recent Skill Matches</div>
          <button className="sw-section-link">View all</button>
        </div>
        <div className="sw-matches-grid">
          {(dashboardData.recent_matches || []).length > 0 ? (dashboardData.recent_matches || []).map((m) => (
            <div className="sw-match-card" key={m.name}>
              <div className="sw-match-header">
                {/* Round Avatar with Image */}
                <div
                  className="sw-match-avatar"
                  style={{ 
                    background: `linear-gradient(135deg, ${m.color}, ${m.color}99)`,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--sw-border-color, transparent)'
                  }}
                >
                  {m.image ? (
                    <img 
                      src={m.image} 
                      alt={m.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = m.initials;
                      }}
                    />
                  ) : (
                    m.initials
                  )}
                </div>
                <div>
                  <div className="sw-match-name">{m.name}</div>
                  <div className="sw-match-role">{m.role}</div>
                </div>
              </div>
              <div className="sw-skill-chips">
                <span className="sw-chip sw-chip-blue">Teaches</span>
                {m.teaches?.map((t) => (
                  <span className="sw-chip sw-chip-blue" key={t}>{t}</span>
                ))}
              </div>
              <div className="sw-skill-chips">
                <span className="sw-chip sw-chip-purple">Learns</span>
                {m.learns?.map((l) => (
                  <span className="sw-chip sw-chip-purple" key={l}>{l}</span>
                ))}
              </div>
              <div className="sw-match-rating">
                <Star size={13} fill="currentColor" />
                {m.rating} rating
              </div>
              <button 
                className="sw-btn-primary" 
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => handleMessageUser(m)}
              >
                <MessageCircle size={14} />
                Message
              </button>
            </div>
          )) : (
            <div className="sw-empty-state" style={{ gridColumn: '1 / -1' }}>
              <Users size={48} />
              <div className="sw-empty-title">No recent matches</div>
              <div className="sw-empty-subtitle">Connect with more users to see them here.</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="sw-two-col">
        <div className="sw-card">
          <div className="sw-card-inner">
            <div className="sw-section-head">
              <div className="sw-section-title">Upcoming Bookings</div>
              <button className="sw-section-link">
                <ArrowUpRight size={14} />
              </button>
            </div>
            {formattedBookings.length > 0 ? (
              formattedBookings.map((b) => (
              <div className="sw-booking-item" key={b.title}>
                <div className="sw-booking-date">
                  <div className="sw-booking-day">{b.day}</div>
                  <div className="sw-booking-mon">{b.mon}</div>
                </div>
                <div className="sw-booking-info">
                  <div className="sw-booking-title">{b.title}</div>
                  <div className="sw-booking-meta">
                    <Calendar size={11} />
                    {b.meta} · {b.partner}
                  </div>
                </div>
                <div className="sw-booking-actions">
                  <span className={`sw-booking-status ${b.status === "confirmed" ? "sw-status-confirmed" : "sw-status-pending"}`}>
                    {b.status}
                  </span>
                  <button className="sw-btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>
                    {b.status === "confirmed" ? "Join" : "View"}
                  </button>
                </div>
              </div>
            ))
            ) : (
              <div className="sw-empty" style={{ padding: '40px 20px' }}>
                <div className="sw-empty-title">No sessions scheduled</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  MessageCircle,
  Settings,
  LogOut,
} from "lucide-react";
import "./../../styles/UserDashboard.css";
import { getAdminSupportInfo } from "../../../api/skillService";
import UserDashboard from "./UserDashboard";
import MySkills from "./UserMySkill";
import Matches from "./UserMatches";
import Bookings from "./UserBookings";
import Messages from "./UserMessage";
import SettingsPage from "./UserSettings";
import Logo from "./../../../assets/logo.png"

const mainNav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "skills", label: "My Skills", icon: BookOpen },
  { id: "matches", label: "Matches", icon: Users, badge: "3" },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "messages", label: "Messages", icon: MessageCircle, badge: "2" },
];

const bottomNav = [
  { id: "settings", label: "Settings", icon: Settings },
];

export default function UserSidebar({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChatContact, setSelectedChatContact] = useState(null);

  const handleNav = (id) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const handleStartChat = async () => {
    try {
      const response = await getAdminSupportInfo();
      const adminId = response.data.id;
      setSelectedChatContact(adminId);
    } catch (err) {
      console.error("Unable to resolve admin support contact:", err);
    } finally {
      handleNav("messages");
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Props to pass to the active component
  const sharedProps = {
    isDark,
    setIsDark,
    sidebarOpen,
    setSidebarOpen,
    activeNav,
    user, // Pass user data to child components if needed
    onNavigate: handleNav, // Pass navigation function
    handleStartChat,
    selectedChatContact,
    setSelectedChatContact,
  };

  return (
    <div className="sw-dashboard" data-theme={isDark ? "dark" : "light"}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sw-mobile-overlay"
          style={{ 
            display: "block", 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.5)", 
            zIndex: 99 
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sw-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sw-sidebar-logo">
          <div className="sw-logo-icon">
            <img 
              src={Logo} 
              alt="SwapWise Logo" 
              style={{
                width: '24px', 
                height: '24px', 
                objectFit: 'contain',
                display: 'block'
              }} 
            />
          </div>
          <div className="sw-logo-text">SwapWise</div>
        </div>

        <nav className="sw-nav-section">
          <div className="sw-nav-label">Overview</div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sw-nav-item ${activeNav === item.id ? "active" : ""}`}
                onClick={() => handleNav(item.id)}
              >
                <Icon size={18} />
                {item.label}
                {item.badge && <span className="sw-nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sw-sidebar-bottom">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sw-nav-item ${activeNav === item.id ? "active" : ""}`}
                onClick={() => handleNav(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
          <button 
            className="sw-nav-item" 
            style={{ color: "var(--sw-danger)", marginTop: "8px" }}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="sw-main">
        <main className="sw-content">
          {activeNav === "dashboard" && <UserDashboard {...sharedProps} key="dashboard" />}
          {activeNav === "skills" && <MySkills {...sharedProps} key="skills" />}
          {activeNav === "matches" && <Matches {...sharedProps} key="matches" />}
          {activeNav === "bookings" && <Bookings {...sharedProps} key="bookings" />}
          {activeNav === "messages" && <Messages {...sharedProps} initialContact={selectedChatContact} key="messages" />}
          {activeNav === "settings" && <SettingsPage {...sharedProps} key="settings" />}
        </main>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { 
  User, Bell, Lock, Headphones, Flag, 
  Globe, Shield, Search, Send, AlertCircle, 
  CheckCircle2, HelpCircle 
} from "lucide-react";
import api from "../../../api";
import { getProfile, updateProfile } from "../../../api/skillService";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "support", label: "Customer Support", icon: Headphones },
  { id: "report", label: "Report Issue", icon: Flag },
  { id: "language", label: "Language", icon: Globe },
];

function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: on ? "var(--sw-blue)" : "var(--sw-bg-tertiary)",
        border: `1px solid ${on ? "var(--sw-blue)" : "var(--sw-blue-border)"}`,
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        flexShrink: 0,
        boxShadow: on ? "0 0 10px var(--sw-blue-glow)" : "none",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

function NotifRow({ label, sub, on, onToggle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--sw-blue-border)" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sw-text-primary)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--sw-text-muted)", marginTop: 2 }}>{sub}</div>
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

export default function SettingsPage({ user, handleStartChat }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [notifs, setNotifs] = useState({
    matches: true, 
    bookings: true, 
    messages: true, 
    reminders: false, 
    marketing: false 
  });

  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
    profile_pic: null
  });
  const [reportCategory, setReportCategory] = useState("UI/UX Bug");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setProfileData({
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          email: response.data.email || "",
          bio: response.data.bio || "",
          profile_pic: null
        });
        if (response.data.profile_pic) {
          setPreviewImage(response.data.profile_pic);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileData(prev => ({ ...prev, profile_pic: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("first_name", profileData.first_name);
      formData.append("last_name", profileData.last_name);
      formData.append("email", profileData.email);
      formData.append("bio", profileData.bio);
      if (profileData.profile_pic) {
        formData.append("profile_pic", profileData.profile_pic);
      }

      const response = await updateProfile(formData);
      if (response.data.profile_pic) {
        setPreviewImage(response.data.profile_pic);
      }
      setProfileData(prev => ({ ...prev, profile_pic: null }));
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = `${profileData.first_name} ${profileData.last_name}`.trim() || user?.username || "User";
  const initials = displayName.substring(0, 2).toUpperCase() || "U";
  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=150`;
  const displayImage = previewImage || defaultImage;

  const toggle = (key) => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="sw-page-enter">
      <div className="sw-page-header">
        <div className="sw-page-title">Settings</div>
        <div className="sw-page-subtitle">Manage your account preferences, localizations, and support</div>
      </div>

      <div className="sw-settings-grid">
        {/* Settings Nav Sidebar */}
        <div className="sw-card" style={{ height: "fit-content" }}>
          <div className="sw-card-inner">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`sw-settings-nav-item ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Main Content Area */}
        <div className="sw-card">
          <div className="sw-card-inner">
            
            {/* 1. PROFILE SECTION */}
            {activeTab === "profile" && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--sw-text-primary)", marginBottom: 20 }}>Profile Information</div>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", border: "3px solid var(--sw-blue-border)",
                    boxShadow: "0 0 20px var(--sw-blue-glow)",
                    fontSize: 24, fontWeight: "bold", color: "#fff"
                  }}>
                    {displayImage ? (
                      <img src={displayImage} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div>
                    <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleImageChange} />
                    <button className="sw-btn-primary" style={{ marginBottom: 8 }} onClick={() => fileInputRef.current.click()}>Change Photo</button>
                    <div style={{ fontSize: 12, color: "var(--sw-text-muted)" }}>JPG, PNG or GIF · Max 5MB</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="sw-form-group">
                    <label className="sw-form-label">First Name</label>
                    <input className="sw-form-input" name="first_name" value={profileData.first_name} onChange={handleInputChange} placeholder="First Name" />
                  </div>
                  <div className="sw-form-group">
                    <label className="sw-form-label">Last Name</label>
                    <input className="sw-form-input" name="last_name" value={profileData.last_name} onChange={handleInputChange} placeholder="Last Name" />
                  </div>
                </div>

                <div className="sw-form-group">
                  <label className="sw-form-label">Email Address</label>
                  <input className="sw-form-input" type="email" name="email" value={profileData.email} onChange={handleInputChange} placeholder="Email Address" />
                </div>

                <div className="sw-form-group">
                  <label className="sw-form-label">Bio</label>
                  <textarea className="sw-form-input" rows={3} name="bio" value={profileData.bio} onChange={handleInputChange} placeholder="Write a short bio about yourself..." style={{ resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button className="sw-btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button className="sw-btn-ghost" onClick={() => {
                    setProfileData(prev => ({ ...prev, profile_pic: null }));
                    setPreviewImage(null);
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {/* 2. NOTIFICATIONS SECTION */}
            {activeTab === "notifications" && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--sw-text-primary)", marginBottom: 6 }}>Notification Preferences</div>
                <div style={{ fontSize: 13, color: "var(--sw-text-muted)", marginBottom: 20 }}>Choose how and when you receive notifications</div>
                <NotifRow label="New Skill Matches" sub="Be notified when someone matches your skills" on={notifs.matches} onToggle={() => toggle("matches")} />
                <NotifRow label="Booking Updates" sub="Session confirmations, reminders and changes" on={notifs.bookings} onToggle={() => toggle("bookings")} />
                <NotifRow label="New Messages" sub="Get notified of incoming chat messages" on={notifs.messages} onToggle={() => toggle("messages")} />
              </div>
            )}

            {/* 3. SECURITY SECTION */}
            {activeTab === "security" && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--sw-text-primary)", marginBottom: 20 }}>Security Settings</div>
                <div className="sw-form-group">
                  <label className="sw-form-label">Current Password</label>
                  <input className="sw-form-input" type="password" placeholder="Enter current password" />
                </div>
                <div className="sw-form-group">
                  <label className="sw-form-label">New Password</label>
                  <input className="sw-form-input" type="password" placeholder="Enter new password" />
                </div>
                <button className="sw-btn-primary">Update Password</button>
                <div className="sw-divider" />
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sw-text-primary)", marginBottom: 8 }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 13, color: "var(--sw-text-muted)", marginBottom: 14 }}>Add an extra layer of security to your account.</div>
                <button className="sw-btn-ghost">Enable 2FA</button>
              </div>
            )}

            {/* 4. CUSTOMER SUPPORT SECTION */}
            {activeTab === "support" && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--sw-text-primary)", marginBottom: 6 }}>Customer Support</div>
                <div style={{ fontSize: 13, color: "var(--sw-text-muted)", marginBottom: 20 }}>Find answers or reach out to our team.</div>
                
                <div style={{ position: "relative", marginBottom: 24 }}>
                   <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--sw-text-muted)" }} />
                   <input className="sw-form-input" style={{ paddingLeft: 38 }} placeholder="Search help articles..." />
                </div>

                <div className="sw-card" style={{ background: "var(--sw-blue-dim)", border: "1px solid var(--sw-blue-border)", marginBottom: 24 }}>
                  <div className="sw-card-inner">
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--sw-blue-light)", marginBottom: 8 }}>Contact Admin Support</div>
                    <p style={{ fontSize: 12, color: "var(--sw-text-muted)", marginBottom: 12 }}>Typical response time: 2-4 hours.</p>
                    <button
                      className="sw-btn-primary"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={handleStartChat}
                    >
                      <Send size={14} style={{ marginRight: 8 }} /> Start Chat
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sw-text-primary)", marginBottom: 12 }}>Frequently Asked Questions</div>
                {["How do I verify my profile?", "What are Swap Points?", "Reporting a user"].map((q, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: "14px 0", borderBottom: "1px solid var(--sw-blue-border)", fontSize: 13, color: "var(--sw-text-muted)", cursor: "pointer" }}>
                    <HelpCircle size={14} color="var(--sw-blue-light)" />
                    {q}
                  </div>
                ))}
              </div>
            )}

            {/* 5. REPORT ISSUE SECTION */}
            {activeTab === "report" && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--sw-text-primary)", marginBottom: 6 }}>Report an Issue</div>
                <div style={{ fontSize: 13, color: "var(--sw-text-muted)", marginBottom: 20 }}>Help us improve by reporting bugs or violations.</div>

                <div className="sw-form-group">
                  <label className="sw-form-label">Report Category</label>
                  <select
                    className="sw-form-input"
                    style={{ background: "var(--sw-bg-secondary)" }}
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                  >
                    <option>UI/UX Bug</option>
                    <option>Functional Issue</option>
                    <option>Harassment/Safety</option>
                    <option>Billing Question</option>
                  </select>
                </div>

                <div className="sw-form-group">
                  <label className="sw-form-label">Description</label>
                  <textarea
                    className="sw-form-input"
                    rows={5}
                    placeholder="Describe exactly what happened..."
                    style={{ resize: "none" }}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                </div>

                {reportError && (
                  <div style={{ padding: "12px", marginBottom: 16, borderRadius: 8, background: "rgba(254, 202, 202, 0.2)", color: "#b91c1c" }}>
                    {reportError}
                  </div>
                )}
                {reportSuccess && (
                  <div style={{ padding: "12px", marginBottom: 16, borderRadius: 8, background: "rgba(34, 197, 94, 0.12)", color: "#166534" }}>
                    {reportSuccess}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "rgba(239, 68, 68, 0.05)", borderRadius: 8, marginBottom: 20, border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                  <AlertCircle size={16} color="#ef4444" />
                  <div style={{ fontSize: 12, color: "#ef4444" }}>Include screenshots if possible in the chat follow-up.</div>
                </div>

                <button
                  className="sw-btn-primary"
                  style={{ background: "#ef4444", borderColor: "#ef4444" }}
                  onClick={async () => {
                    setReportError("");
                    if (!reportCategory || !reportDescription.trim()) {
                      setReportError("Please select a category and provide a description.");
                      return;
                    }

                    if (!window.confirm("Are you sure you want to submit this report?")) {
                      return;
                    }

                    setReportSubmitting(true);
                    try {
                      await api.post("/reports/submit/", {
                        report_category: reportCategory,
                        description: reportDescription.trim(),
                      });
                      setReportDescription("");
                      setReportCategory("UI/UX Bug");
                      setReportSuccess("Report submitted successfully! Our team will review it.");
                      setTimeout(() => setReportSuccess(""), 5000);
                    } catch (err) {
                      console.error("Failed to submit report", err);
                      setReportError("Unable to submit report. Please try again later.");
                    } finally {
                      setReportSubmitting(false);
                    }
                  }}
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            )}

            {/* 6. LANGUAGE SECTION */}
            {activeTab === "language" && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--sw-text-primary)", marginBottom: 6 }}>Language & Region</div>
                <div style={{ fontSize: 13, color: "var(--sw-text-muted)", marginBottom: 20 }}>Customize your localized experience.</div>

                <div className="sw-form-group">
                  <label className="sw-form-label">Display Language</label>
                  <select className="sw-form-input" style={{ background: "var(--sw-bg-secondary)" }}>
                    <option value="en">English (US)</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div className="sw-form-group">
                  <label className="sw-form-label">Time Zone</label>
                  <select className="sw-form-input" style={{ background: "var(--sw-bg-secondary)" }}>
                    <option>(GMT-08:00) Pacific Time</option>
                    <option>(GMT+00:00) UTC</option>
                    <option>(GMT+08:00) Singapore/Manila</option>
                  </select>
                </div>

                <div className="sw-divider" />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sw-text-primary)" }}>Auto-translate Content</div>
                    <div style={{ fontSize: 12, color: "var(--sw-text-muted)", marginTop: 2 }}>Translate listings and chats automatically.</div>
                  </div>
                  <Toggle on={true} onToggle={() => {}} />
                </div>

                <div style={{ 
                  marginTop: 24, padding: "16px", borderRadius: 12, 
                  background: "var(--sw-bg-secondary)", border: "1px dashed var(--sw-blue-border)" 
                }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--sw-blue-light)", fontWeight: 700, marginBottom: 12 }}>
                    Regional Preview
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--sw-text-muted)" }}>Date</div>
                      <div style={{ fontSize: 13, color: "var(--sw-text-primary)" }}>May 9, 2026</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--sw-text-muted)" }}>Currency</div>
                      <div style={{ fontSize: 13, color: "var(--sw-text-primary)" }}>USD ($)</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
                  <button className="sw-btn-primary">Save Language Settings</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
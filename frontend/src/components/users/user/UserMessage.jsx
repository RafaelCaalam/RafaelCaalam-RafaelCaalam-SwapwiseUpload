import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Send, Search, Calendar, Clock, X } from "lucide-react";
import { getConversations, getMessages, sendMessage as sendMessageAPI, getAdminSupportInfo, sendSupportMessage, createBooking, respondToBooking } from "../../../api/skillService";

export default function Messages({ selectedUser, initialContact }) {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [adminUserId, setAdminUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSkill, setBookingSkill] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Ref for auto-scrolling messages to bottom
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch conversations on mount and add admin if starting support chat
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await getConversations();
        let convList = response.data || [];

        // Check if we need to add admin to the list (support chat or initialContact)
        if (location.state?.chatWithAdmin || initialContact) {
          try {
            const adminResponse = await getAdminSupportInfo();
            const adminId = adminResponse.data.id;
            const adminUsername = adminResponse.data.username || "admin";
            setAdminUserId(adminId);

            // Check if admin (with username "admin") is already in the conversations list
            const adminExists = convList.some(conv => conv.id === adminId || conv.username === "admin");

            // If admin is not in the list, add a temporary admin contact
            if (!adminExists) {
              const tempAdminContact = {
                id: adminId,
                name: "System Support",
                username: adminUsername,
                last_seen_text: "Online now",
                is_admin: true,
                is_staff: true,
                is_temporary: true
              };
              convList = [tempAdminContact, ...convList];
            }
          } catch (err) {
            console.error("Error fetching admin info:", err);
          }
        }

        console.log("Conversations loaded:", convList);
        console.log("Admin present in conversations:", convList.some(conv => conv.username === 'admin' || conv.is_admin));
        setConversations(convList);
        if (convList.length > 0 && !active && !initialContact && !location.state?.chatWithAdmin) {
          setActive(convList[0].id);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Failed to load conversations");
      }
    };

    fetchConversations();
  }, [location.state?.chatWithAdmin]);

  // Fetch messages for active contact (with polling every 4 seconds)
  useEffect(() => {
    if (!active) return;

    const fetchMessages = async () => {
      try {
        const response = await getMessages(active);
        setMessages(response.data || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    // Initial fetch
    fetchMessages();

    // Set up polling interval (4 seconds)
    const intervalId = setInterval(fetchMessages, 4000);

    return () => clearInterval(intervalId);
  }, [active]);

  useEffect(() => {
    const contactId = initialContact || (selectedUser ? (selectedUser.id || selectedUser) : null) || adminUserId;
    if (!contactId) return;

    setActive(contactId);
  }, [initialContact, selectedUser, adminUserId]);

  const handleSendMessage = async () => {
    if (!inputVal.trim() || !active) return;

    const messageContent = inputVal.trim();
    setInputVal("");

    try {
      if (adminUserId && active === adminUserId) {
        await sendSupportMessage(messageContent);
      } else {
        await sendMessageAPI(active, messageContent);
      }

      // Fetch updated messages after sending
      const response = await getMessages(active);
      setMessages(response.data || []);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
      // Restore input on error
      setInputVal(messageContent);
    }
  };

  const handleCreateBooking = async (e) => {
    // Prevent default form submission behavior
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    console.log("[DEBUG] handleCreateBooking triggered");
    console.log("[DEBUG] bookingSkill:", bookingSkill);
    console.log("[DEBUG] bookingDate:", bookingDate);
    console.log("[DEBUG] bookingTime:", bookingTime);
    console.log("[DEBUG] active contact:", active);
    
    if (!bookingSkill.trim() || !bookingDate || !bookingTime || !active) {
      console.log("[DEBUG] Validation failed - missing required fields");
      return;
    }

    setBookingLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      console.log("[DEBUG] Sending booking request with scheduledAt:", scheduledAt);

      await createBooking(active, bookingSkill.trim(), scheduledAt, bookingDuration, bookingNotes.trim());
      console.log("[DEBUG] Booking created successfully");

      // Reset form and close modal BEFORE refreshing messages
      setBookingSkill("");
      setBookingDate("");
      setBookingTime("");
      setBookingDuration(60);
      setBookingNotes("");
      setError(null);
      
      console.log("[DEBUG] Form state reset complete");
      
      // Close modal
      setShowBookingModal(false);
      console.log("[DEBUG] Modal closed");

      // Refresh messages to show the booking request
      const response = await getMessages(active);
      setMessages(response.data || []);
      console.log("[DEBUG] Messages refreshed");
    } catch (err) {
      console.error("[ERROR] Error creating booking:", err);
      console.error("[ERROR] Error details:", err.response?.data || err.message);
      setError("Failed to create booking request");
    } finally {
      setBookingLoading(false);
      console.log("[DEBUG] Loading state reset");
    }
  };

  const handleBookingResponse = async (bookingId, action) => {
    try {
      const response = await respondToBooking(bookingId, action);

      // Update the booking status in the local messages state
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.booking && msg.booking.id === bookingId) {
            return {
              ...msg,
              booking: {
                ...msg.booking,
                status: response.data.booking.status
              }
            };
          }
          return msg;
        })
      );
    } catch (err) {
      console.error("Error responding to booking:", err);
      setError("Failed to respond to booking request");
    }
  };

  const activeContact = conversations.find((c) => c.id === active) || (adminUserId && active === adminUserId ? {
    id: active,
    name: "System Support",
    last_seen_text: "Online now",
    is_admin: true,
    is_staff: true
  } : null);

  // Format timestamp to time string
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    }
    return date.toLocaleDateString();
  };

  // Get last message preview for sidebar
  const getLastMessagePreview = (userId) => {
    const userMessages = messages.filter(m => m.sender === userId || m.receiver === userId);
    if (userMessages.length === 0) return "No messages yet";
    return userMessages[userMessages.length - 1].content.substring(0, 40) + 
           (userMessages[userMessages.length - 1].content.length > 40 ? "..." : "");
  };

  const getCurrentUserId = () => {
    // This would typically come from auth context/state
    // For now, we'll extract from the first received message or use a default
    // In a real app, you'd have this from your auth system
    return null; // Will be set by checking message ownership
  };

  // Determine if a message is from current user by checking if receiver matches active contact
  const isMessageFromCurrentUser = (msg) => {
    return msg.receiver === active;
  };

  return (
    <div className="sw-page-enter" style={{ height: "100%" }}>
      <div className="sw-page-header">
        <div className="sw-page-title">Chat & Messaging</div>
        <div className="sw-page-subtitle">Chat with your skill exchange partners</div>
      </div>

      <div className="sw-messages-layout">
        {/* Contact list */}
        <div className="sw-msg-list">
          <div className="sw-msg-list-head">
            Conversations
            <div className="sw-search-bar" style={{ marginTop: 10, minWidth: "unset" }}>
              <Search size={14} />
              <input placeholder="Search..." />
            </div>
          </div>
          {conversations.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--sw-text-muted)" }}>
              No conversations yet. Connect with users to start messaging.
            </div>
          ) : (
            conversations.map((contact) => (
              <div
                key={contact.id}
                className={`sw-msg-item ${active === contact.id ? "active" : ""}`}
                onClick={() => setActive(contact.id)}
              >
                <div 
                  className="sw-msg-avatar"
                  style={{
                    backgroundColor: "var(--sw-color-primary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="sw-msg-name">{contact.name}</div>
                    {contact.is_admin && (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "var(--sw-danger)",
                        color: "white",
                        flexShrink: 0
                      }}>
                        STAFF
                      </span>
                    )}
                  </div>
                  <div className="sw-msg-preview">{getLastMessagePreview(contact.id)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div className="sw-msg-time">{contact.last_seen_text}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="sw-chat-area">
          {activeContact ? (
            <div className="sw-chat-main-container">
              {/* Header */}
              <div className="sw-chat-header">
                <div 
                  className="sw-msg-avatar"
                  style={{
                    backgroundColor: "var(--sw-color-primary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: "bold",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                >
                  {activeContact.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sw-text-primary)" }}>
                      {activeContact.name}
                    </div>
                    {activeContact.is_admin && (
                      <span style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor: "var(--sw-danger)",
                        color: "white",
                        flexShrink: 0
                      }}>
                        SUPPORT TEAM
                      </span>
                    )}
                  </div>
                  <div className="sw-user-status" style={{ fontSize: 11 }}>
                    {activeContact.last_seen_text}
                  </div>
                </div>
                {!activeContact.is_admin && (
                  <button 
                    className="sw-btn-primary"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                    onClick={() => setShowBookingModal(true)}
                  >
                    <Calendar size={14} style={{ marginRight: 6 }} />
                    Schedule
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="sw-chat-messages">
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--sw-text-muted)", padding: "20px" }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`sw-bubble-wrap ${isMessageFromCurrentUser(msg) ? "own" : ""}`}>
                      {!isMessageFromCurrentUser(msg) && (
                        <div
                          className="sw-msg-avatar"
                          style={{
                            width: 32,
                            height: 32,
                            alignSelf: "flex-end",
                            flexShrink: 0,
                            backgroundColor: "var(--sw-color-primary)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: "bold",
                            borderRadius: "50%",
                          }}
                        >
                          {activeContact.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMessageFromCurrentUser(msg) ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                        {msg.message_type === 'booking_request' ? (
                          <div className="sw-booking-card">
                            <div className="sw-booking-card-header">
                              <Calendar size={16} />
                              <span>Session Request</span>
                            </div>
                            <div className="sw-booking-card-content">
                              <div className="sw-booking-card-title">{msg.content}</div>
                              <div className="sw-booking-card-meta">
                                <Clock size={12} />
                                <span>Duration: 60 minutes</span>
                              </div>
                            </div>
                            {!isMessageFromCurrentUser(msg) && msg.booking && (
                              <div className="sw-booking-card-actions">
                                {msg.booking.status === 'pending' ? (
                                  <>
                                    <button
                                      className="sw-btn-primary"
                                      style={{ padding: "6px 14px", fontSize: 12 }}
                                      onClick={() => handleBookingResponse(msg.booking.id, 'accept')}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      className="sw-btn-ghost"
                                      style={{ padding: "6px 14px", fontSize: 12 }}
                                      onClick={() => handleBookingResponse(msg.booking.id, 'decline')}
                                    >
                                      Decline
                                    </button>
                                  </>
                                ) : msg.booking.status === 'confirmed' ? (
                                  <div className="sw-booking-status-badge sw-status-confirmed">
                                    ✓ Session scheduled! Check your Bookings page.
                                  </div>
                                ) : msg.booking.status === 'cancelled' ? (
                                  <div className="sw-booking-status-badge sw-status-cancelled">
                                    ✗ Declined
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`sw-bubble ${isMessageFromCurrentUser(msg) ? "own" : "other"}`} style={{ width: 'fit-content', whiteSpace: 'pre-wrap', wordBreak: 'normal', padding: '8px 12px', borderRadius: '15px' }}>
                            {msg.content}
                          </div>
                        )}
                        <div 
                          style={{
                            fontSize: 10,
                            color: "var(--sw-text-muted)",
                            marginTop: 4,
                            textAlign: isMessageFromCurrentUser(msg) ? "right" : "left",
                          }}
                        >
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="sw-chat-input">
                <input
                  placeholder="Type a message..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button 
                  className="sw-btn-primary" 
                  style={{ padding: "10px 14px" }} 
                  onClick={handleSendMessage}
                  disabled={loading}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--sw-text-muted)" }}>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="sw-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="sw-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateBooking}>
              <div className="sw-modal-header">
                <h3>Schedule Skill Session</h3>
                <button 
                  type="button"
                  className="sw-modal-close"
                  onClick={() => setShowBookingModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="sw-modal-body">
                <div className="sw-form-group">
                  <label>Skill Topic</label>
                  <input
                    type="text"
                    placeholder="e.g., React Hooks, Python Basics"
                    value={bookingSkill}
                    onChange={(e) => setBookingSkill(e.target.value)}
                    disabled={bookingLoading}
                  />
                </div>
                <div className="sw-form-row">
                  <div className="sw-form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={bookingLoading}
                    />
                  </div>
                  <div className="sw-form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      disabled={bookingLoading}
                    />
                  </div>
                </div>
                <div className="sw-form-group">
                  <label>Duration (minutes)</label>
                  <select
                    value={bookingDuration}
                    onChange={(e) => setBookingDuration(parseInt(e.target.value))}
                    disabled={bookingLoading}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
                <div className="sw-form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    placeholder="Any additional details..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={3}
                    disabled={bookingLoading}
                  />
                </div>
              </div>
              <div className="sw-modal-footer">
                <button 
                  type="button"
                  className="sw-btn-ghost"
                  onClick={() => setShowBookingModal(false)}
                  disabled={bookingLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="sw-btn-primary"
                  disabled={bookingLoading || !bookingSkill.trim() || !bookingDate || !bookingTime}
                >
                  {bookingLoading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
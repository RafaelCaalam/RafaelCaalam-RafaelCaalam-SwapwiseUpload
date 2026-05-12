import { useState, useEffect } from "react";
import { Calendar, Clock, Video, Plus, ChevronRight, CheckCircle, Play, X, AlertCircle } from "lucide-react";
import { getBookings, updateBookingStatus, markBookingDone, requestBookingCancellation, respondToCancellation } from "../../../api/skillService";

export default function Bookings() {
  const [tab, setTab] = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelConfirmModal, setCancelConfirmModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Fetch bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await getBookings();
        // Filter out cancelled bookings
        const activeBookings = (response.data || []).filter(b => b.status !== 'cancelled');
        setBookings(activeBookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      const response = await getBookings();
      setBookings(response.data || []);
    } catch (err) {
      console.error("Error updating booking:", err);
      setError("Failed to update booking");
    }
  };

  const handleMarkDone = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      await markBookingDone(bookingId);
      const response = await getBookings();
      setBookings(response.data || []);
    } catch (err) {
      console.error("Error marking booking done:", err);
      setError(err.response?.data?.error || "Failed to mark booking done");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestCancellation = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      await requestBookingCancellation(bookingId);
      const response = await getBookings();
      setBookings(response.data || []);
      setCancelConfirmModal(null);
    } catch (err) {
      console.error("Error requesting cancellation:", err);
      setError(err.response?.data?.error || "Failed to request cancellation");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      mon: date.toLocaleDateString('en-US', { month: 'short' }),
      year: date.getFullYear().toString(),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  const getBookingType = (booking) => {
    const currentUserId = 1;
    return booking.mentor === currentUserId ? "Teaching" : "Learning";
  };

  const tabStyle = (t) => ({
    padding: "9px 20px",
    borderRadius: 10,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    background: tab === t ? "var(--sw-blue-dim)" : "transparent",
    borderColor: tab === t ? "var(--sw-blue-border)" : "transparent",
    color: tab === t ? "var(--sw-blue-light)" : "var(--sw-text-secondary)",
  });

  const Avatar = ({ booking }) => {
    const partnerName = booking.mentor_name || booking.student_name || "User";
    const initials = partnerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    return (
      <div
        className="sw-match-avatar"
        style={{
          background: `linear-gradient(135deg, #3b82f6, #3b82f688)`,
          width: 40,
          height: 40,
          borderRadius: "50%",
          fontSize: 14,
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
        }}
      >
        {initials}
      </div>
    );
  };

  const hasOtherUserConfirmed = (booking, currentUserRole) => {
    if (currentUserRole === 'mentor') {
      return booking.student_confirmed_done;
    }
    return booking.mentor_confirmed_done;
  };

  const getCurrentUserConfirmation = (booking, currentUserRole) => {
    if (currentUserRole === 'mentor') {
      return booking.mentor_confirmed_done;
    }
    return booking.student_confirmed_done;
  };

  return (
    <div className="sw-page-enter">
      <div
        className="sw-page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <div>
          <div className="sw-page-title">Bookings</div>
          <div className="sw-page-subtitle">Manage your upcoming and past skill sessions</div>
        </div>
        <button className="sw-btn-primary">
          <Plus size={14} />
          New Booking
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--sw-red)', color: '#fff', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {["upcoming", "past", "pending"].map((t) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {tab === "upcoming" && (
        <div className="sw-card">
          <div className="sw-card-inner" style={{ padding: "8px 0" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--sw-text-muted)" }}>
                Loading bookings...
              </div>
            ) : error ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--sw-danger)" }}>
                {error}
              </div>
            ) : bookings.filter((b) => b.status === "confirmed").length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--sw-text-muted)" }}>
                No confirmed bookings yet
              </div>
            ) : (
              bookings
                .filter((b) => b.status === "confirmed")
                .map((b) => {
                  const dateInfo = formatDate(b.scheduled_at);
                  const partnerName = b.mentor_name || b.student_name || "Partner";
                  const bookingType = getBookingType(b);
                  const isMentor = bookingType === "Teaching";
                  const currentUserConfirmed = getCurrentUserConfirmation(b, isMentor ? 'mentor' : 'student');
                  const otherUserConfirmed = hasOtherUserConfirmed(b, isMentor ? 'mentor' : 'student');
                  const hasCancellationRequest = !!b.cancellation_requested_by;
                  
                  return (
                    <div key={b.id} style={{ padding: "18px 24px", borderBottom: "1px solid var(--sw-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="sw-booking-date">
                          <div className="sw-booking-day">{dateInfo.day}</div>
                          <div className="sw-booking-mon">{dateInfo.mon}</div>
                        </div>
                        <Avatar booking={b} />
                        <div className="sw-booking-info" style={{ flex: 1 }}>
                          <div className="sw-booking-title">{b.skill_topic}</div>
                          <div className="sw-booking-meta">
                            <Clock size={11} />
                            {dateInfo.time} · {b.duration_minutes} min
                            <span style={{ margin: "0 4px", opacity: 0.4 }}>|</span>
                            <Video size={11} />
                            Video Call
                            <span style={{ margin: "0 4px", opacity: 0.4 }}>|</span>
                            with {partnerName}
                          </div>
                        </div>
                        <span
                          className={`sw-chip ${bookingType === "Teaching" ? "sw-chip-blue" : "sw-chip-purple"}`}
                          style={{ flexShrink: 0 }}
                        >
                          {bookingType}
                        </span>
                        <span className="sw-booking-status sw-status-confirmed" style={{ flexShrink: 0 }}>
                          confirmed
                        </span>
                      </div>

                      {/* Status and Actions */}
                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {hasCancellationRequest ? (
                          <div style={{ padding: "6px 12px", background: "var(--sw-red)", color: "#fff", borderRadius: 6, fontSize: 12, flex: 1 }}>
                            ⚠️ Cancellation requested by {b.cancellation_requested_by.username || 'user'}
                          </div>
                        ) : currentUserConfirmed && !otherUserConfirmed ? (
                          <div style={{ padding: "6px 12px", background: "var(--sw-green)", color: "#fff", borderRadius: 6, fontSize: 12, flex: 1 }}>
                            ✓ Waiting for {partnerName} to confirm completion...
                          </div>
                        ) : !currentUserConfirmed && otherUserConfirmed ? (
                          <div style={{ padding: "6px 12px", background: "var(--sw-yellow)", color: "#000", borderRadius: 6, fontSize: 12, flex: 1 }}>
                            ⏳ {partnerName} is waiting for your confirmation
                          </div>
                        ) : null}

                        {!hasCancellationRequest && (
                          <>
                            <button
                              onClick={() => handleMarkDone(b.id)}
                              disabled={processingId === b.id || currentUserConfirmed}
                              style={{
                                padding: "6px 14px",
                                fontSize: 12,
                                background: currentUserConfirmed ? "var(--sw-green)" : "var(--sw-blue)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                cursor: processingId === b.id ? "wait" : "pointer",
                                opacity: processingId === b.id ? 0.7 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <CheckCircle size={14} />
                              {currentUserConfirmed ? "Done ✓" : "Mark Done"}
                            </button>

                            <button
                              onClick={() => setCancelConfirmModal(b.id)}
                              disabled={processingId === b.id}
                              style={{
                                padding: "6px 14px",
                                fontSize: 12,
                                background: "var(--sw-red)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                cursor: processingId === b.id ? "wait" : "pointer",
                                opacity: processingId === b.id ? 0.7 : 1,
                              }}
                            >
                              Cancel Booking
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Pending */}
      {tab === "pending" && (
        <div className="sw-card">
          <div className="sw-card-inner" style={{ padding: "8px 0" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--sw-text-muted)" }}>
                Loading bookings...
              </div>
            ) : bookings.filter((b) => b.status === "pending").length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--sw-text-muted)" }}>
                No pending bookings
              </div>
            ) : (
              bookings
                .filter((b) => b.status === "pending")
                .map((b) => {
                  const dateInfo = formatDate(b.scheduled_at);
                  const partnerName = b.mentor_name || b.student_name || "Partner";
                  
                  return (
                    <div className="sw-booking-item" key={b.id} style={{ padding: "18px 24px" }}>
                      <div className="sw-booking-date">
                        <div className="sw-booking-day">{dateInfo.day}</div>
                        <div className="sw-booking-mon">{dateInfo.mon}</div>
                      </div>
                      <Avatar booking={b} />
                      <div className="sw-booking-info">
                        <div className="sw-booking-title">{b.skill_topic}</div>
                        <div className="sw-booking-meta">
                          <Clock size={11} />
                          {dateInfo.time} · {b.duration_minutes} min · with {partnerName}
                        </div>
                      </div>
                      <span className="sw-booking-status sw-status-pending">pending</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button 
                          className="sw-btn-primary" 
                          style={{ padding: "6px 14px", fontSize: 12 }}
                          onClick={() => handleUpdateBookingStatus(b.id, "confirmed")}
                        >
                          Accept
                        </button>
                        <button 
                          className="sw-btn-ghost" 
                          style={{ padding: "6px 14px", fontSize: 12 }}
                          onClick={() => handleUpdateBookingStatus(b.id, "cancelled")}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Past */}
      {tab === "past" && (
        <div className="sw-card">
          <div className="sw-card-inner" style={{ padding: "8px 0" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--sw-text-muted)" }}>
                Loading bookings...
              </div>
            ) : bookings.filter((b) => b.status === "completed").length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--sw-text-muted)" }}>
                No completed sessions yet
              </div>
            ) : (
              bookings
                .filter((b) => b.status === "completed")
                .map((b) => {
                  const dateInfo = formatDate(b.scheduled_at);
                  const partnerName = b.mentor_name || b.student_name || "Partner";
                  
                  return (
                    <div className="sw-booking-item" key={b.id} style={{ padding: "18px 24px" }}>
                      <div className="sw-booking-date">
                        <div className="sw-booking-day">{dateInfo.day}</div>
                        <div className="sw-booking-mon">{dateInfo.mon}</div>
                      </div>
                      <Avatar booking={b} />
                      <div className="sw-booking-info">
                        <div className="sw-booking-title">{b.skill_topic}</div>
                        <div className="sw-booking-meta">
                          <Calendar size={11} />
                          Completed · with {partnerName}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 2, color: "#fbbf24" }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} style={{ opacity: i < 5 ? 1 : 0.2, fontSize: 14 }}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelConfirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "var(--sw-bg1)",
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "var(--sw-text1)" }}>
              Cancel Booking?
            </h3>
            <p style={{ color: "var(--sw-text3)", marginBottom: 20, fontSize: 14 }}>
              Are you sure you want to cancel this booking? Your partner will receive a cancellation request and must agree to confirm.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setCancelConfirmModal(null)}
                disabled={processingId}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid var(--sw-border)",
                  background: "transparent",
                  color: "var(--sw-text1)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestCancellation(cancelConfirmModal)}
                disabled={processingId}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--sw-red)",
                  color: "#fff",
                  cursor: processingId ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  opacity: processingId ? 0.7 : 1,
                }}
              >
                {processingId ? "Sending..." : "Request Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
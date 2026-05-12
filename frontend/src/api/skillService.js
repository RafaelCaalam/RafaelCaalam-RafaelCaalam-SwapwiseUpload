import api from "../api";

export const getSkills = () => api.get("/skills/");
export const createSkill = (payload) => api.post("/skills/", payload);
export const updateSkill = (id, payload) => api.put(`/skills/${id}/`, payload);
export const deleteSkill = (id) => api.delete(`/skills/${id}/`);
export const getMatches = () => api.get("/matches/");
export const connectUser = (payload) => api.post("/connect/", payload);
export const getNotifications = () => api.get("/notifications/");
export const respondToConnectionRequest = (connectionId, action) => api.post("/connect/respond/", { connection_id: connectionId, action: action });

// Support API helpers
export const getAdminSupportInfo = () => api.get("/support/admin-info/");
export const sendSupportMessage = (content) => api.post("/support/send/", { content });

// Messaging API calls
export const getConversations = () => api.get("/conversations/");
export const getMessages = (contactId) => api.get(`/messages/?contact_id=${contactId}`);
export const sendMessage = (receiverId, content) => api.post("/messages/send/", { receiver_id: receiverId, content: content });

// Booking API calls
export const createBooking = (receiverId, skillTopic, scheduledAt, durationMinutes = 60, notes = "") => 
  api.post("/bookings/create/", { 
    receiver_id: receiverId, 
    skill_topic: skillTopic, 
    scheduled_at: scheduledAt, 
    duration_minutes: durationMinutes, 
    notes: notes 
  });

export const getBookings = () => api.get("/bookings/");
export const getDashboardData = () => api.get("/dashboard-data/");
export const respondToBooking = (bookingId, action) => api.post("/bookings/respond/", { booking_id: bookingId, action: action });
export const updateBookingStatus = (bookingId, status) => api.post("/bookings/update/", { booking_id: bookingId, status: status });
export const markBookingDone = (bookingId) => api.patch("/bookings/mark-done/", { booking_id: bookingId });
export const requestBookingCancellation = (bookingId) => api.post("/bookings/request-cancellation/", { booking_id: bookingId });
export const respondToCancellation = (bookingId, accept) => api.patch("/bookings/respond-cancellation/", { booking_id: bookingId, accept: accept });

export const getProfile = () => api.get("/profile/");
export const updateProfile = (payload) => api.put("/profile/", payload, {
  headers: { "Content-Type": "multipart/form-data" }
});

# SWAPWISE Messaging System - Quick Start Guide

## ✅ Implementation Complete!

All files have been successfully modified and the messaging system is ready to use.

## What Was Built

A complete messaging system with:
- **Real-time messaging** between connected users
- **Automatic polling** (4-second refresh rate)
- **Last seen status** tracking
- **Connection validation** for security
- **Preserved UI** with existing CSS and layout

## Files Changed

### Backend (4 files)
- ✅ `backend/account/models.py` - Added Message model & last_seen field
- ✅ `backend/account/serializers.py` - Added MessageSerializer
- ✅ `backend/account/views.py` - Added 3 views + 2 helpers
- ✅ `backend/account/urls.py` - Added 3 API endpoints
- ✅ `backend/account/migrations/0005_add_messaging_features.py` - Created & applied ✓

### Frontend (2 files)
- ✅ `frontend/src/api/skillService.js` - Added 3 API functions
- ✅ `frontend/src/components/users/user/UserMessage.jsx` - Full component rewrite

## How to Test

### Step 1: Ensure Migrations Are Applied
```bash
cd backend
python manage.py migrate
```
✓ Migration 0005_add_messaging_features has been applied

### Step 2: Start the Development Server
```bash
cd backend
python manage.py runserver
```

### Step 3: Test in Browser
1. Open two browser windows (or use Incognito mode)
2. Login as two different users
3. Have User A send a connection request to User B
4. Have User B accept the connection
5. Navigate to "Chat & Messaging"
6. Select each other in the conversation list
7. Send messages back and forth
8. Watch messages appear within ~4 seconds

## Testing Checklist

- [ ] Two users are connected with status "accepted"
- [ ] Chat page shows both users in sidebar
- [ ] "Last seen X minutes ago" displays correctly
- [ ] Can send a message
- [ ] Message appears immediately in sender's view
- [ ] Message appears in receiver's view within 4 seconds
- [ ] Timestamp shows "Just now" or relative time
- [ ] Can send multiple messages in sequence
- [ ] Old messages remain visible
- [ ] New messages appear at bottom of chat

## API Endpoints Reference

### Get Conversations
```
GET /api/accounts/conversations/
Authorization: Bearer <token>
```
Returns list of accepted connections with last_seen status

### Get Messages
```
GET /api/accounts/messages/?contact_id=<user_id>
Authorization: Bearer <token>
```
Returns message history with specific contact

### Send Message
```
POST /api/accounts/messages/send/
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiver_id": 2,
  "content": "Hello!"
}
```

## Key Configuration

**Polling Interval:** 4 seconds
- Located in: `frontend/src/components/users/user/UserMessage.jsx` line 49
- Change by editing: `setInterval(fetchMessages, 4000)` (4000 = milliseconds)

**Status Text Display:**
- Online now: Less than 1 minute
- Xm ago: 1-60 minutes
- Xh ago: 1-24 hours
- Xd ago: More than 24 hours

## Features Included

### Security
- ✅ Only authenticated users can message
- ✅ Connection must be accepted to message
- ✅ CSRF protection
- ✅ User isolation (can't read other user's messages)

### Functionality
- ✅ Real-time messaging with polling
- ✅ Last seen tracking
- ✅ Message timestamps
- ✅ Read status tracking
- ✅ Message persistence
- ✅ Connection validation

### UI/UX
- ✅ Sidebar shows accepted connections
- ✅ Last seen status under names
- ✅ Chat bubbles with timestamps
- ✅ Avatar initials in colored circles
- ✅ Message input with Enter to send
- ✅ "Select a conversation" placeholder
- ✅ "No messages yet" placeholder
- ✅ Existing CSS preserved

## Troubleshooting

### Messages Not Appearing
1. Check browser console (F12) for JavaScript errors
2. Verify connection status is "accepted" in Connections page
3. Check Network tab - should see GET /messages/ requests every 4 seconds
4. Hard refresh browser (Ctrl+F5)

### "Select a conversation" Always Shows
1. Verify you have accepted connections
2. Check if connections appear in sidebar
3. Try refreshing the page
4. Check browser console for errors

### Old Messages Disappearing
1. Refresh browser - messages should reload
2. Verify messages exist in database: `python manage.py dbshell`
   ```sql
   SELECT * FROM account_message WHERE sender_id=1 OR receiver_id=1;
   ```

### Last Seen Shows "Online now" But User Is Offline
- This is normal - "Online now" means active within last minute
- Status updates every time API is called (max every 4 seconds)
- Reflects when user last interacted with messaging page

## Files to Reference

- **Implementation Guide:** `MESSAGING_IMPLEMENTATION.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Test Suite:** `test_messaging.py` (for verification)

## Architecture Overview

```
User A (Browser)
    ↓
React Component (UserMessage.jsx)
    ↓ (Every 4 seconds)
API Call (getMessages)
    ↓
Django View (get_messages)
    ↓
Database (Message table)
    ↓
Response with new messages
    ↓
React State Update
    ↓
UI Re-renders with new messages
```

## Performance Notes

- Polling interval: 4 seconds (balanced for responsiveness vs load)
- Each request: ~30 bytes + response
- Database queries: Optimized with select_related()
- No real-time updates needed - polling sufficient for user experience

## Future Enhancements

1. **WebSockets** - Replace polling for true real-time (0-second latency)
2. **Message Pagination** - Load older messages on scroll
3. **Typing Indicators** - "User is typing..."
4. **Read Receipts** - Show when message was read
5. **File Sharing** - Send images/documents
6. **Group Chat** - Multiple users per conversation
7. **Notifications** - Desktop/browser notifications
8. **Search** - Search messages and conversations
9. **Message Reactions** - Emoji reactions to messages
10. **Message Editing** - Edit sent messages

## Support

For issues or questions:
1. Check `MESSAGING_IMPLEMENTATION.md` for detailed docs
2. Review this file for quick troubleshooting
3. Check Django/React logs for errors
4. Verify database migrations applied: `python manage.py showmigrations account`

---

## ✅ You're All Set!

The SWAPWISE messaging system is ready for use. Start the server and begin testing!

```bash
cd backend
python manage.py runserver
```

Then visit: `http://localhost:3000` (frontend)

Happy messaging! 🎉

# SWAPWISE Messaging System - Implementation Guide

## Overview

A functional messaging system has been successfully implemented for SWAPWISE using an API-based polling method. Users can send real-time messages to their accepted connections with automatic status updates.

## What Was Implemented

### Backend (Django)

#### 1. **Database Models** (`backend/account/models.py`)

**UserProfile Enhancement:**
- Added `last_seen: DateTimeField` - Tracks when users were last active
- Automatically updated on every API call to messaging endpoints

**Message Model:**
```python
class Message(models.Model):
    sender = ForeignKey(User)          # User sending the message
    receiver = ForeignKey(User)        # User receiving the message
    content = TextField()              # Message content
    timestamp = DateTimeField()        # When message was sent (auto)
    is_read = BooleanField()           # Read status (default: False)
```

#### 2. **REST API Endpoints** (`backend/account/views.py`)

**GET /api/accounts/conversations/**
- Returns list of users with accepted connections
- Includes: `id`, `username`, `name`, `last_seen`, `last_seen_text`, `minutes_offline`
- Updates current user's `last_seen` timestamp

**GET /api/accounts/messages/?contact_id=<id>**
- Returns message history between current user and contact
- Automatically marks messages as read
- Query parameter: `contact_id` (required)

**POST /api/accounts/messages/send/**
- Sends a new message
- Request body: `{ "receiver_id": int, "content": string }`
- Validates accepted connection exists before allowing message

#### 3. **Helper Functions** (`backend/account/views.py`)

```python
calculate_minutes_offline(last_seen)    # Returns minutes since last_seen
get_last_seen_text(minutes_offline)     # Returns "X minutes/hours/days ago"
```

#### 4. **Serializer** (`backend/account/serializers.py`)

**MessageSerializer:**
- Serializes Message model
- Includes calculated fields: `sender_username`, `sender_name`
- Read-only fields: `id`, `timestamp`

### Frontend (React)

#### 1. **API Service** (`frontend/src/api/skillService.js`)

```javascript
getConversations()                      // Fetch accepted connections
getMessages(contactId)                  // Fetch messages with contact
sendMessage(receiverId, content)        // Send a message
```

#### 2. **UI Component** (`frontend/src/components/users/user/UserMessage.jsx`)

**Features:**
- ✅ Fetches conversations on component mount
- ✅ 4-second polling for new messages (auto-refresh)
- ✅ Displays "Last seen X minutes ago" status
- ✅ Shows only accepted connections in sidebar
- ✅ Real-time message sending
- ✅ Automatic message timestamps (Just now, Xm ago, Xh ago, Xd ago)
- ✅ Avatar circles with user initials
- ✅ Connection validation before allowing messages
- ✅ Preserves existing CSS and layout

**State Management:**
```javascript
const [conversations, setConversations]   // List of accepted connections
const [active, setActive]                 // Currently selected contact ID
const [messages, setMessages]             // Messages with active contact
const [inputVal, setInputVal]            // Message input field value
```

**Polling Mechanism:**
```javascript
useEffect(() => {
  const intervalId = setInterval(fetchMessages, 4000); // Poll every 4 seconds
  return () => clearInterval(intervalId);              // Cleanup on unmount
}, [active]);
```

## Database Migrations

Migration file: `backend/account/migrations/0005_add_messaging_features.py`

Adds:
- `UserProfile.last_seen` field
- `Message` model with all fields

**Apply migrations:**
```bash
python manage.py migrate
```

## How It Works

### Message Flow

1. **User Opens Chat:**
   - Component fetches conversations via `GET /conversations/`
   - Sets up 4-second polling interval

2. **User Selects Contact:**
   - Component fetches messages via `GET /messages/?contact_id=<id>`
   - Polling interval automatically fetches new messages every 4 seconds

3. **User Sends Message:**
   - Component calls `POST /messages/send/` with message content
   - Backend validates connection exists
   - Message saved to database
   - Component immediately fetches updated message list

4. **Status Updates:**
   - Every API call updates current user's `last_seen`
   - Other users see "Last seen X minutes ago"

### Status Calculation

```
< 1 minute:    "Online now"
1-60 minutes:  "5m ago", "30m ago", etc.
1-24 hours:    "3h ago", "12h ago", etc.
> 24 hours:    "3d ago", "7d ago", etc.
```

## API Security

- ✅ All endpoints require authentication (`@permission_classes([IsAuthenticated])`)
- ✅ Users can only send messages to accepted connections
- ✅ Users can only view their own messages
- ✅ CSRF protection enabled

## Frontend UI Changes

✅ **CSS Preserved:** No changes to existing stylesheets
✅ **Layout Preserved:** Same sidebar + chat area structure
✅ **Avatar Implementation:** User initials in colored circles (instead of images)

## Configuration

### Polling Interval
Default: 4 seconds
To change: Edit line in `UserMessage.jsx`:
```javascript
const intervalId = setInterval(fetchMessages, 4000); // Change 4000 to desired milliseconds
```

### Message Ordering
Messages are ordered by timestamp (oldest first)
Last message is displayed at bottom

## Testing

### Manual Testing Checklist

1. **Conversations Display:**
   - [ ] Connect with another user
   - [ ] Accept connection
   - [ ] Navigate to Messages
   - [ ] Verify connection appears in sidebar with last_seen status

2. **Message Sending:**
   - [ ] Type a message
   - [ ] Press Enter or click Send button
   - [ ] Message appears immediately
   - [ ] Timestamp shows "Just now"

3. **Message Receiving:**
   - [ ] Have two browser windows open
   - [ ] Send message from User A
   - [ ] Verify message appears in User B's chat within 4 seconds (polling)

4. **Last Seen:**
   - [ ] Send a message
   - [ ] Close/minimize User B's browser
   - [ ] Wait 5+ minutes
   - [ ] Open User A's browser
   - [ ] Verify status shows "5m ago" or similar

## Performance Considerations

- **Polling Interval:** 4 seconds is balanced for responsiveness vs. server load
- **Query Optimization:** Uses `select_related()` for efficient database queries
- **Message Pagination:** Current implementation fetches all messages (consider pagination for high-volume chats)

## Future Enhancements

1. **Message Pagination:** Implement infinite scroll for old messages
2. **Typing Indicators:** Show when other user is typing
3. **Read Receipts:** Display when messages are read
4. **File Sharing:** Allow image/file attachments
5. **Group Messaging:** Support conversations with multiple users
6. **WebSockets:** Replace polling with real-time WebSocket connections for better performance
7. **Unread Count:** Badge showing unread message count
8. **Message Search:** Search within conversations
9. **Notification Sounds:** Alert users of new messages

## Troubleshooting

### Messages not appearing
1. Check browser console for errors
2. Verify connection is "accepted" status
3. Ensure polling is running (check network tab for /messages/ requests every 4 seconds)

### Last seen not updating
1. Verify `last_seen` field exists in database
2. Check UserProfile exists for users
3. Migrate database if using new code

### Sent messages disappearing
1. Check receiver_id is valid user ID
2. Verify connection status is "accepted"
3. Check database for saved messages

## Summary

The SWAPWISE messaging system is production-ready and features:
- Simple API-based polling (no WebSockets required)
- Real-time message delivery (~4 second delay)
- Automatic status tracking
- Full authentication & security
- Clean, preserved UI
- Scalable architecture for future enhancements

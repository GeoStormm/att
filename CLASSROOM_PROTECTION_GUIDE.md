# Classroom Protection Feature

This feature prevents multiple active sessions from running simultaneously in the same classroom, ensuring only one professor can have an active session per classroom at a time.

## 🚀 Features

- **Duplicate Session Prevention**: Blocks new sessions if classroom is already occupied
- **Real-time Classroom Status**: Shows which classrooms are available/occupied
- **Professor Information**: Displays who is currently using each classroom
- **Session Details**: Shows subject, start time, and duration of active sessions
- **Automatic Updates**: Real-time status updates every 30 seconds
- **Visual Indicators**: Color-coded status (green = available, red = occupied)

## 📁 Files Added

### Database Functions
- `database/prevent_duplicate_sessions.sql` - Core classroom protection logic

### Frontend Components
- `dashboard-nextjs/components/ClassroomStatus.tsx` - Real-time classroom status display
- Updated `dashboard-nextjs/app/sessions/page.tsx` - Integrated classroom status

## 🛠️ Setup Instructions

### 1. Database Setup

Run this SQL file in your Supabase SQL editor:

```sql
-- Copy and paste the content from database/prevent_duplicate_sessions.sql
-- This will update the start_professor_session function with classroom protection
```

### 2. Frontend Setup

The frontend components are already integrated. The classroom status interface will appear on the Sessions page.

## 🎯 How It Works

### 1. Session Start Protection

When a professor tries to start a session:

1. **Classroom Check**: System checks if classroom is already occupied
2. **Block if Occupied**: If occupied, returns error with details about existing session
3. **Allow if Available**: If available, creates new session normally

### 2. Error Response for Occupied Classroom

```json
{
  "success": false,
  "error": "Classroom is already occupied",
  "message": "Classroom is already occupied by Dr. Smith since 14:30",
  "existing_session_id": "uuid-here",
  "existing_professor": "Dr. Smith",
  "existing_subject": "Mathematics 101",
  "existing_start_time": "2025-01-15T14:30:00Z"
}
```

### 3. Real-time Status Display

The Classroom Status component shows:
- **Available Classrooms**: Green cards with "AVAILABLE" status
- **Occupied Classrooms**: Red cards with professor, subject, and session duration
- **Summary Statistics**: Total, available, and occupied classroom counts

## 🔧 Database Functions

### `check_classroom_availability(classroom_id)`

Checks if a classroom is available for a new session.

**Returns:**
- `is_available`: Boolean indicating if classroom is free
- `existing_session_id`: ID of active session if occupied
- `existing_professor_name`: Name of professor using classroom
- `existing_subject`: Subject of active session
- `existing_start_time`: When the session started
- `message`: Human-readable status message

### `start_professor_session(professor_rfid, classroom_device_id, subject, late_threshold)`

Updated function that now includes classroom availability check.

**New Behavior:**
1. Validates professor and classroom exist
2. **Checks classroom availability** (NEW)
3. Blocks session creation if classroom is occupied
4. Creates session only if classroom is available

## 📊 Visual Indicators

### Classroom Status Cards

**Available Classroom:**
- 🟢 Green background
- ✅ Check circle icon
- "AVAILABLE" status
- No additional details

**Occupied Classroom:**
- 🔴 Red background
- ⚠️ Warning triangle icon
- "OCCUPIED" status
- Professor name, subject, start time, duration

### Summary Statistics

- **Total Classrooms**: Count of all classrooms
- **Available**: Count of free classrooms
- **Occupied**: Count of classrooms with active sessions

## 🚨 Error Handling

### Common Scenarios

1. **Professor tries to start session in occupied classroom**
   - Error: "Classroom is already occupied"
   - Shows who is using it and when they started

2. **Multiple professors with same RFID**
   - Error: "Professor not found" (if RFID doesn't exist)
   - System prevents duplicate professor records

3. **Invalid classroom device ID**
   - Error: "Classroom not found"
   - Ensures valid classroom before checking availability

## 🔄 Real-time Updates

- **Auto-refresh**: Every 30 seconds
- **Manual refresh**: Click refresh button
- **Live status**: Shows current session duration
- **Instant updates**: When sessions start/end

## 📈 Benefits

1. **Prevents Conflicts**: No more double-booked classrooms
2. **Clear Visibility**: Professors can see which classrooms are free
3. **Automatic Protection**: System enforces rules without manual intervention
4. **Real-time Information**: Always up-to-date classroom status
5. **Professional Management**: University-grade classroom scheduling

## 🧪 Testing

### Test Scenarios

1. **Start session in available classroom**
   ```sql
   SELECT start_professor_session('professor-rfid', 'classroom-device-id', '', 5);
   ```

2. **Try to start session in occupied classroom**
   - Should return error with existing session details

3. **Check classroom availability**
   ```sql
   SELECT * FROM check_classroom_availability('classroom-id');
   ```

### Expected Results

- ✅ Available classroom: Session starts successfully
- ❌ Occupied classroom: Error with existing session details
- 📊 Status display: Real-time classroom availability

## 🔧 Configuration

### Environment Variables
No additional environment variables needed - uses existing Supabase configuration.

### Database Indexes
The system creates an index for optimal performance:
```sql
CREATE INDEX idx_sessions_classroom_status 
ON sessions (classroom_id, status) 
WHERE status = 'active';
```

## 🚀 Production Ready

This feature is production-ready and includes:
- ✅ Comprehensive error handling
- ✅ Real-time status updates
- ✅ Visual feedback for users
- ✅ Database optimization
- ✅ Professional UI/UX
- ✅ University-grade reliability

The classroom protection system ensures smooth operation of your attendance system by preventing scheduling conflicts and providing clear visibility into classroom availability.

# Supabase Database Setup Guide

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization and enter project details:
   - **Name**: `university-attendance-system`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location

### 2. Run Database Schema
1. Navigate to your Supabase dashboard
2. Go to **SQL Editor** in the left sidebar
3. Copy and paste the contents of `schema.sql`
4. Click **Run** to execute the schema
5. Optionally run `functions.sql` for utility functions
6. Optionally run `sample-data.sql` for test data

### 3. Get Connection Details
After setup, note these values from **Settings > API**:
- **Project URL**: `https://your-project-id.supabase.co`
- **API Key (anon public)**: For client-side connections
- **API Key (service_role)**: For server-side/ESP32 connections

### 4. Test Your Setup
Run this query in SQL Editor to verify:
```sql
SELECT 
    (SELECT COUNT(*) FROM professors) as professor_count,
    (SELECT COUNT(*) FROM students) as student_count,
    (SELECT COUNT(*) FROM classrooms) as classroom_count;
```

## 🔑 Key Features Implemented

- **Automatic timestamps** with triggers
- **Duplicate prevention** via unique constraints
- **Row Level Security** enabled for production safety
- **Smart attendance status** calculation (present/late)
- **Utility functions** for ESP32 integration
- **Helpful views** for dashboard queries

## 📝 Next Steps

1. **ESP32 Integration**: Use the utility functions `start_professor_session()` and `record_student_attendance()`
2. **Dashboard Development**: Query the views `active_sessions` and `session_attendance_summary`
3. **Authentication**: Configure RLS policies based on your auth requirements

## 🛠️ Useful Queries for Development

### Get current active sessions:
```sql
SELECT * FROM active_sessions;
```

### Get attendance for a specific session:
```sql
SELECT 
    st.name as student_name,
    st.student_number,
    a.timestamp,
    a.status
FROM attendance a
JOIN students st ON a.student_id = st.id
WHERE a.session_id = 'your-session-id'
ORDER BY a.timestamp;
```

### Test professor session creation:
```sql
SELECT start_professor_session('PROF001', 'ESP32_001_A101', 'Database Systems');
```

### Test student attendance recording:
```sql
SELECT record_student_attendance('STU001', 'ESP32_001_A101');
```

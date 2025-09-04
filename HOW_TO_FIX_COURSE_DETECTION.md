# 🎯 How to Fix Course Detection in Your Attendance System

## **❌ The Problem**
Your system is showing "Class Session" instead of the actual course name because:
1. **No timetable entries exist** for the current time/day
2. **Day of week mismatch** (timetable shows Monday but you're starting session on Tuesday)
3. **Time mismatch** (timetable shows 9:00 AM but you're starting at 2:00 PM)
4. **Missing enrollments** (students aren't enrolled in the course)

## **🔧 Step-by-Step Fix**

### **Step 1: Run the SQL Fix in Supabase**
1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `database/fix_course_detection.sql`
3. **Click "Run"** to update your functions

### **Step 2: Check Your Current Setup**
Run this query to see what you have:

```sql
-- Check current system state
SELECT 
    'Current System State' as info,
    extract(dow from now()) as current_day_number,
    CASE extract(dow from now())
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as current_day_name,
    now()::time as current_time,
    now() as current_timestamp;

-- Check what timetable entries exist
SELECT 
    te.day_of_week,
    CASE te.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    te.start_time,
    te.end_time,
    c.name as course_name,
    p.name as professor_name,
    cl.name as classroom_name
FROM timetable_entries te
JOIN courses c ON te.course_id = c.id
JOIN professors p ON te.professor_id = p.id
JOIN classrooms cl ON te.classroom_id = cl.id
ORDER BY te.day_of_week, te.start_time;
```

### **Step 3: Create a Proper Timetable Entry**
**IMPORTANT**: Create an entry for **RIGHT NOW** (current day and time):

1. **Go to Timetable page** (`/timetable`)
2. **Check the current day** (Monday=1, Tuesday=2, etc.)
3. **Create a timetable entry**:
   - **Day**: Current day (e.g., if today is Tuesday, select "2")
   - **Start Time**: Current time or slightly before (e.g., if it's 2:30 PM, set 2:00 PM)
   - **End Time**: Current time + 1 hour (e.g., 3:00 PM)
   - **Course**: Select an existing course
   - **Professor**: Select your professor
   - **Classroom**: Select your classroom
4. **Click "Add Timetable Entry"**

### **Step 4: Enroll Students**
1. **Go to Courses page** (`/courses`)
2. **Click "Manage Enrollments"**
3. **Select your course** from dropdown
4. **Enroll students**:
   - Select student from dropdown
   - Click "Enroll"
   - Repeat for all students

### **Step 5: Test the System**
1. **Start a session** with your ESP32
2. **Check the serial monitor** - it should now show the correct course name
3. **Check the Sessions page** - subject should show the actual course, not "Class Session"

## **🔍 Debugging Tools**

### **Use the Debug Function**
If it still doesn't work, use this function to see what's happening:

```sql
-- Replace with your actual RFID and device ID
SELECT debug_timetable_detection('your_professor_rfid', 'your_classroom_device_id');
```

### **Check ESP32 Serial Monitor**
The ESP32 should now show:
- ✅ **Course found**: "Subject: [Course Name]"
- ❌ **Course not found**: "Subject: Class Session" + debug info

## **📋 Common Issues & Solutions**

### **Issue 1: "No timetable entries found"**
**Solution**: Create timetable entries for the current day and time

### **Issue 2: "Day of week mismatch"**
**Solution**: 
- Monday = 1, Tuesday = 2, Wednesday = 3, etc.
- Sunday = 0, Saturday = 6
- Make sure your timetable entry matches the current day

### **Issue 3: "Time mismatch"**
**Solution**: 
- The system has a 30-minute buffer
- If your timetable shows 9:00-10:00 AM, you can start a session between 8:30-10:30 AM
- Create entries for realistic times

### **Issue 4: "No enrollments"**
**Solution**: 
- Students must be enrolled in the course
- Use the "Manage Enrollments" feature

## **✅ Success Checklist**

- [ ] SQL functions updated in Supabase
- [ ] Timetable entry exists for current day/time
- [ ] Students enrolled in the course
- [ ] ESP32 shows correct course name
- [ ] Sessions page shows correct subject
- [ ] Session roster populated with enrolled students

## **🚀 Quick Test**

1. **Create a timetable entry** for right now
2. **Enroll 2-3 students** in that course
3. **Start a session** with ESP32
4. **Check**: Course name should appear instead of "Class Session"

## **💡 Pro Tips**

- **Always set up timetable first** before testing sessions
- **Use realistic times** (avoid 23:00-00:00)
- **Check the ESP32 serial monitor** for debug info
- **The system has a 30-minute buffer** around scheduled times
- **Day numbers start from 0** (Sunday=0, Monday=1)

## **🆘 Still Not Working?**

If you still see "Class Session", run this debug query:

```sql
-- Check everything at once
SELECT 
    'PROBLEM DIAGNOSIS' as section,
    p.name as professor_name,
    p.rfid_tag,
    c.name as classroom_name,
    c.esp32_device_id,
    extract(dow from now()) as current_day,
    now()::time as current_time,
    COUNT(te.id) as timetable_entries_today,
    COUNT(ce.id) as total_enrollments
FROM professors p
CROSS JOIN classrooms c
LEFT JOIN timetable_entries te ON te.professor_id = p.id 
    AND te.classroom_id = c.id 
    AND te.day_of_week = extract(dow from now())
LEFT JOIN course_enrollments ce ON ce.course_id = te.course_id
WHERE p.rfid_tag = 'your_professor_rfid'  -- Replace with actual RFID
    AND c.esp32_device_id = 'your_device_id'  -- Replace with actual device ID
GROUP BY p.id, p.name, p.rfid_tag, c.id, c.name, c.esp32_device_id;
```

This will show you exactly what's missing! 🎯

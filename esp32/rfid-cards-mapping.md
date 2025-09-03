# RFID Cards Mapping for Testing

## 📋 Test Cards Configuration

To test your system, you'll need to map physical RFID card IDs to the sample data in your database.

### 🎓 Professor Cards
Map these RFID tags to professors in your database:

```sql
-- Update professors table with your actual RFID card IDs
UPDATE professors SET rfid_tag = 'YOUR_CARD_ID_1' WHERE name = 'Dr. John Smith';
UPDATE professors SET rfid_tag = 'YOUR_CARD_ID_2' WHERE name = 'Prof. Sarah Johnson';
UPDATE professors SET rfid_tag = 'YOUR_CARD_ID_3' WHERE name = 'Dr. Michael Brown';
```

### 👨‍🎓 Student Cards
Map these RFID tags to students in your database:

```sql
-- Update students table with your actual RFID card IDs
UPDATE students SET rfid_tag = 'YOUR_CARD_ID_4' WHERE name = 'Alice Cooper';
UPDATE students SET rfid_tag = 'YOUR_CARD_ID_5' WHERE name = 'Bob Wilson';
UPDATE students SET rfid_tag = 'YOUR_CARD_ID_6' WHERE name = 'Charlie Davis';
UPDATE students SET rfid_tag = 'YOUR_CARD_ID_7' WHERE name = 'Diana Miller';
UPDATE students SET rfid_tag = 'YOUR_CARD_ID_8' WHERE name = 'Eva Garcia';
```

## 🔍 How to Get Your RFID Card IDs

1. **Upload the ESP32 code** to your device
2. **Open Serial Monitor** (115200 baud)
3. **Scan each RFID card** - the ID will be displayed
4. **Note down the IDs** (format: `A1B2C3D4`)
5. **Update your database** using the SQL commands above

## 📝 Testing Workflow

### Test Professor Session Creation:
1. **Scan professor card** → Should create new session
2. **Check Serial Monitor** → Should show "Professor session started"
3. **Verify in Supabase** → Check sessions table for new entry

### Test Student Attendance:
1. **Ensure active session exists** (scan professor card first)
2. **Scan student card** → Should record attendance
3. **Check Serial Monitor** → Should show student name and status
4. **Verify in Supabase** → Check attendance table for new record

## 🎯 Expected Behavior

**Professor Scan:**
- ✅ Creates new session in classroom
- ✅ Ends any previous active sessions
- ✅ Green LED + success beep
- ✅ Serial: "Professor: [Name], Classroom: [Room]"

**Student Scan (with active session):**
- ✅ Records attendance with timestamp
- ✅ Shows "present" or "late" status
- ✅ Green LED + success beep
- ✅ Serial: "Student: [Name], Status: [present/late]"

**Unknown Card:**
- ❌ Red LED + error beeps
- ❌ Serial: "RFID tag not recognized"

**Duplicate Student Scan:**
- ❌ Red LED + error beeps  
- ❌ Serial: "Student already recorded for this session"

## 🔧 Quick Database Updates

Run this in Supabase SQL Editor to quickly update card mappings:

```sql
-- Replace 'ACTUAL_CARD_ID' with your scanned card IDs
UPDATE professors SET rfid_tag = 'PROF_CARD_1' WHERE email = 'john.smith@university.edu';
UPDATE students SET rfid_tag = 'STU_CARD_1' WHERE email = 'alice.cooper@student.university.edu';
```

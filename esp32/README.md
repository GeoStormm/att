# ESP32 RFID Attendance System

## 📁 Files Overview

- **`attendance_system.ino`** - Main Arduino sketch
- **`libraries.txt`** - Required Arduino libraries
- **`hardware-setup.md`** - Wiring and assembly guide
- **`rfid-cards-mapping.md`** - RFID card configuration guide

## 🚀 Quick Start

1. **Hardware Setup**: Follow `hardware-setup.md` for wiring
2. **Install Libraries**: See `libraries.txt` for required packages
3. **Upload Code**: Flash `attendance_system.ino` to ESP32
4. **Map RFID Cards**: Use `rfid-cards-mapping.md` to configure cards
5. **Test System**: Scan professor card → student cards

## 🔧 Key Features

- **Automatic WiFi Connection** using your network credentials
- **Professor Session Management** - scan to start/end classes
- **Student Attendance Tracking** - automatic present/late detection
- **Duplicate Prevention** - prevents multiple scans per session
- **Visual/Audio Feedback** - LEDs and buzzer for status
- **Real-time Supabase Integration** - instant database updates

## 📡 API Integration

The ESP32 uses Supabase REST API with these functions:
- `start_professor_session()` - Creates new class session
- `record_student_attendance()` - Logs student attendance

## 🎯 System Flow

1. **Professor arrives** → Scans RFID → Creates session
2. **Students arrive** → Scan RFID → Attendance recorded
3. **Late students** → Automatically marked as "late"
4. **Dashboard** → Real-time attendance viewing

## 🔍 Monitoring

Use Arduino Serial Monitor (115200 baud) to see:
- WiFi connection status
- RFID scan results
- Supabase API responses
- Error messages and debugging info

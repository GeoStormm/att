# University Classroom Attendance System

A comprehensive attendance tracking system using ESP32, RFID readers, and Supabase backend.

## 📋 Project Overview

- **Hardware**: ESP32 microcontroller with RFID reader per classroom
- **Backend**: Supabase database with REST API
- **Frontend**: React dashboard for attendance management
- **Authentication**: RFID card scanning for professors and students

## 🏗️ System Architecture

1. **Professor Flow**: Scan RFID → Create new session
2. **Student Flow**: Scan RFID → Log attendance to active session
3. **Dashboard**: View and manage attendance data

## 📊 Database Schema

See `database/schema.sql` for the complete Supabase schema definition.

## 🚀 Getting Started

1. Set up Supabase project and run schema
2. Configure ESP32 with RFID reader
3. Deploy React dashboard
4. Test end-to-end flow

## 📁 Project Structure

```
├── database/           # Supabase schema and migrations
├── esp32/             # Arduino/ESP32 code
├── dashboard/         # React web application
└── docs/              # Documentation and guides
```

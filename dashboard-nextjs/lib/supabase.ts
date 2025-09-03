import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://putjlurgkhdmdwhepgqq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpsdXJna2hkbWR3aGVwZ3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjU4OTQsImV4cCI6MjA3MjMwMTg5NH0.XX5_y8XRpWkjDLhHxgoM9AzpVkyPvL1fiNSrMwSB70g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Professor {
  id: string
  name: string
  rfid_tag: string
  email: string
  department: string
  timetable: any
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  name: string
  rfid_tag: string
  student_number: string
  email: string
  year_of_study: number
  program: string
  created_at: string
  updated_at: string
}

export interface Classroom {
  id: string
  name: string
  building: string
  floor: number
  capacity: number
  esp32_device_id: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  professor_id: string
  classroom_id: string
  subject: string
  start_time: string
  end_time: string | null
  late_threshold_minutes: number
  status: 'active' | 'ended' | 'cancelled'
  created_at: string
  updated_at: string
  professor?: Professor
  classroom?: Classroom
}

export interface Attendance {
  id: string
  session_id: string
  student_id: string
  timestamp: string
  status: 'present' | 'late' | 'absent'
  created_at: string
  student?: Student
  session?: Session
}

export interface ActiveSession {
  id: string
  subject: string
  start_time: string
  late_threshold_minutes: number
  professor_name: string
  professor_email: string
  professor_department?: string
  classroom_name: string
  building: string
  esp32_device_id: string
}

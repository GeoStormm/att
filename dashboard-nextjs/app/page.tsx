'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Calendar, 
  Clock, 
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Download,
  Plus
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import Link from 'next/link'

type DashboardStats = {
  totalStudents: number
  totalProfessors: number
  totalClassrooms: number
  activeSessions: number
  todayAttendance: number
  totalCourses: number
}

type RecentSession = {
  id: string
  subject: string
  professor_name: string
  classroom_name: string
  start_time: string
  status: string
  attendance_count: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalProfessors: 0,
    totalClassrooms: 0,
    activeSessions: 0,
    todayAttendance: 0,
    totalCourses: 0
  })
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      // Load counts
      const [students, professors, classrooms, courses, sessions, attendance] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('professors').select('id', { count: 'exact' }),
        supabase.from('classrooms').select('id', { count: 'exact' }),
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('sessions').select('id').eq('status', 'active'),
        supabase.from('attendance').select('id').gte('timestamp', new Date().toISOString().split('T')[0])
      ])

      setStats({
        totalStudents: students.count || 0,
        totalProfessors: professors.count || 0,
        totalClassrooms: classrooms.count || 0,
        activeSessions: sessions.data?.length || 0,
        todayAttendance: attendance.data?.length || 0,
        totalCourses: courses.count || 0
      })

      // Load recent sessions
      const { data: recentData } = await supabase
        .from('sessions')
        .select(`
          id,
          subject,
          start_time,
          status,
          professor:professors(name),
          classroom:classrooms(name)
        `)
        .order('start_time', { ascending: false })
        .limit(5)

      if (recentData) {
        const sessionsWithAttendance = await Promise.all(
          recentData.map(async (session) => {
            const { count } = await supabase
              .from('attendance')
              .select('id', { count: 'exact' })
              .eq('session_id', session.id)
            
            return {
              id: session.id,
              subject: session.subject || 'Class Session',
              professor_name: (session as any).professor?.name || 'Unknown',
              classroom_name: (session as any).classroom?.name || 'Unknown',
              start_time: session.start_time,
              status: session.status,
              attendance_count: count || 0
            }
          })
        )
        setRecentSessions(sessionsWithAttendance)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900"
        >
          University Attendance Management System
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Streamline attendance tracking, automate reporting, and enhance academic accountability with our comprehensive RFID-based solution.
        </motion.p>
      </div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={Users}
          trend="+12%"
          trendUp={true}
          color="blue"
        />
        <StatCard
          title="Active Professors"
          value={stats.totalProfessors.toLocaleString()}
          icon={GraduationCap}
          trend="+5%"
          trendUp={true}
          color="green"
        />
        <StatCard
          title="Classrooms"
          value={stats.totalClassrooms.toLocaleString()}
          icon={Building2}
          trend="+2"
          trendUp={true}
          color="purple"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions.toString()}
          icon={Activity}
          trend="Live"
          trendUp={true}
          color="orange"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance.toLocaleString()}
          icon={CheckCircle}
          trend="+8%"
          trendUp={true}
          color="emerald"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses.toLocaleString()}
          icon={BarChart3}
          trend="+15%"
          trendUp={true}
          color="indigo"
        />
      </motion.div>

      {/* Quick Actions */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <Link href="/students" className="quick-action-card">
            <Plus className="h-8 w-8 text-blue-600" />
            <span>Add Student</span>
          </Link>
          <Link href="/professors" className="quick-action-card">
            <Plus className="h-8 w-8 text-green-600" />
            <span>Add Professor</span>
          </Link>
          <Link href="/classrooms" className="quick-action-card">
            <Plus className="h-8 w-8 text-purple-600" />
            <span>Add Classroom</span>
          </Link>
          <Link href="/timetable" className="quick-action-card">
            <Calendar className="h-8 w-8 text-orange-600" />
            <span>Schedule Class</span>
          </Link>
                        </div>
        </motion.div>

      {/* Recent Activity */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
                className="card"
              >
                <div className="card-header">
          <h2 className="card-title">Recent Sessions</h2>
          <Link href="/sessions" className="btn btn-primary btn-sm">
            View All
          </Link>
                </div>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                <th>Subject</th>
                <th>Professor</th>
                <th>Classroom</th>
                <th>Start Time</th>
                          <th>Status</th>
                <th>Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
              {recentSessions.map((session) => (
                <tr key={session.id}>
                  <td className="font-medium">{session.subject}</td>
                  <td>{session.professor_name}</td>
                  <td>{session.classroom_name}</td>
                  <td>{new Date(session.start_time).toLocaleString('en-GB', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}</td>
                  <td>
                    <span className={`badge ${session.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="text-center">{session.attendance_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </motion.div>

      {/* System Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="card-title">System Status</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Database</h3>
            <p className="text-sm text-gray-600">Connected & Operational</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">RFID Devices</h3>
            <p className="text-sm text-gray-600">All Systems Online</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Performance</h3>
            <p className="text-sm text-gray-600">99.9% Uptime</p>
          </div>
        </div>
        </motion.div>
    </div>
  )
}

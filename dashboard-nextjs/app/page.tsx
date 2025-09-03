'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp,
  Activity,
  GraduationCap
} from 'lucide-react'
import { supabase, ActiveSession, Attendance } from '@/lib/supabase'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([])
  const [attendanceBySession, setAttendanceBySession] = useState<Record<string, Attendance[]>>({})
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeNow: 0,
    totalStudents: 0,
    todayAttendance: 0
  })
  const [loading, setLoading] = useState(true)

  // Group active sessions by building for categorized display
  const sessionsByBuilding: Record<string, ActiveSession[]> = (activeSessions || []).reduce((acc, s) => {
    const key = s.building || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {} as Record<string, ActiveSession[]>)

  useEffect(() => {
    fetchDashboardData()
    
    // Refresh data every 5 seconds to show real-time updates
    const interval = setInterval(fetchDashboardData, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch active sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('*')
        .order('start_time', { ascending: false })

      if (sessionsError) throw sessionsError

      // Fetch current attendance for active sessions only
      let attendance: Attendance[] = []
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        const { data: att, error: attendanceError } = await supabase
          .from('attendance')
          .select(`
            *,
            student:students(name, student_number)
          `)
          .in('session_id', sessionIds)
          .order('timestamp', { ascending: true })
        if (attendanceError) throw attendanceError
        attendance = att || []
      }

      // Fetch statistics - only count real data
      const today = new Date().toISOString().split('T')[0]
      
      const [
        { count: totalSessions },
        { count: totalStudents },
        { count: todayAttendance }
      ] = await Promise.all([
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('attendance').select('*', { count: 'exact', head: true })
          .gte('timestamp', `${today}T00:00:00`)
      ])

      // Only set data if it exists (no dummy data)
      setActiveSessions(sessions || [])
      setRecentAttendance(attendance || [])
      // Build map: session_id -> attendance[]
      const map: Record<string, Attendance[]> = {}
      for (const a of attendance || []) {
        const sid = (a as any).session_id as string
        if (!map[sid]) map[sid] = []
        map[sid].push(a)
      }
      setAttendanceBySession(map)
      setStats({
        totalSessions: totalSessions || 0,
        activeNow: sessions?.length || 0,
        totalStudents: totalStudents || 0,
        todayAttendance: todayAttendance || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Dashboard Overview
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Monitor classroom attendance, active sessions, and student engagement in real-time
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Active Sessions"
          value={stats.activeNow}
          icon={Activity}
          color="primary"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          icon={Calendar}
          color="warning"
        />
        <StatCard
          title="Registered Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          color="primary"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Sessions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              Active Sessions
            </h2>
          </div>
          {activeSessions.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(sessionsByBuilding).map(([building, sessions], bIdx) => (
                <div key={building} className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">{building}</h3>
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: (bIdx * 0.05) + index * 0.08 }}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">{session.classroom_name}</p>
                            <h4 className="font-semibold text-gray-900">
                              {session.subject || 'Class Session'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Prof. {session.professor_name} • {format(new Date(session.start_time), 'HH:mm')}
                            </p>
                          </div>
                          <StatusBadge status="active" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active sessions at the moment</p>
            </div>
          )}
        </motion.div>

        {/* Current Attendance per Active Session */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          {activeSessions.length === 0 ? (
            <div className="card text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active sessions to display attendance</p>
            </div>
          ) : (
            activeSessions.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="card"
              >
                <div className="card-header">
                  <h2 className="card-title flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success-600" />
                    Current Attendance — {s.subject || 'Class Session'} • {s.classroom_name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Professor {s.professor_name}</p>
                </div>
                {attendanceBySession[s.id] && attendanceBySession[s.id].length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Student Number</th>
                          <th>Status</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceBySession[s.id].map((a, i) => (
                          <tr key={a.id}>
                            <td className="font-medium">{a.student?.name || '—'}</td>
                            <td>{a.student?.student_number || '—'}</td>
                            <td><StatusBadge status={a.status} /></td>
                            <td>{format(new Date(a.timestamp), 'HH:mm')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-6">No scans yet for this session</p>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  )
}

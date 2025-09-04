'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Clock, 
  User, 
  BookOpen,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

type ClassroomStatus = {
  classroom_id: string
  classroom_name: string
  building: string | null
  is_occupied: boolean
  active_session: {
    session_id: string
    professor_name: string
    subject: string
    start_time: string
    duration_minutes: number
  } | null
}

export default function ClassroomStatus() {
  const [classrooms, setClassrooms] = useState<ClassroomStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadClassroomStatus = async () => {
    try {
      // Get all classrooms with their current status
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id, name, building, device_id')
        .order('name')

      if (classroomsError) throw classroomsError

      const classroomStatuses: ClassroomStatus[] = []

      for (const classroom of classroomsData || []) {
        // Check if classroom is occupied
        const { data: activeSession, error: sessionError } = await supabase
          .from('sessions')
          .select(`
            id,
            subject,
            start_time,
            professor:professors(name)
          `)
          .eq('classroom_id', classroom.id)
          .eq('status', 'active')
          .limit(1)

        if (sessionError) {
          console.error('Error checking session for classroom', classroom.id, sessionError)
          continue
        }

        const isOccupied = activeSession && activeSession.length > 0
        const session = activeSession?.[0]

        classroomStatuses.push({
          classroom_id: classroom.id,
          classroom_name: classroom.name,
          building: classroom.building,
          is_occupied: isOccupied,
          active_session: isOccupied && session ? {
            session_id: session.id,
            professor_name: (session.professor as any)?.name || 'Unknown',
            subject: session.subject || 'Class Session',
            start_time: session.start_time,
            duration_minutes: Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / (1000 * 60))
          } : null
        })
      }

      setClassrooms(classroomStatuses)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading classroom status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClassroomStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadClassroomStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (isOccupied: boolean) => {
    return isOccupied 
      ? 'text-red-600 bg-red-50 border-red-200' 
      : 'text-green-600 bg-green-50 border-green-200'
  }

  const getStatusIcon = (isOccupied: boolean) => {
    return isOccupied 
      ? <AlertTriangle className="h-4 w-4" />
      : <CheckCircle className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner"></div>
        <span className="ml-2 text-gray-600">Loading classroom status...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Classroom Status</h3>
          <p className="text-sm text-gray-600">
            Real-time status of all classrooms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">
            Last updated: {format(lastUpdated, 'HH:mm:ss')}
          </div>
          <button
            onClick={loadClassroomStatus}
            className="btn btn-sm btn-outline"
            title="Refresh classroom status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Classroom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((classroom, index) => (
          <motion.div
            key={classroom.classroom_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border ${getStatusColor(classroom.is_occupied)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(classroom.is_occupied)}
                <div>
                  <div className="font-semibold">{classroom.classroom_name}</div>
                  {classroom.building && (
                    <div className="text-sm opacity-75">{classroom.building}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {classroom.is_occupied ? 'OCCUPIED' : 'AVAILABLE'}
                </div>
              </div>
            </div>

            {classroom.is_occupied && classroom.active_session && (
              <div className="space-y-2 pt-3 border-t border-current border-opacity-20">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3 w-3" />
                  <span>{classroom.active_session.professor_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-3 w-3" />
                  <span>{classroom.active_session.subject}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3" />
                  <span>
                    Started {format(new Date(classroom.active_session.start_time), 'HH:mm')} 
                    ({classroom.active_session.duration_minutes}m ago)
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-blue-600">{classrooms.length}</div>
          <div className="text-sm text-gray-600">Total Classrooms</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-green-600">
            {classrooms.filter(c => !c.is_occupied).length}
          </div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-red-600">
            {classrooms.filter(c => c.is_occupied).length}
          </div>
          <div className="text-sm text-gray-600">Occupied</div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Classroom Protection</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Only one professor can have an active session per classroom</li>
              <li>• New sessions are blocked if classroom is already occupied</li>
              <li>• Status updates automatically every 30 seconds</li>
              <li>• Professors must end their session before another can start</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  Download, 
  BookOpen, 
  Users, 
  Calendar,
  TrendingUp,
  FileText,
  Eye,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import React from 'react'

type CourseAttendance = {
  courseId: string
  courseName: string
  totalEnrolled: number
  totalSessions: number
  presentCount: number
  lateCount: number
  absentCount: number
  attendanceRate: number
  lastSession: string | null
  sessions: SessionSummary[]
}

type SessionSummary = {
  sessionId: string
  subject: string
  date: string
  professor: string
  classroom: string
  presentCount: number
  lateCount: number
  absentCount: number
  totalEnrolled: number
  attendanceRate: number
}

type StudentAttendance = {
  studentId: string
  studentName: string
  studentNumber: string
  program: string | null
  status: 'present' | 'late' | 'absent'
  timestamp: string | null
}

export default function AttendancePage() {
  const [courses, setCourses] = useState<CourseAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [sessionStudents, setSessionStudents] = useState<Record<string, StudentAttendance[]>>({})

  const loadData = async () => {
    setLoading(true)
    try {
      // Get all sessions with attendance data (both active and ended)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          subject,
          start_time,
          end_time,
          status,
          professor:professors(name),
          classroom:classrooms(name)
        `)
        .in('status', ['active', 'ended'])
        .order('start_time', { ascending: false })

      if (sessionsError) throw sessionsError

      // Debug: Check what data we have
      console.log('Raw sessions data:', sessionsData)
      
      // Also check attendance records
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id, session_id, status, timestamp')
        .limit(10)
      console.log('Sample attendance records:', attendanceData)

      // Group sessions by subject (course)
      const courseMap = new Map<string, CourseAttendance>()

      for (const session of sessionsData || []) {
        const subject = session.subject || 'Class Session'
        
        if (!courseMap.has(subject)) {
          courseMap.set(subject, {
            courseId: `course_${subject.replace(/\s+/g, '_').toLowerCase()}`,
            courseName: subject,
            totalEnrolled: 0,
            totalSessions: 0,
            presentCount: 0,
            lateCount: 0,
            absentCount: 0,
            attendanceRate: 0,
            lastSession: null,
            sessions: []
          })
        }

        const course = courseMap.get(subject)!

        // Get attendance for this session
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select(`
            status,
            student:students(name, student_number, program)
          `)
          .eq('session_id', session.id)

        const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0
        const lateCount = attendanceData?.filter(a => a.status === 'late').length || 0
        const totalAttended = presentCount + lateCount

        // Update course totals
        course.totalSessions++
        course.presentCount += presentCount
        course.lateCount += lateCount
        
        if (!course.lastSession || session.start_time > course.lastSession) {
          course.lastSession = session.start_time
        }

        // Add session summary
        course.sessions.push({
          sessionId: session.id,
          subject: session.subject || 'Class Session',
          date: session.start_time,
          professor: (session.professor as any)?.name || 'Unknown',
          classroom: (session.classroom as any)?.name || 'Unknown',
          presentCount,
          lateCount,
          absentCount: 0, // We'll calculate this later
          totalEnrolled: totalAttended, // For now, use attended count as enrolled
          attendanceRate: 100 // Since we only count those who attended
        })
      }

      // Calculate final statistics for each course
      const courseAttendanceData: CourseAttendance[] = []
      for (const course of Array.from(courseMap.values())) {
        // Calculate total enrolled as the maximum number of students who attended any session
        course.totalEnrolled = Math.max(...course.sessions.map((s: SessionSummary) => s.totalEnrolled), 0)
        
        // Calculate absent count for each session
        course.sessions.forEach((session: SessionSummary) => {
          session.absentCount = Math.max(0, course.totalEnrolled - (session.presentCount + session.lateCount))
        })
        
        // Calculate overall attendance rate
        const totalPossibleAttendance = course.totalEnrolled * course.totalSessions
        const totalActualAttendance = course.presentCount + course.lateCount
        course.attendanceRate = totalPossibleAttendance > 0 ? 
          Math.round((totalActualAttendance / totalPossibleAttendance) * 100) : 0
        
        // Calculate total absent count
        course.absentCount = Math.max(0, totalPossibleAttendance - totalActualAttendance)
        
        courseAttendanceData.push(course)
      }

      setCourses(courseAttendanceData)
      
      // Debug logging
      console.log('Loaded attendance data:', {
        totalSessions: sessionsData?.length || 0,
        totalCourses: courseAttendanceData.length,
        sessions: sessionsData?.map(s => ({
          id: s.id,
          subject: s.subject,
          status: s.status,
          professor: (s.professor as any)?.name,
          classroom: (s.classroom as any)?.name
        })),
        courses: courseAttendanceData.map(c => ({
          name: c.courseName,
          sessions: c.totalSessions,
          enrolled: c.totalEnrolled,
          present: c.presentCount,
          late: c.lateCount,
          absent: c.absentCount
        }))
      })
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const toggleCourseExpansion = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const toggleSessionExpansion = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    
    if (newExpanded.has(sessionId)) {
      // Collapse session
      newExpanded.delete(sessionId)
      setExpandedSessions(newExpanded)
    } else {
      // Expand session and load student data
      newExpanded.add(sessionId)
      setExpandedSessions(newExpanded)
      
      // Load student attendance data if not already loaded
      if (!sessionStudents[sessionId]) {
        await loadSessionStudents(sessionId)
      }
    }
  }

  const loadSessionStudents = async (sessionId: string) => {
    try {
      // Get attendance records for this session with student details
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          student_id,
          status,
          timestamp,
          student:students(id, name, student_number, program)
        `)
        .eq('session_id', sessionId)

      // Create student attendance list
      const students: StudentAttendance[] = []
      
      for (const attendance of attendanceData || []) {
        const student = attendance.student as any
        
        students.push({
          studentId: student.id,
          studentName: student.name,
          studentNumber: student.student_number,
          program: student.program,
          status: attendance.status,
          timestamp: attendance.timestamp
        })
      }

      // Sort by status: present, late, absent
      students.sort((a, b) => {
        const statusOrder = { present: 0, late: 1, absent: 2 }
        return statusOrder[a.status] - statusOrder[b.status]
      })

      setSessionStudents(prev => ({
        ...prev,
        [sessionId]: students
      }))
    } catch (error) {
      console.error('Error loading session students:', error)
    }
  }

  const exportCourseData = (course: CourseAttendance) => {
    const csvData = course.sessions.map(session => ({
      Course: course.courseName,
      Session: session.subject,
      Date: format(new Date(session.date), 'yyyy-MM-dd'),
      Professor: session.professor,
      Classroom: session.classroom,
      'Total Enrolled': session.totalEnrolled,
      Present: session.presentCount,
      Late: session.lateCount,
      Absent: session.absentCount,
      'Attendance Rate': `${session.attendanceRate}%`
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${course.courseName.replace(/\s+/g, '_')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportAllData = () => {
    const allSessions = courses.flatMap(course => 
      course.sessions.map(session => ({
        Course: course.courseName,
        Session: session.subject,
        Date: format(new Date(session.date), 'yyyy-MM-dd'),
        Professor: session.professor,
        Classroom: session.classroom,
        'Total Enrolled': session.totalEnrolled,
        Present: session.presentCount,
        Late: session.lateCount,
        Absent: session.absentCount,
        'Attendance Rate': `${session.attendanceRate}%`
      }))
    )

    const csv = [
      Object.keys(allSessions[0]).join(','),
      ...allSessions.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `all_courses_attendance.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>

  // Calculate overall statistics
  const overallStats = {
    totalCourses: courses.length,
    totalEnrolled: courses.reduce((sum, course) => sum + course.totalEnrolled, 0),
    totalSessions: courses.reduce((sum, course) => sum + course.totalSessions, 0),
    totalPresent: courses.reduce((sum, course) => sum + course.presentCount, 0),
    totalLate: courses.reduce((sum, course) => sum + course.lateCount, 0),
    totalAbsent: courses.reduce((sum, course) => sum + course.absentCount, 0),
    overallAttendanceRate: courses.length > 0 ? 
      Math.round(courses.reduce((sum, course) => sum + course.attendanceRate, 0) / courses.length) : 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Course Attendance Overview</h1>
        <div className="flex gap-2">
          <button 
            onClick={loadData}
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button 
            onClick={exportAllData}
            className="btn btn-primary"
            disabled={courses.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </button>
        </div>
      </div>

      {/* Debug Information */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h3 className="text-sm font-semibold text-blue-800 mb-2">🔍 Debug Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
          <div>
            <strong>Data Summary:</strong><br/>
            Total Courses: {courses.length}<br/>
            Total Sessions: {courses.reduce((sum, c) => sum + c.totalSessions, 0)}<br/>
            Total Students: {courses.reduce((sum, c) => sum + c.totalEnrolled, 0)}
          </div>
          <div>
            <strong>Attendance Summary:</strong><br/>
            Total Present: {courses.reduce((sum, c) => sum + c.presentCount, 0)}<br/>
            Total Late: {courses.reduce((sum, c) => sum + c.lateCount, 0)}<br/>
            Total Absent: {courses.reduce((sum, c) => sum + c.absentCount, 0)}
          </div>
          <div>
            <strong>Course Details:</strong><br/>
            {courses.length === 0 ? 'No courses found' : courses.map(c => (
              <div key={c.courseId}>
                {c.courseName}: {c.totalSessions} sessions, {c.totalEnrolled} enrolled
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Overall Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-blue-600">{overallStats.totalCourses}</div>
          <div className="text-sm text-gray-600">Active Courses</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-gray-900">{overallStats.totalEnrolled}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-green-600">{overallStats.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-2xl font-bold text-purple-600">{overallStats.overallAttendanceRate}%</div>
          <div className="text-sm text-gray-600">Avg Attendance Rate</div>
        </div>
      </motion.div>

      {/* Course List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {courses.map((course, index) => (
          <motion.div
            key={course.courseId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="card"
          >
            {/* Course Header */}
            <div className="card-header cursor-pointer" onClick={() => toggleCourseExpansion(course.courseId)}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                  <div>
                    <h3 className="card-title">{course.courseName}</h3>
                    <p className="text-sm text-gray-600">
                      {course.totalSessions} sessions • {course.totalEnrolled} enrolled students
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">{course.attendanceRate}%</div>
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                  </div>
                  <ChevronRight 
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedCourses.has(course.courseId) ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
              </div>
            </div>

            {/* Course Summary Stats */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">{course.presentCount}</div>
                  <div className="text-sm text-gray-600">Present</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-yellow-600">{course.lateCount}</div>
                  <div className="text-sm text-gray-600">Late</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{course.absentCount}</div>
                  <div className="text-sm text-gray-600">Absent</div>
                </div>
                <div 
                  className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                  onClick={() => toggleSessionExpansion(course.sessions[0]?.sessionId || '')}
                  title="Click to see student details for all sessions"
                >
                  <div className="text-lg font-semibold text-blue-600">{course.totalSessions}</div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </div>
              </div>
            </div>

            {/* Expanded Session Details */}
            {expandedCourses.has(course.courseId) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">Session Details</h4>
                  <button 
                    onClick={() => exportCourseData(course)}
                    className="btn btn-sm btn-outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Course
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Professor</th>
                        <th>Classroom</th>
                        <th>Present</th>
                        <th>Late</th>
                        <th>Absent</th>
                        <th>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.sessions.map((session) => (
                        <React.Fragment key={session.sessionId}>
                          <tr 
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleSessionExpansion(session.sessionId)}
                          >
                            <td>{format(new Date(session.date), 'MMM dd, yyyy')}</td>
                            <td className="font-medium">{session.subject}</td>
                            <td>{session.professor}</td>
                            <td>{session.classroom}</td>
                            <td className="text-green-600 font-medium">{session.presentCount}</td>
                            <td className="text-yellow-600 font-medium">{session.lateCount}</td>
                            <td className="text-red-600 font-medium">{session.absentCount}</td>
                            <td className="font-medium">{session.attendanceRate}%</td>
                          </tr>
                          
                          {/* Session-specific student details */}
                          {expandedSessions.has(session.sessionId) && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-blue-50 p-4"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-semibold text-blue-800">
                                      Student Details for {format(new Date(session.date), 'MMM dd, yyyy')} - {session.subject}
                                    </h5>
                                    <span className="text-sm text-blue-600">
                                      {session.presentCount + session.lateCount} attended, {session.absentCount} absent
                                    </span>
                                  </div>
                                  
                                  {sessionStudents[session.sessionId] ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {sessionStudents[session.sessionId].map((student) => (
                                        <div 
                                          key={student.studentId}
                                          className={`p-3 rounded-lg border ${
                                            student.status === 'present' ? 'bg-green-50 border-green-200' :
                                            student.status === 'late' ? 'bg-yellow-50 border-yellow-200' :
                                            'bg-red-50 border-red-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-800">{student.studentName}</span>
                                            <span className={`badge badge-sm ${
                                              student.status === 'present' ? 'badge-success' :
                                              student.status === 'late' ? 'badge-warning' : 'badge-danger'
                                            }`}>
                                              {student.status}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            <div>{student.studentNumber}</div>
                                            <div>{student.program || '—'}</div>
                                            {student.timestamp && (
                                              <div className="text-xs mt-1">
                                                {format(new Date(student.timestamp), 'HH:mm')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-gray-500">
                                      <div className="spinner mx-auto mb-2"></div>
                                      Loading student details...
                                    </div>
                                  )}
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Student Details for All Sessions */}
                {expandedSessions.has(course.sessions[0]?.sessionId || '') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 border-t border-gray-200 mt-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800">Student Attendance Details (All Sessions)</h4>
                      <div className="text-sm text-gray-600">
                        Click on individual session rows above to see session-specific details
                      </div>
                    </div>
                    
                    {sessionStudents[course.sessions[0]?.sessionId || ''] ? (
                      <div className="overflow-x-auto">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Student Name</th>
                              <th>Student Number</th>
                              <th>Program</th>
                              <th>Overall Status</th>
                              <th>Last Attendance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionStudents[course.sessions[0]?.sessionId || ''].map((student) => (
                              <tr key={student.studentId}>
                                <td className="font-medium">{student.studentName}</td>
                                <td className="text-gray-600">{student.studentNumber}</td>
                                <td className="text-gray-600">{student.program || '—'}</td>
                                <td>
                                  <span className={`badge ${
                                    student.status === 'present' ? 'badge-success' :
                                    student.status === 'late' ? 'badge-warning' : 'badge-danger'
                                  }`}>
                                    {student.status}
                                  </span>
                                </td>
                                <td className="text-gray-600">
                                  {student.timestamp ? format(new Date(student.timestamp), 'MMM dd, yyyy HH:mm') : 'Never attended'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <div className="spinner mx-auto mb-2"></div>
                        Loading student details...
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {courses.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 text-gray-500"
        >
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No course attendance data found</p>
          <p className="text-sm">Make sure you have courses with enrolled students and completed sessions</p>
        </motion.div>
      )}
    </div>
  )
}

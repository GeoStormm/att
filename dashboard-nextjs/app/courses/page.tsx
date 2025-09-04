'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Plus, Users, BookOpen, GraduationCap, Building2, Calendar, Download } from 'lucide-react'

type Course = {
  id: string
  name: string
  department: string | null
  created_at: string
  student_count: number
}

type Student = {
  id: string
  name: string
  student_number: string
  email: string | null
  program: string | null
  year_of_study: number | null
}

type Professor = {
  id: string
  name: string
  email: string | null
  department: string | null
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const [courseName, setCourseName] = useState('')
  const [department, setDepartment] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [coursesData, studentsData, professorsData] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('*').order('name'),
        supabase.from('professors').select('*').order('name')
      ])

      if (coursesData.data) {
        // Get student count for each course with better debugging
        const coursesWithCounts = await Promise.all(
          coursesData.data.map(async (course) => {
            try {
              // Get actual enrollments to verify count
              const { data: enrollments, count, error } = await supabase
                .from('course_enrollments')
                .select('student_id', { count: 'exact' })
                .eq('course_id', course.id)
              
              if (error) {
                console.error(`Error getting count for course ${course.name}:`, error)
                return { ...course, student_count: 0 }
              }
              
              console.log(`Course: ${course.name}, Count: ${count}, Enrollments:`, enrollments)
              
              return {
                ...course,
                student_count: count || 0
              }
            } catch (err) {
              console.error(`Error processing course ${course.name}:`, err)
              return { ...course, student_count: 0 }
            }
          })
        )
        setCourses(coursesWithCounts)
      }

      if (studentsData.data) setStudents(studentsData.data)
      if (professorsData.data) setProfessors(professorsData.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const addCourse = async () => {
    if (!courseName.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from('courses').insert({
        name: courseName.trim(),
        department: department.trim() || null,
      })
      if (error) throw error
      setCourseName('')
      setDepartment('')
      await loadData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const removeCourse = async (id: string) => {
    if (!confirm('Delete this course? This will also remove all enrollments.')) return
    try {
      // First remove enrollments
      await supabase.from('course_enrollments').delete().eq('course_id', id)
      // Then remove course
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const exportCourseData = async (courseId: string) => {
    try {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select(`
          student:students(name, student_number, email, program, year_of_study)
        `)
        .eq('course_id', courseId)

      if (!enrollments) return

      const csvData = enrollments.map(e => ({
        Name: e.student?.name || '',
        'Student Number': e.student?.student_number || '',
        Email: e.student?.email || '',
        Program: e.student?.program || '',
        'Year of Study': e.student?.year_of_study || ''
      }))

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course_enrollments_${courseId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed')
    }
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowEnrollmentModal(true)}
            className="btn btn-secondary"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Enrollments
          </button>
        </div>
      </div>

            {/* Debug Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">🔧 Debug & Fix Enrollment Counts</h3>
        <div className="space-y-2">
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.from('course_enrollments').select('count').limit(1)
                if (error) throw error
                alert(`✅ Read access OK. Found ${data?.length || 0} enrollments`)
              } catch (err: any) {
                alert(`❌ Read error: ${err.message}`)
              }
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
          >
            Test Enrollments Read Access
          </button>
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.from('course_enrollments').delete().eq('course_id', '00000000-0000-0000-0000-000000000000').select()
                if (error) throw error
                alert(`✅ Delete access OK (no rows affected)`)
              } catch (err: any) {
                alert(`❌ Delete error: ${err.message}`)
              }
            }}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
          >
            Test Enrollments Delete Permission
          </button>
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.auth.getUser()
                if (error) throw error
                alert(`✅ User: ${data.user?.email || 'Anonymous'}`)
              } catch (err: any) {
                alert(`❌ Auth error: ${err.message}`)
              }
            }}
            className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded"
          >
            Check Current User
          </button>
          <button 
            onClick={async () => {
              try {
                // Get all enrollments to debug the count issue
                const { data: enrollments, error } = await supabase
                  .from('course_enrollments')
                  .select(`
                    course_id,
                    student_id,
                    courses(name),
                    students(name, student_number)
                  `)
                  .order('course_id')
                
                if (error) throw error
                
                console.log('All enrollments:', enrollments)
                
                // Group by course to show actual counts
                const courseCounts = enrollments.reduce((acc, enrollment) => {
                  const courseName = enrollment.courses?.name || 'Unknown'
                  acc[courseName] = (acc[courseName] || 0) + 1
                  return acc
                }, {})
                
                alert(`📊 Current Enrollment Counts:\n${Object.entries(courseCounts).map(([course, count]) => `${course}: ${count} students`).join('\n')}`)
              } catch (err: any) {
                alert(`❌ Error checking enrollments: ${err.message}`)
              }
            }}
            className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded"
          >
            🔍 Check Enrollment Counts
          </button>
          <button 
            onClick={loadData}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Add Course */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary-600" />
            Add New Course
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
          <input 
            className="input" 
            placeholder="Course Name" 
            value={courseName} 
            onChange={(e) => setCourseName(e.target.value)} 
          />
          <input 
            className="input" 
            placeholder="Department (optional)" 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)} 
          />
          <div className="flex justify-end">
            <button 
              className="btn btn-primary" 
              disabled={saving} 
              onClick={addCourse}
            >
              {saving ? 'Adding…' : 'Add Course'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Courses List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600" />
            All Courses
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Department</th>
                <th>Enrolled Students</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="font-medium">{course.name}</td>
                  <td>{course.department || '—'}</td>
                  <td className="text-center">
                    <span className="badge badge-success">
                      {course.student_count} students
                    </span>
                  </td>
                  <td>{new Date(course.created_at).toLocaleDateString()}</td>
                  <td className="text-right space-x-2">
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => exportCourseData(course.id)}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm text-red-600"
                      onClick={() => removeCourse(course.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Enrollment Management Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Course Enrollments</h2>
              <button 
                onClick={() => setShowEnrollmentModal(false)}
                className="btn btn-ghost"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Selection */}
              <div>
                <h3 className="font-semibold mb-3">Select Course</h3>
                <select 
                  className="input w-full"
                  value={selectedCourse?.id || ''}
                  onChange={(e) => {
                    const course = courses.find(c => c.id === e.target.value)
                    setSelectedCourse(course || null)
                  }}
                >
                  <option value="">Choose a course...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.department || 'No Department'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Stats */}
              {selectedCourse && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedCourse.name}</h4>
                  <p className="text-sm text-gray-600">
                    Department: {selectedCourse.department || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Enrolled: {selectedCourse.student_count} students
                  </p>
                </div>
              )}
            </div>

            {/* Enrollment Management */}
            {selectedCourse && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Manage Enrollments</h3>
                <div className="space-y-4">
                  {/* Add Student */}
                  <div className="flex gap-3">
                    <select 
                      className="input flex-1"
                      id="studentSelect"
                    >
                      <option value="">Select student to enroll...</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.student_number})
                        </option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-primary"
                      onClick={async () => {
                        const studentId = (document.getElementById('studentSelect') as HTMLSelectElement).value
                        if (!studentId) return
                        
                        try {
                          const { error } = await supabase
                            .from('course_enrollments')
                            .insert({
                              course_id: selectedCourse.id,
                              student_id: studentId
                            })
                          if (error) throw error
                          await loadData()
                          alert('Student enrolled successfully!')
                        } catch (e: any) {
                          alert(e.message)
                        }
                      }}
                    >
                      Enroll
                    </button>
                  </div>

                  {/* Current Enrollments */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Current Enrollments</h4>
                    <div className="space-y-2">
                      {students
                        .filter(student => 
                          courses.find(c => c.id === selectedCourse.id)?.student_count > 0
                        )
                        .map(student => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-white rounded">
                            <div>
                              <span className="font-medium">{student.name}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                ({student.student_number})
                              </span>
                            </div>
                            <button 
                              className="btn btn-ghost btn-sm text-red-600"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('course_enrollments')
                                    .delete()
                                    .eq('course_id', selectedCourse.id)
                                    .eq('student_id', student.id)
                                  if (error) throw error
                                  await loadData()
                                } catch (e: any) {
                                  alert(e.message)
                                }
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

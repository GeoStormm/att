'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type TimetableRow = {
  id: string
  course: { name: string, department: string | null }
  professor: { name: string }
  classroom: { name: string, building: string | null }
  day_of_week: number
  start_time: string
  end_time: string
}

const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function TimetablePage() {
  const [rows, setRows] = useState<TimetableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [dept, setDept] = useState('')
  const [slotAdding, setSlotAdding] = useState(false)
  const [day, setDay] = useState<number>(1)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [profEmail, setProfEmail] = useState('')
  const [roomName, setRoomName] = useState('')
  const [building, setBuilding] = useState('')
  
  // New state for dropdown options
  const [courses, setCourses] = useState<Array<{id: string, name: string, department: string | null}>>([])
  const [professors, setProfessors] = useState<Array<{id: string, name: string, email: string}>>([])
  const [classrooms, setClassrooms] = useState<Array<{id: string, name: string, building: string | null}>>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedProfessorId, setSelectedProfessorId] = useState('')
  const [selectedClassroomId, setSelectedClassroomId] = useState('')

  const load = async () => {
    try {
      // Load timetable entries
      const { data, error } = await supabase
        .from('timetable_entries')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          course:courses(name, department),
          professor:professors(name),
          classroom:classrooms(name, building)
        `)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })
      if (error) throw error
      setRows((data as any) || [])
      
      // Load dropdown options
      const [coursesRes, professorsRes, classroomsRes] = await Promise.all([
        supabase.from('courses').select('id, name, department').order('name'),
        supabase.from('professors').select('id, name, email').order('name'),
        supabase.from('classrooms').select('id, name, building').order('name')
      ])
      
      if (coursesRes.error) throw coursesRes.error
      if (professorsRes.error) throw professorsRes.error
      if (classroomsRes.error) throw classroomsRes.error
      
      setCourses(coursesRes.data || [])
      setProfessors(professorsRes.data || [])
      setClassrooms(classroomsRes.data || [])
      
      // Debug logging
      console.log('Loaded courses:', coursesRes.data?.length || 0)
      console.log('Loaded professors:', professorsRes.data?.length || 0)
      console.log('Loaded classrooms:', classroomsRes.data?.length || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Time Schedule</h1>
      <div className="flex items-center justify-center py-12">
        <div className="loading"><div className="spinner"/></div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Time Schedule</h1>
      
      {/* Data Summary for Debugging */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-blue-800">Data Summary</h3>
          <div className="flex gap-2">
            <button 
              onClick={load}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
            >
              🔄 Refresh
            </button>
            <button 
              onClick={async () => {
                if (!confirm('⚠️ This will DELETE ALL data including courses, classrooms, professors, timetable entries, sessions, and attendance records. This action cannot be undone. Are you sure?')) {
                  return
                }
                try {
                  // Clear all data in the correct order (respecting foreign key constraints)
                  await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('session_roster').delete().neq('session_id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('timetable_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('course_enrollments').delete().neq('course_id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('classrooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('professors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  
                  alert('✅ All data cleared successfully! The system is now clean for fresh testing.')
                  await load()
                } catch (err) {
                  console.error('Error clearing data:', err)
                  alert('❌ Error clearing data: ' + (err as Error).message)
                }
              }}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
            >
              🗑️ Clear All Data
            </button>
            <button 
              onClick={async () => {
                if (!confirm('⚠️ This will clear only session history (sessions, attendance, roster) but keep courses, professors, and classrooms. Continue?')) {
                  return
                }
                try {
                  // Clear only session-related data
                  await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('session_roster').delete().neq('session_id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  
                  alert('✅ Session history cleared! Courses, professors, and classrooms remain.')
                  await load()
                } catch (err) {
                  console.error('Error clearing sessions:', err)
                  alert('❌ Error clearing sessions: ' + (err as Error).message)
                }
              }}
              className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded"
            >
              🧹 Clear Sessions Only
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-blue-700">
          <div>📚 Courses: {courses.length}</div>
          <div>👨‍🏫 Professors: {professors.length}</div>
          <div>🏫 Classrooms: {classrooms.length}</div>
        </div>
        {(!courses.length || !professors.length || !classrooms.length) && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-blue-600">
              💡 Add some data using the forms below to populate the dropdowns
            </p>
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    await supabase.from('courses').insert([
                      { name: 'Advanced Mathematics', department: 'Engineering' },
                      { name: 'Computer Science Fundamentals', department: 'Computer Science' },
                      { name: 'Physics 101', department: 'Physics' }
                    ])
                    await load()
                  } catch (err) {
                    console.error('Error adding sample courses:', err)
                  }
                }}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
              >
                ➕ Add Sample Courses
              </button>
              <button 
                onClick={async () => {
                  try {
                    await supabase.from('classrooms').insert([
                      { name: 'Room A101', building: 'Engineering Building' },
                      { name: 'Room B205', building: 'Science Building' },
                      { name: 'Room C301', building: 'Main Building' }
                    ])
                    await load()
                  } catch (err) {
                    console.error('Error adding sample classrooms:', err)
                  }
                }}
                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
              >
                ➕ Add Sample Classrooms
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Debug Delete Functionality */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">🔧 Debug Delete Functionality</h3>
        <div className="space-y-2">
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.from('timetable_entries').select('count').limit(1)
                if (error) throw error
                alert(`✅ Read access OK. Found ${data?.length || 0} entries`)
              } catch (err: any) {
                alert(`❌ Read error: ${err.message}`)
              }
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
          >
            Test Timetable Read Access
          </button>
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.from('timetable_entries').delete().eq('id', '00000000-0000-0000-0000-000000000000').select()
                if (error) throw error
                alert(`✅ Delete access OK (no rows affected)`)
              } catch (err: any) {
                alert(`❌ Delete error: ${err.message}`)
              }
            }}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
          >
            Test Timetable Delete Permission
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
        </div>
      </div>
      
      <div className="card">
        <div className="card-header"><h2 className="card-title">Add Course</h2></div>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!courseName.trim()) return
            try {
              setAdding(true)
              const { error } = await supabase.from('courses').insert({ name: courseName.trim(), department: dept.trim() || null })
              if (error) throw error
              setCourseName('')
              setDept('')
              await load()
            } finally {
              setAdding(false)
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4"
        >
          <div>
            <label className="block text-sm text-gray-600 mb-1">Course name</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Data Structures" value={courseName} onChange={(e)=>setCourseName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Department (optional)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Computer Science" value={dept} onChange={(e)=>setDept(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button disabled={adding} className="btn btn-primary w-full">{adding ? 'Adding…' : 'Add Course'}</button>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Course</th>
                <th>Professor</th>
                <th>Classroom</th>
                <th>Building</th>
                <th>Department</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{days[r.day_of_week]}</td>
                  <td>{r.start_time.slice(0,5)} - {r.end_time.slice(0,5)}</td>
                  <td>{r.course?.name}</td>
                  <td>{r.professor?.name}</td>
                  <td>{r.classroom?.name}</td>
                  <td>{r.classroom?.building || '—'}</td>
                  <td>{r.course?.department || '—'}</td>
                  <td className="text-right">
                    <button
                      className="btn btn-ghost text-red-600"
                      onClick={async ()=>{
                        if (!confirm('Delete this entry?')) return
                        const { error } = await supabase.from('timetable_entries').delete().eq('id', r.id)
                        if (error) return alert(error.message)
                        await load()
                      }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Timetable Entry */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Add Timetable Entry</h2>
          {(!courses.length || !professors.length || !classrooms.length) && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠️ Please add some courses, professors, and classrooms first using the forms above.
            </p>
          )}
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!selectedCourseId || !selectedProfessorId || !selectedClassroomId) {
              alert('Please select a course, professor, and classroom')
              return
            }
            try {
              setSlotAdding(true)
              
              // Insert timetable entry using selected IDs
              const { error: ttErr } = await supabase
                .from('timetable_entries')
                .insert({
                  course_id: selectedCourseId,
                  professor_id: selectedProfessorId,
                  classroom_id: selectedClassroomId,
                  day_of_week: day,
                  start_time: start,
                  end_time: end,
                })
              if (ttErr) throw ttErr

              // Reset form and reload table
              setSelectedCourseId('')
              setSelectedProfessorId('')
              setSelectedClassroomId('')
              await load()
            } catch (err) {
              console.error(err)
              alert((err as Error).message)
            } finally {
              setSlotAdding(false)
            }
          }}
          className="grid grid-cols-1 md:grid-cols-7 gap-3 p-4"
        >
          <div>
            <label className="block text-sm text-gray-600 mb-1">Day</label>
            <select value={day} onChange={(e)=>setDay(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              {days.map((d, i) => (<option key={i} value={i}>{d}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start</label>
            <input type="time" value={start} onChange={(e)=>setStart(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End</label>
            <input type="time" value={end} onChange={(e)=>setEnd(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Course</label>
            <select 
              value={selectedCourseId} 
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select a course ({courses.length} available)</option>
              {courses.length === 0 ? (
                <option disabled>No courses available - add some first</option>
              ) : (
                courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} {course.department ? `(${course.department})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Professor</label>
            <select 
              value={selectedProfessorId} 
              onChange={(e) => setSelectedProfessorId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select a professor ({professors.length} available)</option>
              {professors.length === 0 ? (
                <option disabled>No professors available - add some first</option>
              ) : (
                professors.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} ({prof.email})
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Classroom</label>
            <select 
              value={selectedClassroomId} 
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select a classroom ({classrooms.length} available)</option>
              {classrooms.length === 0 ? (
                <option disabled>No classrooms available - add some first</option>
              ) : (
                classrooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name} {room.building ? `(${room.building})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-600 mb-1">Building</label>
            <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
              {classrooms.find(r => r.id === selectedClassroomId)?.building || 'Auto-filled from classroom'}
            </div>
          </div>
          <div className="md:col-span-7 flex justify-end">
            <button disabled={slotAdding} className="btn btn-primary">{slotAdding ? 'Adding…' : 'Add Timetable Entry'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}



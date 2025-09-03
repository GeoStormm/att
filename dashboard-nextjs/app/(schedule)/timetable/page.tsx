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

  const load = async () => {
    try {
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="loading"><div className="spinner"/></div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Time Schedule</h1>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Timetable Entry */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">Add Timetable Entry</h2></div>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!courseName.trim() || !profEmail.trim() || !roomName.trim()) return
            try {
              setSlotAdding(true)
              // 1) Upsert Course (with department)
              const { data: courseUp, error: courseErr } = await supabase
                .from('courses')
                .upsert({ name: courseName.trim(), department: dept.trim() || null }, { onConflict: 'name' })
                .select('id').limit(1)
              if (courseErr) throw courseErr
              const courseId = courseUp?.[0]?.id

              // 2) Upsert Classroom (with building)
              const { data: roomUp, error: roomErr } = await supabase
                .from('classrooms')
                .upsert({ name: roomName.trim(), building: building.trim() || null }, { onConflict: 'name' })
                .select('id').limit(1)
              if (roomErr) throw roomErr
              const classroomId = roomUp?.[0]?.id

              // 3) Find Professor by email
              const { data: prof, error: profErr } = await supabase
                .from('professors')
                .select('id')
                .eq('email', profEmail.trim())
                .limit(1)
                .maybeSingle()
              if (profErr) throw profErr
              if (!prof?.id) throw new Error('Professor not found for email: ' + profEmail)

              // 4) Insert timetable entry
              const { error: ttErr } = await supabase
                .from('timetable_entries')
                .insert({
                  course_id: courseId,
                  professor_id: prof.id,
                  classroom_id: classroomId,
                  day_of_week: day,
                  start_time: start,
                  end_time: end,
                })
              if (ttErr) throw ttErr

              // Reload table
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
            <input value={courseName} onChange={(e)=>setCourseName(e.target.value)} placeholder="Data Structures" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Professor (email)</label>
            <input value={profEmail} onChange={(e)=>setProfEmail(e.target.value)} placeholder="prof@university.edu" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Classroom</label>
            <input value={roomName} onChange={(e)=>setRoomName(e.target.value)} placeholder="Room A101" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Building</label>
            <input value={building} onChange={(e)=>setBuilding(e.target.value)} placeholder="Engineering Building" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div className="md:col-span-7 flex justify-end">
            <button disabled={slotAdding} className="btn btn-primary">{slotAdding ? 'Adding…' : 'Add Timetable Entry'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}



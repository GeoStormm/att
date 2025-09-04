'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Student = {
  id: string
  name: string
  rfid_tag: string
  student_number: string
  email: string | null
  program: string | null
  year_of_study: number | null
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [rfid, setRfid] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [email, setEmail] = useState('')
  const [program, setProgram] = useState('')
  const [year, setYear] = useState<number | ''>('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setStudents((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addStudent = async () => {
    if (!name.trim() || !rfid.trim() || !studentNumber.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from('students').insert({
        name: name.trim(),
        rfid_tag: rfid.trim(),
        student_number: studentNumber.trim(),
        email: email.trim() || null,
        program: program.trim() || null,
        year_of_study: year === '' ? null : Number(year),
      })
      if (error) throw error
      setName(''); setRfid(''); setStudentNumber(''); setEmail(''); setProgram(''); setYear('')
      await load()
    } catch (e:any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const removeStudent = async (id: string) => {
    if (!confirm('Delete this student?')) return
    try {
      console.log('Attempting to delete student with ID:', id)
      const { data, error } = await supabase.from('students').delete().eq('id', id).select()
      if (error) {
        console.error('Delete error:', error)
        alert(`Failed to delete: ${error.message}`)
        return
      }
      console.log('Delete response:', data)
      console.log('Student deleted successfully')
      await load()
    } catch (e: any) {
      console.error('Delete exception:', e)
      alert(`Delete failed: ${e.message}`)
    }
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Students</h1>

      {/* Debug Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">🔧 Debug Delete Functionality</h3>
        <div className="space-y-2">
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.from('students').select('count').limit(1)
                if (error) throw error
                alert(`✅ Read access OK. Found ${data?.length || 0} students`)
              } catch (err: any) {
                alert(`❌ Read error: ${err.message}`)
              }
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
          >
            Test Read Access
          </button>
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.from('students').delete().eq('id', '00000000-0000-0000-0000-000000000000').select()
                if (error) throw error
                alert(`✅ Delete access OK (no rows affected)`)
              } catch (err: any) {
                alert(`❌ Delete error: ${err.message}`)
              }
            }}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
          >
            Test Delete Permission
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
        <div className="card-header"><h2 className="card-title">Add Student</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
          <input className="input" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="input" placeholder="RFID Tag" value={rfid} onChange={(e)=>setRfid(e.target.value)} />
          <input className="input" placeholder="Student Number" value={studentNumber} onChange={(e)=>setStudentNumber(e.target.value)} />
          <input className="input" placeholder="Email (optional)" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="input" placeholder="Program (optional)" value={program} onChange={(e)=>setProgram(e.target.value)} />
          <input className="input" type="number" placeholder="Year (optional)" value={year} onChange={(e)=>setYear(e.target.value === '' ? '' : Number(e.target.value))} />
          <div className="md:col-span-3 flex justify-end">
            <button className="btn btn-primary" disabled={saving} onClick={addStudent}>{saving ? 'Saving…' : 'Add Student'}</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Student #</th>
                <th>RFID</th>
                <th>Email</th>
                <th>Program</th>
                <th>Year</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.student_number}</td>
                  <td>{s.rfid_tag}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.program || '—'}</td>
                  <td>{s.year_of_study ?? '—'}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost text-red-600" onClick={()=>removeStudent(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}



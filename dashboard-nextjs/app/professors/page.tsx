'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Professor = {
  id: string
  name: string
  email: string | null
  rfid_tag: string
  department: string | null
}

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [rfid, setRfid] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('professors')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setProfessors((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addProfessor = async () => {
    if (!name.trim() || !rfid.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from('professors').insert({
        name: name.trim(),
        rfid_tag: rfid.trim(),
        email: email.trim() || null,
        department: department.trim() || null,
      })
      if (error) throw error
      setName(''); setRfid(''); setEmail(''); setDepartment('')
      await load()
    } catch (e:any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const removeProfessor = async (id: string) => {
    if (!confirm('Delete this professor?')) return
    try {
      const { error } = await supabase.from('professors').delete().eq('id', id)
      if (error) {
        console.error('Delete error:', error)
        alert(`Failed to delete: ${error.message}`)
        return
      }
      console.log('Professor deleted successfully')
      await load()
    } catch (e: any) {
      console.error('Delete exception:', e)
      alert(`Delete failed: ${e.message}`)
    }
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Professors</h1>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Add Professor</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4">
          <input className="input" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="input" placeholder="RFID Tag" value={rfid} onChange={(e)=>setRfid(e.target.value)} />
          <input className="input" placeholder="Email (optional)" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="input" placeholder="Department (optional)" value={department} onChange={(e)=>setDepartment(e.target.value)} />
          <div className="md:col-span-4 flex justify-end">
            <button className="btn btn-primary" disabled={saving} onClick={addProfessor}>{saving ? 'Saving…' : 'Add Professor'}</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>RFID</th>
                <th>Department</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {professors.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.email || '—'}</td>
                  <td>{p.rfid_tag}</td>
                  <td>{p.department || '—'}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost text-red-600" onClick={()=>removeProfessor(p.id)}>Delete</button>
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



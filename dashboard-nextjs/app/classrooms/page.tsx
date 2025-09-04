'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Classroom = {
  id: string
  name: string
  building: string | null
  floor: number | null
  capacity: number | null
  esp32_device_id: string | null
}

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [building, setBuilding] = useState('')
  const [floor, setFloor] = useState<number | ''>('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [deviceId, setDeviceId] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setRooms((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addRoom = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from('classrooms').insert({
        name: name.trim(),
        building: building.trim() || null,
        floor: floor === '' ? null : Number(floor),
        capacity: capacity === '' ? null : Number(capacity),
        esp32_device_id: deviceId.trim() || null,
      })
      if (error) throw error
      setName(''); setBuilding(''); setFloor(''); setCapacity(''); setDeviceId('')
      await load()
    } catch (e:any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const removeRoom = async (id: string) => {
    if (!confirm('Delete this classroom?')) return
    try {
      const { error } = await supabase.from('classrooms').delete().eq('id', id)
      if (error) {
        console.error('Delete error:', error)
        alert(`Failed to delete: ${error.message}`)
        return
      }
      console.log('Classroom deleted successfully')
      await load()
    } catch (e: any) {
      console.error('Delete exception:', e)
      alert(`Delete failed: ${e.message}`)
    }
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Classrooms</h1>

      <div className="card">
        <div className="card-header"><h2 className="card-title">Add Classroom</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4">
          <input className="input" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="input" placeholder="Building (optional)" value={building} onChange={(e)=>setBuilding(e.target.value)} />
          <input className="input" type="number" placeholder="Floor (optional)" value={floor} onChange={(e)=>setFloor(e.target.value === '' ? '' : Number(e.target.value))} />
          <input className="input" type="number" placeholder="Capacity (optional)" value={capacity} onChange={(e)=>setCapacity(e.target.value === '' ? '' : Number(e.target.value))} />
          <input className="input" placeholder="ESP32 Device ID (optional)" value={deviceId} onChange={(e)=>setDeviceId(e.target.value)} />
          <div className="md:col-span-5 flex justify-end">
            <button className="btn btn-primary" disabled={saving} onClick={addRoom}>{saving ? 'Saving…' : 'Add Classroom'}</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Device ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.building || '—'}</td>
                  <td>{r.floor ?? '—'}</td>
                  <td>{r.capacity ?? '—'}</td>
                  <td>{r.esp32_device_id || '—'}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost text-red-600" onClick={()=>removeRoom(r.id)}>Delete</button>
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



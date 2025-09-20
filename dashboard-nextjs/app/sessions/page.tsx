'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase, Session } from '@/lib/supabase'
import { format } from 'date-fns'
import { Activity, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import StatusBadge from '@/components/ui/StatusBadge'
import ClassroomStatus from '@/components/ClassroomStatus'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          professor:professors(name, email),
          classroom:classrooms(name, building)
        `)
        .in('status', ['active','ended'])
        .order('start_time', { ascending: false })
        .limit(50)
      if (error) throw error
      setSessions((data as any) || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
  }, [])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
      </div>

      {/* Classroom Status */}
      <ClassroomStatus />

      {/* Subject Detection Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h3 className="text-sm font-semibold text-blue-800 mb-2">📚 Subject Detection Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-700">
          <div>
            <strong>Active Sessions:</strong><br/>
            {sessions.filter(s => s.status === 'active').length} currently active<br/>
            {sessions.filter(s => s.status === 'active' && (s.subject === 'Class Session' || s.subject === 'General Class Session')).length} need subject update
          </div>
          <div>
            <strong>Subject Detection:</strong><br/>
            {sessions.filter(s => s.status === 'active' && s.subject && s.subject !== 'Class Session' && s.subject !== 'General Class Session').length} properly detected<br/>
            {sessions.filter(s => s.status === 'active' && s.subject && s.subject !== 'Class Session' && s.subject !== 'General Class Session').map(s => s.subject).join(', ')}
          </div>
        </div>
        <div className="mt-3 space-x-2">
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.rpc('fix_session_subjects')
                if (error) throw error
                alert(`✅ Fixed ${data.updated_sessions} session subjects`)
                await load()
              } catch (err: any) {
                alert(`❌ Error: ${err.message}`)
              }
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded"
          >
            🔧 Fix Session Subjects
          </button>
          <button 
            onClick={async () => {
              try {
                const { data, error } = await supabase.rpc('fix_existing_sessions_absent_students')
                if (error) throw error
                alert(`✅ Fixed ${data.fixed_sessions} sessions with absent students`)
                await load()
              } catch (err: any) {
                alert(`❌ Error: ${err.message}`)
              }
            }}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded"
          >
            👥 Fix Absent Students
          </button>
        </div>
      </motion.div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            Recent Sessions
          </h2>
        </div>
        {sessions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Clock className="h-10 w-10 mx-auto mb-3" />
            No sessions to display
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(
              (sessions || []).reduce<Record<string, Session[]>>((acc, s) => {
                const building = ((s as any).classroom?.building) || 'Other'
                if (!acc[building]) acc[building] = []
                acc[building].push(s)
                return acc
              }, {})
            ).map(([building, list], bIdx) => (
              <div key={building} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">{building}</h3>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Professor</th>
                        <th>Subject</th>
                        <th>Classroom</th>
                        <th>Started</th>
                        <th>Ended</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((s, idx) => (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: (bIdx * 0.05) + idx * 0.03 }}
                        >
                          <td><StatusBadge status={(s.status as any) || 'active'} /></td>
                          <td className="font-medium">{(s as any).professor?.name}</td>
                          <td>{s.subject || 'Class Session'}</td>
                          <td>{(s as any).classroom?.name}</td>
                          <td>{format(new Date(s.start_time), 'dd MMM yyyy, HH:mm')}</td>
                          <td>{s.end_time ? format(new Date(s.end_time), 'dd MMM yyyy, HH:mm') : '-'}</td>
                          <td className="text-right">
                            <Link href={`/sessions/${s.id}`} className="btn btn-primary">
                              View attendance
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



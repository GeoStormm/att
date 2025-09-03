'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Attendance, Session } from '@/lib/supabase'
import { format } from 'date-fns'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

function toCSV(rows: Array<Record<string, any>>): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: any) => (
    v === null || v === undefined ? '' : String(v).replaceAll('"', '""')
  )
  const head = headers.map(h => `"${esc(h)}"`).join(',')
  const body = rows.map(r => headers.map(h => `"${esc(r[h])}"`).join(',')).join('\n')
  return `${head}\n${body}`
}

export default function SessionDetail() {
  const params = useParams()
  const sessionId = params?.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!sessionId) return
    try {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select(`
          *,
          professor:professors(name, email),
          classroom:classrooms(name, building)
        `)
        .eq('id', sessionId)
        .single()

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          *,
          student:students(name, student_number, email)
        `)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      setSession(sessionData)
      setAttendance(attendanceData || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const present = useMemo(() => attendance.filter(a => a.status === 'present'), [attendance])
  const late = useMemo(() => attendance.filter(a => a.status === 'late'), [attendance])

  const downloadCSV = () => {
    if (!session) return
    const rows = attendance.map(a => ({
      session_id: session.id,
      subject: session.subject,
      classroom: (session as any).classroom?.name,
      professor: (session as any).professor?.name,
      student_name: a.student?.name,
      student_number: a.student?.student_number,
      status: a.status,
      timestamp: format(new Date(a.timestamp), 'yyyy-MM-dd HH:mm:ss')
    }))
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(session.subject || 'session').replaceAll(' ', '_')}_${session.id}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 mb-4">Session not found</p>
        <Link className="btn btn-secondary" href="/sessions">Back to Sessions</Link>
      </div>
    )
  }

  const total = attendance.length
  const presentCount = present.length
  const lateCount = late.length
  const onTimeRate = total ? Math.round((presentCount / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{session.subject || 'Class Session'}</h1>
          <p className="text-gray-600 mt-1">
            {(session as any).professor?.name} • {(session as any).classroom?.name} ({(session as any).classroom?.building})
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Started {format(new Date(session.start_time), 'PPp')} • Late threshold {session.late_threshold_minutes}m • Status <StatusBadge status={(session.status as any) || 'active'} />
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/sessions" className="btn btn-secondary inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4"/>Back</Link>
          <button onClick={downloadCSV} className="btn btn-primary inline-flex items-center gap-2"><Download className="h-4 w-4"/>Download CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card"><div className="text-sm text-gray-600">Total</div><div className="text-2xl font-bold">{total}</div></div>
        <div className="card"><div className="text-sm text-gray-600">Present</div><div className="text-2xl font-bold text-success-600">{presentCount}</div></div>
        <div className="card"><div className="text-sm text-gray-600">Late</div><div className="text-2xl font-bold text-warning-600">{lateCount}</div></div>
        <div className="card"><div className="text-sm text-gray-600">On-time Rate</div><div className="text-2xl font-bold">{onTimeRate}%</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Present</h2></div>
          {present.length ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Student</th><th>Number</th><th>Time</th></tr></thead>
                <tbody>
                  {present.map(a => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.student?.name}</td>
                      <td>{a.student?.student_number}</td>
                      <td>{format(new Date(a.timestamp), 'HH:mm:ss')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-center text-gray-500 py-6">None</p>}
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">Late</h2></div>
          {late.length ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Student</th><th>Number</th><th>Time</th></tr></thead>
                <tbody>
                  {late.map(a => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.student?.name}</td>
                      <td>{a.student?.student_number}</td>
                      <td>{format(new Date(a.timestamp), 'HH:mm:ss')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-center text-gray-500 py-6">None</p>}
        </div>
      </div>
    </div>
  )
}



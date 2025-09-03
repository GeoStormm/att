'use client'

import { motion } from 'framer-motion'

interface StatusBadgeProps {
  status: 'present' | 'late' | 'absent' | 'active' | 'ended'
  className?: string
}

const statusConfig = {
  present: {
    label: 'Present',
    classes: 'bg-success-100 text-success-800 border-success-200',
    icon: '✅'
  },
  late: {
    label: 'Late',
    classes: 'bg-warning-100 text-warning-800 border-warning-200',
    icon: '⏰'
  },
  absent: {
    label: 'Absent',
    classes: 'bg-danger-100 text-danger-800 border-danger-200',
    icon: '❌'
  },
  active: {
    label: 'Active',
    classes: 'bg-primary-100 text-primary-800 border-primary-200',
    icon: '🟢'
  },
  ended: {
    label: 'Ended',
    classes: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '🔴'
  }
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.classes} ${className}`}
    >
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </motion.span>
  )
}

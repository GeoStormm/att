'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'primary' | 'success' | 'warning' | 'danger'
  change?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  primary: 'bg-primary-50 text-primary-600 border-primary-200',
  success: 'bg-success-50 text-success-600 border-success-200',
  warning: 'bg-warning-50 text-warning-600 border-warning-200',
  danger: 'bg-danger-50 text-danger-600 border-danger-200',
}

const iconColorClasses = {
  primary: 'bg-primary-100',
  success: 'bg-success-100',
  warning: 'bg-warning-100',
  danger: 'bg-danger-100',
}

export default function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  change.isPositive ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {change.isPositive ? '+' : ''}{change.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">from last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
          <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        </div>
      </div>
    </motion.div>
  )
}

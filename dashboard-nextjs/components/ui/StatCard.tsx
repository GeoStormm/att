'use client'

import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'emerald' | 'indigo' | 'red'
}

const colorClasses = {
  blue: 'text-blue-600 bg-blue-100',
  green: 'text-green-600 bg-green-100',
  purple: 'text-purple-600 bg-purple-100',
  orange: 'text-orange-600 bg-orange-100',
  emerald: 'text-emerald-600 bg-emerald-100',
  indigo: 'text-indigo-600 bg-indigo-100',
  red: 'text-red-600 bg-red-100'
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'blue' }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${
                  trendUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend}
                </span>
                {trend !== 'Live' && (
                  <motion.div
                    animate={{ y: trendUp ? [-2, 2, -2] : [2, -2, 2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`ml-1 w-2 h-2 rounded-full ${
                      trendUp ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  />
                )}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

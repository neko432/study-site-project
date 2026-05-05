'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { RoleSelection } from '@/components/role-selection'
import { TeacherDashboard } from '@/components/teacher/teacher-dashboard'
import { StudentDashboard } from '@/components/student/student-dashboard'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  const { role, isAuthenticated } = useAppStore()
  const [mounted, setMounted] = useState(false)

  // ハイドレーションの問題を避けるためにマウント後にのみレンダリング
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="text-muted-foreground">読み込み中...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="role-selection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <RoleSelection />
        </motion.div>
      ) : role === 'teacher' ? (
        <motion.div
          key="teacher"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <TeacherDashboard />
        </motion.div>
      ) : (
        <motion.div
          key="student"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <StudentDashboard />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

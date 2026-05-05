'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Users, X, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'

const TEACHER_PASSWORD = 'teacher123' // TODO: 実際の実装では環境変数などで管理

export function RoleSelection() {
  const { setRole, setAuthenticated, keepLoggedIn, setKeepLoggedIn } = useAppStore()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleTeacherClick = () => {
    setShowPasswordModal(true)
    setPassword('')
    setError('')
    setSuccess(false)
  }

  const handleStudentClick = () => {
    setRole('student')
    setAuthenticated(true)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === TEACHER_PASSWORD) {
      setSuccess(true)
      setTimeout(() => {
        setRole('teacher')
        setAuthenticated(true)
        setShowPasswordModal(false)
      }, 800)
    } else {
      setError('パスワードが間違っています')
      // エラー時のシェイクアニメーション
    }
  }

  const closeModal = () => {
    setShowPasswordModal(false)
    setPassword('')
    setError('')
    setSuccess(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-secondary/30 via-background to-accent/20">
      {/* 背景の装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12 relative z-10"
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          社会科学習サイト
        </motion.h1>
        <motion.p 
          className="text-lg text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          あなたの役割を選択してください
        </motion.p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6 relative z-10">
        {/* 先生ボタン */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        >
          <motion.button
            onClick={handleTeacherClick}
            className="group relative w-64 h-72 bg-card rounded-3xl shadow-xl border-2 border-primary/20 overflow-hidden"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              <motion.div
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <GraduationCap className="w-12 h-12 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">先生</h2>
              <p className="text-sm text-muted-foreground text-center">
                課題の作成・管理
                <br />
                生徒の回答を確認
              </p>
            </div>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>

        {/* 生徒ボタン */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
        >
          <motion.button
            onClick={handleStudentClick}
            className="group relative w-64 h-72 bg-card rounded-3xl shadow-xl border-2 border-secondary/20 overflow-hidden"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              <motion.div
                className="w-24 h-24 rounded-full bg-secondary/30 flex items-center justify-center mb-6"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Users className="w-12 h-12 text-secondary-foreground" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">生徒</h2>
              <p className="text-sm text-muted-foreground text-center">
                課題に取り組む
                <br />
                答え合わせをする
              </p>
            </div>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-secondary"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </div>

      {/* パスワードモーダル */}
      <AnimatePresence>
        {showPasswordModal && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            />
            
            {/* モーダル */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-3xl shadow-2xl p-8 z-50"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="text-center mb-6">
                <motion.div
                  className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4"
                  animate={success ? { scale: [1, 1.2, 1] } : {}}
                >
                  {success ? (
                    <Check className="w-8 h-8 text-success" />
                  ) : (
                    <GraduationCap className="w-8 h-8 text-primary" />
                  )}
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground">先生用ログイン</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  パスワードを入力してください
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    placeholder="パスワード"
                    className={`pr-12 h-12 text-lg ${error ? 'border-destructive' : ''}`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="flex items-center gap-2 text-destructive text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keep-logged-in"
                    checked={keepLoggedIn}
                    onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
                  />
                  <Label
                    htmlFor="keep-logged-in"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    ログイン状態を保持する
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-medium"
                  disabled={!password || success}
                >
                  <motion.span
                    whileTap={{ scale: 0.95 }}
                  >
                    {success ? 'ログイン成功!' : 'ログイン'}
                  </motion.span>
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                デモ用パスワード: teacher123
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

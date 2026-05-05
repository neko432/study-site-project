'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Users, X, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import type { StudentClass } from '@/lib/types'

const TEACHER_PASSWORD = 'teacher123'

// 特殊名前リスト
const SPECIAL_NAMES = ['熊田', '芝', '橋本']

// 名前に特殊文字が含まれているかチェック
const hasSpecialName = (name: string) => {
  return SPECIAL_NAMES.some(special => name.includes(special))
}

// 文字を1文字ずつアニメーション表示するコンポーネント
function AnimatedName({ name, onComplete }: { name: string; onComplete: () => void }) {
  const chars = name.split('')
  
  return (
    <motion.div 
      className="text-4xl font-bold text-primary text-center"
      onAnimationComplete={onComplete}
    >
      {chars.map((char, index) => (
        <motion.span
          key={index}
          className="inline-block special-name-bounce"
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: [1, 1.3, 1],
            rotate: [0, -10, 10, 0]
          }}
          transition={{
            delay: index * 0.15,
            duration: 0.6,
            ease: [0.68, -0.55, 0.265, 1.55]
          }}
          style={{
            textShadow: '0 0 20px oklch(0.50 0.14 250 / 0.6)'
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  )
}

export function RoleSelection() {
  const { 
    setRole, 
    setAuthenticated, 
    keepLoggedIn, 
    setKeepLoggedIn,
    setStudentName,
    setStudentClass,
    studentName: savedStudentName,
    studentClass: savedStudentClass
  } = useAppStore()
  
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showSpecialAnimation, setShowSpecialAnimation] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // 生徒入力
  const [inputStudentName, setInputStudentName] = useState(savedStudentName || '')
  const [inputStudentClass, setInputStudentClass] = useState<StudentClass>(savedStudentClass || '1')
  const [studentError, setStudentError] = useState('')

  const handleTeacherClick = () => {
    setShowPasswordModal(true)
    setPassword('')
    setError('')
    setSuccess(false)
  }

  const handleStudentClick = () => {
    setShowStudentModal(true)
    setStudentError('')
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
    }
  }

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputStudentName.trim()) {
      setStudentError('名前を入力してください')
      return
    }
    
    // 特殊名前チェック
    if (hasSpecialName(inputStudentName)) {
      setShowSpecialAnimation(true)
    } else {
      completeStudentLogin()
    }
  }

  const completeStudentLogin = useCallback(() => {
    setStudentName(inputStudentName.trim())
    setStudentClass(inputStudentClass)
    setRole('student')
    setAuthenticated(true)
    setShowStudentModal(false)
    setShowSpecialAnimation(false)
  }, [inputStudentName, inputStudentClass, setStudentName, setStudentClass, setRole, setAuthenticated])

  const closeModal = () => {
    setShowPasswordModal(false)
    setPassword('')
    setError('')
    setSuccess(false)
  }

  const closeStudentModal = () => {
    setShowStudentModal(false)
    setStudentError('')
    setShowSpecialAnimation(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* シンプルな背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-primary/3" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-primary/3" />
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
            className="group relative w-64 h-72 bg-card rounded-2xl shadow-lg border border-border overflow-hidden"
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
            className="group relative w-64 h-72 bg-card rounded-2xl shadow-lg border border-border overflow-hidden"
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="absolute inset-0 bg-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              <motion.div
                className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6"
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
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </div>

      {/* 先生用パスワードモーダル */}
      <AnimatePresence>
        {showPasswordModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 z-50 border border-border"
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
                  <motion.span whileTap={{ scale: 0.95 }}>
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

      {/* 生徒用登録モーダル */}
      <AnimatePresence>
        {showStudentModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeStudentModal}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 z-50 border border-border"
            >
              <button
                onClick={closeStudentModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* 特殊名前アニメーション表示 */}
              {showSpecialAnimation ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <AnimatedName 
                    name={inputStudentName} 
                    onComplete={() => {
                      setTimeout(completeStudentLogin, 800)
                    }} 
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: inputStudentName.length * 0.15 + 0.3 }}
                    className="mt-6 text-muted-foreground"
                  >
                    ようこそ!
                  </motion.p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <motion.div
                      className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4"
                    >
                      <Users className="w-8 h-8 text-secondary-foreground" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-foreground">生徒情報入力</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      クラスと名前を入力してください
                    </p>
                  </div>

                  <form onSubmit={handleStudentSubmit} className="space-y-5">
                    {/* クラス選択 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">クラス</Label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setInputStudentClass('1')}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                            inputStudentClass === '1'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 text-muted-foreground'
                          }`}
                        >
                          1組
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputStudentClass('2')}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                            inputStudentClass === '2'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 text-muted-foreground'
                          }`}
                        >
                          2組
                        </button>
                      </div>
                    </div>

                    {/* 名前入力 */}
                    <div className="space-y-2">
                      <Label htmlFor="student-name" className="text-sm font-medium">名前</Label>
                      <Input
                        id="student-name"
                        type="text"
                        value={inputStudentName}
                        onChange={(e) => {
                          setInputStudentName(e.target.value)
                          setStudentError('')
                        }}
                        placeholder="名前を入力"
                        className={`h-12 text-lg ${studentError ? 'border-destructive' : ''}`}
                        autoFocus
                      />
                    </div>

                    <AnimatePresence>
                      {studentError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="flex items-center gap-2 text-destructive text-sm"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>{studentError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-medium"
                    >
                      はじめる
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

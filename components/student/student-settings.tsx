'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, BookOpen, Save, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'

interface StudentSettingsProps {
  onBack: () => void
}

export function StudentSettings({ onBack }: StudentSettingsProps) {
  const { studentName, studentClass, setStudentInfo } = useAppStore()
  const [name, setName] = useState(studentName)
  const [selectedClass, setSelectedClass] = useState(studentClass)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!name.trim()) {
      setError('名前を入力してください')
      return
    }
    if (!selectedClass) {
      setError('クラスを選択してください')
      return
    }

    setStudentInfo(name.trim(), selectedClass)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onBack()
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b"
      >
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">設定</h1>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                プロフィール設定
              </CardTitle>
              <CardDescription>
                名前とクラスを変更できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Class Selection */}
              <div className="space-y-2">
                <Label htmlFor="class">クラス</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="クラスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1組</SelectItem>
                    <SelectItem value="2">2組</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  placeholder="名前を入力"
                />
              </div>

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm"
                >
                  {error}
                </motion.p>
              )}

              {/* Current info display */}
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">現在の設定</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{studentClass || '-'}組</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{studentName || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <Button
                onClick={handleSave}
                className="w-full h-12"
                disabled={saved}
              >
                {saved ? (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    保存しました
                  </motion.span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    保存
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

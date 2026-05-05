'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Users, Save, Check } from 'lucide-react'
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

const CLASS_OPTIONS = [
  '1-1', '1-2', '1-3', '1-4', '1-5',
  '2-1', '2-2', '2-3', '2-4', '2-5',
  '3-1', '3-2', '3-3', '3-4', '3-5'
]

export function StudentSettings({ onBack }: StudentSettingsProps) {
  const { studentName, studentClass, setStudentInfo } = useAppStore()
  
  const [name, setName] = useState(studentName)
  const [selectedClass, setSelectedClass] = useState(studentClass)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setStudentInfo(name, selectedClass)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onBack()
    }, 1500)
  }

  const isValid = name.trim().length > 0 && selectedClass.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
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

      <main className="container mx-auto px-4 py-8 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                プロフィール設定
              </CardTitle>
              <CardDescription>
                名前とクラスを変更できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 名前入力 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  名前
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="名前を入力..."
                  className="text-lg"
                />
              </div>

              {/* クラス選択 */}
              <div className="space-y-2">
                <Label htmlFor="class" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  クラス
                </Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="text-lg">
                    <SelectValue placeholder="クラスを選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}組
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 保存ボタン */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full h-12 text-lg gap-2"
                  onClick={handleSave}
                  disabled={!isValid || saved}
                >
                  {saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      保存しました
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      保存
                    </>
                  )}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 現在の情報 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">現在の設定</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">名前</p>
                  <p className="font-medium">{studentName || '未設定'}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">クラス</p>
                  <p className="font-medium">{studentClass ? `${studentClass}組` : '未設定'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

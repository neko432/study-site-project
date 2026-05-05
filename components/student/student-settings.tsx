'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, School, Save, LogOut } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'

interface StudentSettingsProps {
  onBack: () => void
}

const CLASS_OPTIONS = ['1-A', '1-B', '1-C', '2-A', '2-B', '2-C', '3-A', '3-B', '3-C']

export function StudentSettings({ onBack }: StudentSettingsProps) {
  const { studentName, studentClass, updateStudentInfo, logout } = useAppStore()
  
  const [name, setName] = useState(studentName)
  const [selectedClass, setSelectedClass] = useState(studentClass)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    if (name.trim() && selectedClass) {
      updateStudentInfo(name.trim(), selectedClass)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    }
  }

  const handleLogout = () => {
    logout()
    setShowLogoutDialog(false)
  }

  const hasChanges = name !== studentName || selectedClass !== studentClass

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">設定</h1>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* プロフィール設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                プロフィール
              </CardTitle>
              <CardDescription>
                名前とクラスを変更できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="名前を入力"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">クラス</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="クラスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        <span className="flex items-center gap-2">
                          <School className="w-4 h-4" />
                          {cls}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || !name.trim() || !selectedClass}
                className="w-full"
              >
                {isSaved ? (
                  <>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mr-2"
                    >
                      <Save className="w-4 h-4" />
                    </motion.span>
                    保存しました
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    変更を保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 現在の情報 */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">現在の登録情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">名前:</span>
                  <p className="font-medium">{studentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">クラス:</span>
                  <p className="font-medium">{studentClass}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ログアウト */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="w-5 h-5" />
                ログアウト
              </CardTitle>
              <CardDescription>
                ログアウトすると、役割選択画面に戻ります
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={() => setShowLogoutDialog(true)}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* ログアウト確認ダイアログ */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ログアウトしますか？</DialogTitle>
            <DialogDescription>
              ログアウトすると、役割選択画面に戻ります。提出済みの課題は保存されています。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

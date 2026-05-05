'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  Clock,
  CheckCircle,
  Circle,
  Calendar,
  FileText,
  ChevronRight,
  Filter,
  Settings,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { AssignmentView } from './assignment-view'
import { format, isPast, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'

export function StudentDashboard() {
  const { logout, assignments, submissions, currentStudentId, studentName, studentClass, updateStudentInfo } = useAppStore()
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'completed'>('all')
  const [showSettings, setShowSettings] = useState(false)
  const [editName, setEditName] = useState(studentName)
  const [editClass, setEditClass] = useState(studentClass)

  // 公開中の課題のみ表示
  const publishedAssignments = assignments.filter(a => a.status === 'published')

  // 自分の提出履歴をチェック
  const mySubmissions = submissions.filter(s => s.studentId === currentStudentId)

  // 課題の状態を取得
  const getAssignmentStatus = (assignmentId: string) => {
    const submission = mySubmissions.find(s => s.assignmentId === assignmentId)
    if (!submission) return 'not-started'
    if (submission.status === 'submitted') return 'completed'
    return 'in-progress'
  }

  // フィルタリング
  const filteredAssignments = publishedAssignments.filter(assignment => {
    const status = getAssignmentStatus(assignment.id)
    if (filter === 'completed') return status === 'completed'
    if (filter === 'incomplete') return status !== 'completed'
    return true
  })

  // 完了数をカウント
  const completedCount = publishedAssignments.filter(
    a => getAssignmentStatus(a.id) === 'completed'
  ).length

  if (selectedAssignment) {
    return (
      <AssignmentView
        assignmentId={selectedAssignment}
        onBack={() => setSelectedAssignment(null)}
      />
    )
  }

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
            <motion.h1
              className="text-2xl font-bold text-foreground"
              whileHover={{ scale: 1.02 }}
            >
              課題一覧
            </motion.h1>
            <Badge variant="secondary" className="text-sm">
              {completedCount}/{publishedAssignments.length} 完了
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => {
              setEditName(studentName)
              setEditClass(studentClass)
              setShowSettings(true)
            }}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              ログアウト
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {/* 進捗サマリー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    がんばっているね!
                  </h2>
                  <p className="text-muted-foreground">
                    {completedCount > 0
                      ? `${completedCount}件の課題を完了しました`
                      : '課題に取り組んでみよう!'}
                  </p>
                </div>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-primary"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 251' }}
                      animate={{
                        strokeDasharray: `${
                          (completedCount / Math.max(publishedAssignments.length, 1)) * 251
                        } 251`
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {publishedAssignments.length > 0
                        ? Math.round((completedCount / publishedAssignments.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* フィルターと課題一覧 */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <FileText className="w-4 h-4" />
                すべて
              </TabsTrigger>
              <TabsTrigger value="incomplete" className="gap-2">
                <Circle className="w-4 h-4" />
                未完了
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                完了済み
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment, index) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    status={getAssignmentStatus(assignment.id)}
                    submission={mySubmissions.find(s => s.assignmentId === assignment.id)}
                    index={index}
                    onClick={() => setSelectedAssignment(assignment.id)}
                  />
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <p className="text-lg text-muted-foreground">
                      {filter === 'completed'
                        ? 'まだ完了した課題がありません'
                        : filter === 'incomplete'
                        ? 'すべての課題が完了しています!'
                        : '課題がありません'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* 設定ダイアログ */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              生徒設定
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-class">クラス</Label>
              <Select value={editClass} onValueChange={setEditClass}>
                <SelectTrigger>
                  <SelectValue placeholder="クラスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1組</SelectItem>
                  <SelectItem value="2">2組</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">名前</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="名前を入力"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={() => {
                updateStudentInfo(editName, editClass)
                setShowSettings(false)
              }}
              disabled={!editName.trim() || !editClass}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AssignmentCard({
  assignment,
  status,
  submission,
  index,
  onClick
}: {
  assignment: NonNullable<ReturnType<typeof useAppStore>['assignments'][0]>
  status: 'not-started' | 'in-progress' | 'completed'
  submission?: NonNullable<ReturnType<typeof useAppStore>['submissions'][0]>
  index: number
  onClick: () => void
}) {
  const deadline = new Date(assignment.deadline)
  const isOverdue = isPast(deadline)
  const daysLeft = differenceInDays(deadline, new Date())

  const statusConfig = {
    'not-started': {
      badge: '未着手',
      badgeVariant: 'outline' as const,
      icon: <Circle className="w-5 h-5 text-muted-foreground" />
    },
    'in-progress': {
      badge: '作業中',
      badgeVariant: 'secondary' as const,
      icon: <Clock className="w-5 h-5 text-secondary-foreground" />
    },
    'completed': {
      badge: '完了',
      badgeVariant: 'default' as const,
      icon: <CheckCircle className="w-5 h-5 text-success" />
    }
  }

  const config = statusConfig[status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={`cursor-pointer overflow-hidden transition-shadow hover:shadow-lg ${
          status === 'completed' ? 'bg-success/5 border-success/30' : ''
        } ${isOverdue && status !== 'completed' ? 'border-destructive/50' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* ステータスアイコン */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
              className={`p-3 rounded-xl ${
                status === 'completed'
                  ? 'bg-success/10'
                  : status === 'in-progress'
                  ? 'bg-secondary/30'
                  : 'bg-muted'
              }`}
            >
              {config.icon}
            </motion.div>

            {/* コンテンツ */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {assignment.title}
                </h3>
                <Badge variant={config.badgeVariant}>{config.badge}</Badge>
                {isOverdue && status !== 'completed' && (
                  <Badge variant="destructive">期限超過</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {assignment.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  期限: {format(deadline, 'M月d日 HH:mm', { locale: ja })}
                  {!isOverdue && daysLeft <= 3 && daysLeft >= 0 && (
                    <span className="text-destructive font-medium ml-1">
                      (あと{daysLeft === 0 ? '今日まで' : `${daysLeft}日`})
                    </span>
                  )}
                </span>
                <span>
                  問題数: {assignment.elements.filter(e => e.type === 'answer-box').length}問
                </span>
              </div>
              {submission && status === 'completed' && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    提出日: {format(new Date(submission.submittedAt), 'M月d日 HH:mm', { locale: ja })}
                  </Badge>
                  {submission.history.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      {submission.history.length}回提出
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* 矢印 */}
            <motion.div
              initial={{ x: -5, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.3 }}
            >
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

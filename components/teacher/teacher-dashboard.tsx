'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  FileText, 
  Clock, 
  Users, 
  LogOut, 
  Settings,
  Calendar,
  Printer,
  Save,
  Upload,
  Edit3,
  Trash2,
  Eye,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { AssignmentEditor } from './assignment-editor'
import { SubmissionViewer } from './submission-viewer'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export function TeacherDashboard() {
  const { logout, assignments, templates, submissions, deleteAssignment } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [viewingSubmissions, setViewingSubmissions] = useState<string | null>(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [printAssignmentId, setPrintAssignmentId] = useState<string | null>(null)
  const [printWithAnswers, setPrintWithAnswers] = useState(true)

  const publishedAssignments = assignments.filter(a => a.status === 'published')
  const scheduledAssignments = assignments.filter(a => a.status === 'scheduled')
  const draftAssignments = assignments.filter(a => a.status === 'draft')

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteAssignment(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const handlePrint = () => {
    if (!printAssignmentId) return
    const assignment = assignments.find(a => a.id === printAssignmentId)
    if (!assignment) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const html = generatePrintHTML(assignment, printWithAnswers)
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
    setShowPrintDialog(false)
    setPrintAssignmentId(null)
  }

  const openPrintDialog = (assignmentId: string) => {
    setPrintAssignmentId(assignmentId)
    setShowPrintDialog(true)
  }

  // 概要カードからの遷移
  const handleStatsCardClick = (target: string) => {
    if (target === 'published') setActiveTab('assignments')
    else if (target === 'scheduled') setActiveTab('assignments')
    else if (target === 'drafts') setActiveTab('assignments')
    else if (target === 'submissions') setActiveTab('submissions')
  }

  if (editingAssignment !== null) {
    return (
      <AssignmentEditor
        assignmentId={editingAssignment}
        onBack={() => setEditingAssignment(null)}
      />
    )
  }

  if (viewingSubmissions) {
    return (
      <SubmissionViewer
        assignmentId={viewingSubmissions}
        onBack={() => setViewingSubmissions(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.h1 
              className="text-2xl font-bold text-foreground"
              whileHover={{ scale: 1.02 }}
            >
              先生用ダッシュボード
            </motion.h1>
            <Badge variant="secondary" className="text-sm">
              {publishedAssignments.length} 件の課題を公開中
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSettingsDialog(true)}>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4 h-12">
            <TabsTrigger value="overview" className="text-sm">概要</TabsTrigger>
            <TabsTrigger value="assignments" className="text-sm">課題管理</TabsTrigger>
            <TabsTrigger value="templates" className="text-sm">テンプレート</TabsTrigger>
            <TabsTrigger value="submissions" className="text-sm">提出確認</TabsTrigger>
          </TabsList>

          {/* 概要タブ */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={<FileText className="w-6 h-6" />}
                title="公開中の課題"
                value={publishedAssignments.length}
                color="primary"
                onClick={() => handleStatsCardClick('published')}
              />
              <StatsCard
                icon={<Clock className="w-6 h-6" />}
                title="予約投稿"
                value={scheduledAssignments.length}
                color="accent"
                onClick={() => handleStatsCardClick('scheduled')}
              />
              <StatsCard
                icon={<Edit3 className="w-6 h-6" />}
                title="下書き"
                value={draftAssignments.length}
                color="muted"
                onClick={() => handleStatsCardClick('drafts')}
              />
              <StatsCard
                icon={<Users className="w-6 h-6" />}
                title="総提出数"
                value={submissions.length}
                color="secondary"
                onClick={() => handleStatsCardClick('submissions')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    最近の課題
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignments.slice(0, 3).map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => setEditingAssignment(assignment.id)}
                    >
                      <div>
                        <p className="font-medium text-foreground">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          期限: {format(new Date(assignment.deadline), 'M月d日', { locale: ja })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          assignment.status === 'published'
                            ? 'default'
                            : assignment.status === 'scheduled'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {assignment.status === 'published'
                          ? '公開中'
                          : assignment.status === 'scheduled'
                          ? '予約'
                          : '下書き'}
                      </Badge>
                    </motion.div>
                  ))}
                  {assignments.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      まだ課題がありません
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary-foreground" />
                    最近の提出
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {submissions.slice(0, 3).map((submission, index) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => setViewingSubmissions(submission.assignmentId)}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {submission.studentName}
                          <span className="text-muted-foreground ml-2 text-sm">
                            ({submission.studentClass}組)
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(submission.submittedAt), 'M月d日 HH:mm', { locale: ja })}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {submission.status === 'submitted' ? '提出済' : '作業中'}
                      </Badge>
                    </motion.div>
                  ))}
                  {submissions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      まだ提出がありません
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 新規作成ボタン */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                onClick={() => setEditingAssignment('new')}
                className="w-full h-16 text-lg gap-3 rounded-xl shadow-lg"
              >
                <Plus className="w-6 h-6" />
                新しい課題を作成
              </Button>
            </motion.div>
          </TabsContent>

          {/* 課題管理タブ */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">課題一覧</h2>
              <Button onClick={() => setEditingAssignment('new')} className="gap-2">
                <Plus className="w-4 h-4" />
                新規作成
              </Button>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground">
                              {assignment.title}
                            </h3>
                            <Badge
                              variant={
                                assignment.status === 'published'
                                  ? 'default'
                                  : assignment.status === 'scheduled'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {assignment.status === 'published'
                                ? '公開中'
                                : assignment.status === 'scheduled'
                                ? '予約'
                                : '下書き'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {assignment.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              期限: {format(new Date(assignment.deadline), 'yyyy年M月d日', { locale: ja })}
                              {assignment.deadlineTime && ` ${assignment.deadlineTime.hour}:${String(assignment.deadlineTime.minute).padStart(2, '0')}`}
                            </span>
                            <span>
                              問題数: {assignment.elements.filter(e => e.type === 'answer-box').length}問
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingSubmissions(assignment.id)}
                            title="提出確認"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAssignment(assignment.id)}
                            title="編集"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPrintDialog(assignment.id)}
                            title="印刷"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(assignment.id)}
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {assignments.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">まだ課題がありません</p>
                    <Button onClick={() => setEditingAssignment('new')}>
                      最初の課題を作成
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* テンプレートタブ */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">テンプレート一覧</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* プリセットテンプレート */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">歴史ワークシート</CardTitle>
                    <CardDescription>
                      教科書の内容を穴埋め形式で確認できるテンプレート
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setEditingAssignment('template-history')}
                    >
                      このテンプレートを使用
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">地理確認テスト</CardTitle>
                    <CardDescription>
                      地図と組み合わせた確認問題用テンプレート
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      このテンプレートを使用
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">白紙から作成</CardTitle>
                    <CardDescription>
                      自由にカスタマイズできる空のテンプレート
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setEditingAssignment('new')}
                    >
                      新規作成
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 保存済みテンプレート */}
              {templates.map((template) => (
                <motion.div 
                  key={template.id}
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        このテンプレートを使用
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* 提出確認タブ */}
          <TabsContent value="submissions" className="space-y-6">
            <h2 className="text-xl font-bold">提出状況</h2>

            {assignments.map((assignment) => {
              const assignmentSubmissions = submissions.filter(
                s => s.assignmentId === assignment.id
              )
              const class1Submissions = assignmentSubmissions.filter(s => s.studentClass === '1')
              const class2Submissions = assignmentSubmissions.filter(s => s.studentClass === '2')
              
              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">1組: {class1Submissions.length}件</Badge>
                        <Badge variant="outline">2組: {class2Submissions.length}件</Badge>
                        <Badge>{assignmentSubmissions.length}件の提出</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignmentSubmissions.length > 0 ? (
                      <div className="space-y-4">
                        {/* クラス別表示 */}
                        {['1', '2'].map((classNum) => {
                          const classSubmissions = assignmentSubmissions.filter(
                            s => s.studentClass === classNum
                          )
                          if (classSubmissions.length === 0) return null
                          
                          return (
                            <div key={classNum}>
                              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                {classNum}組
                              </h4>
                              <div className="space-y-2">
                                {classSubmissions.map((submission) => (
                                  <div
                                    key={submission.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                  >
                                    <div>
                                      <p className="font-medium">{submission.studentName}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(submission.submittedAt), 'M月d日 HH:mm', { locale: ja })}
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setViewingSubmissions(assignment.id)}
                                    >
                                      確認
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        まだ提出がありません
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>
      </main>

      {/* 設定ダイアログ */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>設定</DialogTitle>
            <DialogDescription>
              アプリケーションの設定を変更できます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">表示設定</h4>
              <p className="text-sm text-muted-foreground">
                現在利用可能な設定はありません。今後のアップデートで追加予定です。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>課題を削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。関連する提出データも削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 印刷ダイアログ */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>印刷オプション</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-answers"
                checked={printWithAnswers}
                onCheckedChange={(checked) => setPrintWithAnswers(checked as boolean)}
              />
              <Label htmlFor="print-answers">答えを含めて印刷する</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              印刷
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatsCard({
  icon,
  title,
  value,
  color,
  onClick
}: {
  icon: React.ReactNode
  title: string
  value: number
  color: 'primary' | 'secondary' | 'accent' | 'muted'
  onClick?: () => void
}) {
  const bgColors = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    muted: 'bg-muted'
  }
  
  const textColors = {
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    accent: 'text-accent-foreground',
    muted: 'text-muted-foreground'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bgColors[color]}`}>
              <div className={textColors[color]}>{icon}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function generatePrintHTML(assignment: ReturnType<typeof useAppStore>['assignments'][0], withAnswers: boolean): string {
  let content = ''
  
  assignment.elements.forEach(el => {
    switch (el.type) {
      case 'heading':
        content += `<h2 style="font-size: 1.5rem; font-weight: bold; margin: 1rem 0;">${el.content}</h2>`
        break
      case 'text':
        content += `<p style="margin: 0.5rem 0;">${el.content}</p>`
        break
      case 'question-label':
        content += `<p style="font-weight: 500; margin: 1rem 0 0.5rem;">${el.content}</p>`
        break
      case 'answer-box':
        content += `<div style="margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
          <span style="background: #fee2e2; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">${el.content}</span>
          ${withAnswers && el.answer ? `<span style="color: #dc2626; font-weight: 500;">${el.answer}</span>` : '<span style="color: #999;">_____________</span>'}
        </div>`
        break
      case 'divider':
        content += '<hr style="margin: 1rem 0; border: none; border-top: 1px solid #ccc;" />'
        break
    }
  })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${assignment.title}</title>
  <style>
    body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1 style="font-size: 1.75rem; margin-bottom: 0.5rem;">${assignment.title}</h1>
  ${assignment.description ? `<p style="color: #666; margin-bottom: 1.5rem;">${assignment.description}</p>` : ''}
  ${content}
</body>
</html>`
}

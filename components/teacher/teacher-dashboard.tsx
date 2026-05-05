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
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [assignmentToPrint, setAssignmentToPrint] = useState<string | null>(null)
  const [printWithAnswers, setPrintWithAnswers] = useState(true)

  const handleDeleteClick = (assignmentId: string) => {
    setAssignmentToDelete(assignmentId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (assignmentToDelete) {
      deleteAssignment(assignmentToDelete)
    }
    setDeleteDialogOpen(false)
    setAssignmentToDelete(null)
  }

  const handlePrintClick = (assignmentId: string) => {
    setAssignmentToPrint(assignmentId)
    setPrintDialogOpen(true)
  }

  const handlePrint = () => {
    const assignment = assignments.find(a => a.id === assignmentToPrint)
    if (assignment) {
      // 印刷用のウィンドウを開く
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!printWindow) {
        alert('ポップアップがブロックされました。ポップアップを許可してください。')
        setPrintDialogOpen(false)
        setAssignmentToPrint(null)
        return
      }
      
      // 印刷用HTMLを生成
      const elementsHTML = assignment.elements.map(el => {
        switch (el.type) {
          case 'heading':
            return `<h2 style="font-size: 1.25rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem;">${el.content}</h2>`
          case 'text':
            return `<p style="line-height: 1.75;">${el.content}</p>`
          case 'question-label':
            return `<p style="font-weight: 500; margin-top: 1rem;">${el.content}</p>`
          case 'answer-box':
            const answerDisplay = printWithAnswers && el.answer 
              ? `<span style="position: absolute; left: 8px; bottom: 2px; color: #dc2626; font-weight: 500;">${el.answer}</span>`
              : ''
            return `
              <div style="display: flex; align-items: center; gap: 12px; margin: 8px 0 8px 16px;">
                <span style="font-weight: 500; font-size: 0.875rem; border: 1px solid black; border-radius: 4px; padding: 2px 8px;">${el.content}</span>
                <div style="flex: 1; border-bottom: 1px solid black; min-height: 24px; position: relative;">
                  ${answerDisplay}
                </div>
              </div>
            `
          case 'divider':
            return `<hr style="border-top: 1px solid #9ca3af; margin: 1rem 0;" />`
          case 'image':
            if (el.src) {
              const width = el.size?.width === 'full' ? '100%' : (el.size?.width || 'auto')
              return `<div style="margin: 1rem 0;"><img src="${el.src}" style="max-width: 100%; width: ${width};" /></div>`
            }
            return ''
          default:
            return ''
        }
      }).join('')

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${assignment.title || '課題'} - 印刷</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
              line-height: 1.6; color: #000; background: #fff; padding: 20px; max-width: 800px; margin: 0 auto;
            }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">${assignment.title || '無題の課題'}</h1>
                ${assignment.description ? `<p style="font-size: 0.875rem; margin-top: 0.5rem; color: #4b5563;">${assignment.description}</p>` : ''}
              </div>
              <div style="text-align: right;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 0.875rem;">クラス:</span>
                  <span style="border-bottom: 1px solid #000; min-width: 80px; display: inline-block;">&nbsp;</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                  <span style="font-size: 0.875rem;">名前:</span>
                  <span style="border-bottom: 1px solid #000; min-width: 120px; display: inline-block;">&nbsp;</span>
                </div>
              </div>
            </div>
          </div>
          <div>${elementsHTML}</div>
          <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #d1d5db; font-size: 0.75rem; color: #6b7280; text-align: center;">
            ${printWithAnswers ? '【解答付き】' : ''}
          </div>
        </body>
        </html>
      `
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    setPrintDialogOpen(false)
    setAssignmentToPrint(null)
  }

  const publishedAssignments = assignments.filter(a => a.status === 'published')
  const scheduledAssignments = assignments.filter(a => a.status === 'scheduled')
  const draftAssignments = assignments.filter(a => a.status === 'draft')

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
        className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b"
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
            <Button variant="ghost" size="icon">
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
                onClick={() => setActiveTab('assignments')}
              />
              <StatsCard
                icon={<Clock className="w-6 h-6" />}
                title="予約投稿"
                value={scheduledAssignments.length}
                color="accent"
                onClick={() => setActiveTab('assignments')}
              />
              <StatsCard
                icon={<Edit3 className="w-6 h-6" />}
                title="下書き"
                value={draftAssignments.length}
                color="muted"
                onClick={() => setActiveTab('assignments')}
              />
              <StatsCard
                icon={<Users className="w-6 h-6" />}
                title="総提出数"
                value={submissions.length}
                color="secondary"
                onClick={() => setActiveTab('submissions')}
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
                    <motion.button
                      key={assignment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEditingAssignment(assignment.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all duration-200 cursor-pointer group"
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          期限: {format(new Date(assignment.deadline), 'M月d日', { locale: ja })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.button>
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
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{submission.studentName}</p>
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
                className="w-full h-16 text-lg gap-3 rounded-2xl shadow-lg"
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
                              期限: {format(new Date(assignment.deadline), 'yyyy年M月d日 HH:mm', { locale: ja })}
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
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAssignment(assignment.id)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrintClick(assignment.id)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(assignment.id)}
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
              
              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <Badge>{assignmentSubmissions.length}件の提出</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignmentSubmissions.length > 0 ? (
                      <div className="space-y-2">
                        {assignmentSubmissions.map((submission) => (
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

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>課題を削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。課題に関連するすべてのデータが削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 印刷ダイアログ */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              印刷オプション
            </DialogTitle>
            <DialogDescription>
              印刷する内容を選択してください
            </DialogDescription>
          </DialogHeader>
          <motion.div 
            className="py-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-4">
              <motion.div 
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  printWithAnswers 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setPrintWithAnswers(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Checkbox
                  id="print-with-answers"
                  checked={printWithAnswers}
                  onCheckedChange={(checked) => setPrintWithAnswers(checked as boolean)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="print-with-answers"
                    className="text-base font-medium cursor-pointer"
                  >
                    答えを含めて印刷
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    解答欄に正解が表示されます（採点用）
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  !printWithAnswers 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setPrintWithAnswers(false)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Checkbox
                  id="print-without-answers"
                  checked={!printWithAnswers}
                  onCheckedChange={(checked) => setPrintWithAnswers(!(checked as boolean))}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="print-without-answers"
                    className="text-base font-medium cursor-pointer"
                  >
                    答えなしで印刷
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    解答欄は空欄のまま印刷されます（配布用）
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              キャンセル
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                印刷する
              </Button>
            </motion.div>
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
    secondary: 'bg-secondary/30',
    accent: 'bg-accent/30',
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
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className="cursor-pointer"
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

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
import { useAppStore } from '@/lib/store'
import { AssignmentEditor } from './assignment-editor'
import { SubmissionViewer } from './submission-viewer'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export function TeacherDashboard() {
  const { logout, assignments, templates, submissions } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [viewingSubmissions, setViewingSubmissions] = useState<string | null>(null)

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
              />
              <StatsCard
                icon={<Clock className="w-6 h-6" />}
                title="予約投稿"
                value={scheduledAssignments.length}
                color="accent"
              />
              <StatsCard
                icon={<Edit3 className="w-6 h-6" />}
                title="下書き"
                value={draftAssignments.length}
                color="muted"
              />
              <StatsCard
                icon={<Users className="w-6 h-6" />}
                title="総提出数"
                value={submissions.length}
                color="secondary"
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
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
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
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
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
    </div>
  )
}

function StatsCard({
  icon,
  title,
  value,
  color
}: {
  icon: React.ReactNode
  title: string
  value: number
  color: 'primary' | 'secondary' | 'accent' | 'muted'
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
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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

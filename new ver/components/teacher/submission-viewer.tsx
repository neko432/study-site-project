'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Clock, History, Check, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface SubmissionViewerProps {
  assignmentId: string
  onBack: () => void
}

export function SubmissionViewer({ assignmentId, onBack }: SubmissionViewerProps) {
  const { assignments, submissions } = useAppStore()
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const assignment = assignments.find(a => a.id === assignmentId)
  const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId)

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>課題が見つかりません</p>
      </div>
    )
  }

  const answerElements = assignment.elements.filter(e => e.type === 'answer-box')

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
            <div>
              <h1 className="text-xl font-bold text-foreground">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground">
                提出状況: {assignmentSubmissions.length}件
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 提出一覧 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  提出者一覧
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {assignmentSubmissions.length > 0 ? (
                      assignmentSubmissions.map((submission, index) => (
                        <motion.button
                          key={submission.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`w-full p-4 rounded-xl text-left transition-colors ${
                            selectedSubmission === submission.id
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-muted/50 hover:bg-muted border-2 border-transparent'
                          }`}
                          onClick={() => setSelectedSubmission(submission.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {submission.studentName}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(submission.submittedAt), 'M月d日 HH:mm', { locale: ja })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {submission.history.length > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {submission.history.length}回
                                </Badge>
                              )}
                              <Badge
                                variant={submission.status === 'submitted' ? 'default' : 'secondary'}
                              >
                                {submission.status === 'submitted' ? '提出済' : '作業中'}
                              </Badge>
                            </div>
                          </div>
                        </motion.button>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>まだ提出がありません</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* 回答比較表示 */}
          <div className="lg:col-span-2">
            {selectedSubmission ? (
              <SubmissionDetail
                submission={submissions.find(s => s.id === selectedSubmission)!}
                assignment={assignment}
                answerElements={answerElements}
                onShowHistory={() => setShowHistory(true)}
              />
            ) : (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>左の一覧から提出者を選択してください</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* 履歴ダイアログ */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>提出履歴</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <SubmissionHistory
              submission={submissions.find(s => s.id === selectedSubmission)!}
              answerElements={answerElements}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SubmissionDetail({
  submission,
  assignment,
  answerElements,
  onShowHistory
}: {
  submission: NonNullable<ReturnType<typeof useAppStore>['submissions'][0]>
  assignment: NonNullable<ReturnType<typeof useAppStore>['assignments'][0]>
  answerElements: NonNullable<ReturnType<typeof useAppStore>['assignments'][0]>['elements']
  onShowHistory: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{submission.studentName} の回答</CardTitle>
          {submission.history.length > 1 && (
            <Button variant="outline" size="sm" onClick={onShowHistory}>
              <History className="w-4 h-4 mr-2" />
              履歴を見る ({submission.history.length}回)
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="compare">
          <TabsList className="mb-4">
            <TabsTrigger value="compare">比較表示</TabsTrigger>
            <TabsTrigger value="student">生徒の回答のみ</TabsTrigger>
            <TabsTrigger value="answer">正解のみ</TabsTrigger>
          </TabsList>

          <TabsContent value="compare">
            <div className="space-y-4">
              {answerElements.map((element, index) => {
                const studentAnswer = submission.answers[element.id] || ''
                const correctAnswer = element.answer || ''
                const isCorrect = studentAnswer.trim() === correctAnswer.trim()

                return (
                  <motion.div
                    key={element.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-muted/30 border"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{element.content}</Badge>
                      {isCorrect ? (
                        <Badge className="bg-success text-success-foreground">
                          <Check className="w-3 h-3 mr-1" />
                          正解
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <X className="w-3 h-3 mr-1" />
                          不正解
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">生徒の回答</p>
                        <p className={`p-2 rounded-lg ${
                          isCorrect ? 'bg-success/10' : 'bg-destructive/10'
                        }`}>
                          {studentAnswer || '(未回答)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">正解</p>
                        <p className="p-2 rounded-lg bg-answer/10 text-answer font-medium">
                          {correctAnswer}
                        </p>
                      </div>
                    </div>
                    {element.importantPoint && (
                      <div className="mt-3 p-2 rounded-lg bg-accent/30">
                        <p className="text-xs text-muted-foreground mb-1">重要ポイント</p>
                        <p className="text-sm">{element.importantPoint}</p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="student">
            <div className="space-y-3">
              {answerElements.map((element) => (
                <div key={element.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <Badge variant="outline">{element.content}</Badge>
                  <span>{submission.answers[element.id] || '(未回答)'}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="answer">
            <div className="space-y-3">
              {answerElements.map((element) => (
                <div key={element.id} className="flex items-center gap-4 p-3 rounded-lg bg-answer/10">
                  <Badge variant="outline">{element.content}</Badge>
                  <span className="text-answer font-medium">{element.answer}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 正答率 */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">正答率</span>
            <span className="text-2xl font-bold">
              {Math.round(
                (answerElements.filter(
                  e => (submission.answers[e.id] || '').trim() === (e.answer || '').trim()
                ).length / answerElements.length) * 100
              )}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${
                  (answerElements.filter(
                    e => (submission.answers[e.id] || '').trim() === (e.answer || '').trim()
                  ).length / answerElements.length) * 100
                }%`
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-success"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SubmissionHistory({
  submission,
  answerElements
}: {
  submission: NonNullable<ReturnType<typeof useAppStore>['submissions'][0]>
  answerElements: NonNullable<ReturnType<typeof useAppStore>['assignments'][0]>['elements']
}) {
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {submission.history.map((historyItem, index) => (
          <div key={index} className="p-4 rounded-xl bg-muted/30 border">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline">
                提出 {index + 1}回目
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(historyItem.submittedAt), 'M月d日 HH:mm', { locale: ja })}
              </span>
            </div>
            <div className="space-y-2">
              {answerElements.map((element) => (
                <div key={element.id} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{element.content}:</span>
                  <span>{historyItem.answers[element.id] || '(未回答)'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

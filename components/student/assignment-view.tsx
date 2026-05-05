'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Send,
  AlertCircle,
  Check,
  Clock,
  RotateCcw,
  BookOpen,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { isPast } from 'date-fns'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface AssignmentViewProps {
  assignmentId: string
  onBack: () => void
}

export function AssignmentView({ assignmentId, onBack }: AssignmentViewProps) {
  const { assignments, submissions, currentStudentId, addSubmission, updateSubmission } = useAppStore()

  const assignment = assignments.find(a => a.id === assignmentId)
  const existingSubmission = submissions.find(
    s => s.assignmentId === assignmentId && s.studentId === currentStudentId
  )

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (existingSubmission) {
      return { ...existingSubmission.answers }
    }
    return {}
  })
  const [showAnswers, setShowAnswers] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false)
  const [showAnswerConfirm, setShowAnswerConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [viewMode, setViewMode] = useState<'work' | 'review'>('work')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>課題が見つかりません</p>
      </div>
    )
  }

  const answerElements = assignment.elements.filter(e => e.type === 'answer-box')
  
  // 答え番号のマッピングを作成
  const answerIndexMap = useMemo(() => {
    const map: Record<string, number> = {}
    answerElements.forEach((el, idx) => {
      map[el.id] = idx + 1
    })
    return map
  }, [answerElements])
  
  const filledCount = answerElements.filter(e => answers[e.id]?.trim()).length
  const totalCount = answerElements.length
  const progress = (filledCount / totalCount) * 100
  const isComplete = filledCount === totalCount
  const isOverdue = isPast(new Date(assignment.deadline))
  const isSubmitted = existingSubmission?.status === 'submitted'

  // 自動保存機能
  const autoSaveProgress = useCallback(() => {
    if (Object.keys(answers).length > 0 && !isSubmitted) {
      const submissionData = {
        answers,
        submittedAt: new Date(),
        status: 'in-progress' as const
      }

      if (existingSubmission) {
        updateSubmission(existingSubmission.id, submissionData)
      } else {
        addSubmission({
          id: `submission-${Date.now()}`,
          assignmentId,
          studentId: currentStudentId,
          studentName: '生徒',
          answers,
          submittedAt: new Date(),
          history: [],
          status: 'in-progress'
        })
      }
      setLastSaved(new Date())
    }
  }, [answers, isSubmitted, existingSubmission, updateSubmission, addSubmission, assignmentId, currentStudentId])

  // 回答が変更されたら自動保存（デバウンス付き）
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveProgress()
    }, 3000) // 3秒後に自動保存

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [answers, autoSaveProgress])

  // ページを離れる前に保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      autoSaveProgress()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [autoSaveProgress])

  const handleAnswerChange = (elementId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [elementId]: value }))
  }

  const handleSubmitClick = () => {
    if (isComplete) {
      setShowSubmitDialog(true)
    } else {
      setShowIncompleteWarning(true)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // シミュレートされた提出処理
    await new Promise(resolve => setTimeout(resolve, 1000))

    const submissionData = {
      answers,
      submittedAt: new Date(),
      status: 'submitted' as const
    }

    if (existingSubmission) {
      updateSubmission(existingSubmission.id, {
        ...submissionData,
        history: [
          ...existingSubmission.history,
          { answers, submittedAt: new Date() }
        ]
      })
    } else {
      addSubmission({
        id: `submission-${Date.now()}`,
        assignmentId,
        studentId: currentStudentId,
        studentName: '生徒1', // TODO: 実際のユーザー名を使用
        answers,
        submittedAt: new Date(),
        history: [{ answers, submittedAt: new Date() }],
        status: 'submitted'
      })
    }

    setIsSubmitting(false)
    setSubmitSuccess(true)
    setShowSubmitDialog(false)
    setShowIncompleteWarning(false)

    // 成功後、少し待ってから戻る
    setTimeout(() => {
      onBack()
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground line-clamp-1">
                  {assignment.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  期限: {format(new Date(assignment.deadline), 'M月d日 HH:mm', { locale: ja })}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">期限超過</Badge>
                  )}
                  {isSubmitted && (
                    <Badge className="bg-success text-success-foreground text-xs">提出済み</Badge>
                  )}
                  {lastSaved && !isSubmitted && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Save className="w-3 h-3" />
                      保存済み
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showAnswers ? 'default' : 'outline'}
                onClick={() => {
                  if (showAnswers) {
                    setShowAnswers(false)
                  } else {
                    setShowAnswerConfirm(true)
                  }
                }}
                className="gap-2"
              >
                {showAnswers ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    答えを隠す
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    答えを見る
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="mt-3 flex items-center gap-4">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm font-medium text-muted-foreground">
              {filledCount}/{totalCount}
            </span>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 問題・回答エリア */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    問題
                  </CardTitle>
                  {viewMode === 'review' && isSubmitted && (
                    <Badge variant="outline">確認モード</Badge>
                  )}
                </div>
                {assignment.description && (
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {assignment.elements.map((element, index) => (
                      <ElementDisplay
                        key={element.id}
                        element={element}
                        index={index}
                        answer={answers[element.id] || ''}
                        onAnswerChange={(value) => handleAnswerChange(element.id, value)}
                        showAnswer={showAnswers}
                        isSubmitted={isSubmitted && !isOverdue ? false : isSubmitted}
                        isOverdue={isOverdue}
                        answerNumber={answerIndexMap[element.id]}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* 提出ボタン */}
            {(!isSubmitted || !isOverdue) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  size="lg"
                  className="w-full h-14 text-lg gap-3 rounded-2xl shadow-lg"
                  onClick={handleSubmitClick}
                  disabled={isSubmitting || submitSuccess}
                >
                  {submitSuccess ? (
                    <>
                      <Check className="w-6 h-6" />
                      提出完了!
                    </>
                  ) : isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <RotateCcw className="w-6 h-6" />
                      </motion.div>
                      提出中...
                    </>
                  ) : isSubmitted ? (
                    <>
                      <Send className="w-6 h-6" />
                      再提出する
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      提出する
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* 答え表示エリア (答えを見るモード時) */}
          <AnimatePresence>
            {showAnswers && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
              >
                <Card className="border-answer/30 bg-answer/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-answer">
                      <Eye className="w-5 h-5" />
                      答え
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      答えを参考にしながら入力できます
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4 no-select" style={{ userSelect: 'none' }}>
                        {answerElements.map((element, index) => (
                          <motion.div
                            key={element.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-xl bg-card border"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center gap-1">
                                <Badge className="bg-primary/10 text-primary border-primary shrink-0">
                                  Q{index + 1}
                                </Badge>
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  {element.content}
                                </Badge>
                              </div>
                              <div className="flex-1">
                                <p 
                                  className="text-answer font-medium text-lg"
                                  onCopy={(e) => e.preventDefault()}
                                  onCut={(e) => e.preventDefault()}
                                >
                                  {element.answer}
                                </p>
                                {element.importantPoint && (
                                  <p className="text-sm text-muted-foreground mt-2 p-2 rounded-lg bg-muted/50">
                                    重要: {element.importantPoint}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 答え表示確認ダイアログ */}
      <AlertDialog open={showAnswerConfirm} onOpenChange={setShowAnswerConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              答えを表示しますか?
            </AlertDialogTitle>
            <AlertDialogDescription>
              答えを見ながら回答を確認できます。自分で考えてから見ることをお��すめします。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻る</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowAnswers(true)
              setShowAnswerConfirm(false)
            }}>
              答えを見る
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 提出確認ダイアログ */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提出しますか?</DialogTitle>
            <DialogDescription>
              すべての項目が入力されています。この回答を提出してもよろしいですか?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-success/10">
              <span className="text-success font-medium flex items-center gap-2">
                <Check className="w-5 h-5" />
                {totalCount}問すべて回答済み
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '提出中...' : '提出する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 未完了警告ダイアログ */}
      <AlertDialog open={showIncompleteWarning} onOpenChange={setShowIncompleteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              未入力の項目があります
            </AlertDialogTitle>
            <AlertDialogDescription>
              {totalCount - filledCount}問が未回答です。このまま提出しますか?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10">
              <span className="text-destructive font-medium">
                {filledCount}/{totalCount}問 回答済み
              </span>
              <Progress value={progress} className="w-32 h-2" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>戻って入力する</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '提出中...' : 'このまま提出する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 提出成功トースト */}
      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="bg-success text-success-foreground shadow-xl">
              <CardContent className="flex items-center gap-3 p-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Check className="w-6 h-6" />
                </motion.div>
                <span className="font-medium">提出が完了しました!</span>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ElementDisplay({
  element,
  index,
  answer,
  onAnswerChange,
  showAnswer,
  isSubmitted,
  isOverdue,
  answerNumber
}: {
  element: NonNullable<ReturnType<typeof useAppStore>['assignments'][0]>['elements'][0]
  index: number
  answer: string
  onAnswerChange: (value: string) => void
  showAnswer: boolean
  isSubmitted: boolean
  isOverdue: boolean
  answerNumber?: number
}) {
  const canEdit = !isSubmitted || !isOverdue

  switch (element.type) {
    case 'heading':
      return (
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="text-2xl font-bold text-foreground"
        >
          {element.content}
        </motion.h2>
      )

    case 'text':
      return (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="text-foreground leading-relaxed"
        >
          {element.content}
        </motion.p>
      )

    case 'question-label':
      return (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="font-medium text-foreground mt-6"
        >
          {element.content}
        </motion.p>
      )

    case 'answer-box':
      const isCorrect = answer.trim() === (element.answer || '').trim()
      const hasAnswer = answer.trim().length > 0

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border"
        >
          <div className="flex flex-col items-center gap-1 shrink-0">
            {answerNumber && (
              <Badge className="bg-primary/10 text-primary border-primary text-xs">
                Q{answerNumber}
              </Badge>
            )}
            <Badge variant="outline" className="bg-card">
              {element.content}
            </Badge>
          </div>
          <div className="flex-1 relative">
            <Input
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="答えを入力..."
              className={`pr-10 ${
                showAnswer && hasAnswer
                  ? isCorrect
                    ? 'border-success bg-success/10'
                    : 'border-destructive bg-destructive/10'
                  : ''
              }`}
              disabled={!canEdit}
            />
            {showAnswer && hasAnswer && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCorrect ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            )}
          </div>
        </motion.div>
      )

    case 'katakana-marker':
      return (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="inline-block text-lg font-medium"
        >
          （　{element.content}　）
        </motion.span>
      )

    case 'divider':
      return (
        <motion.hr
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: index * 0.03 }}
          className="border-t-2 border-border my-6"
        />
      )

    case 'image':
      if (element.imageUrl) {
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <img 
              src={element.imageUrl} 
              alt="課題画像" 
              className="max-w-full h-auto rounded-xl"
              style={{ 
                width: element.style?.width ? `${element.style.width}%` : 'auto'
              }}
            />
          </motion.div>
        )
      }
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="flex items-center justify-center h-48 bg-muted rounded-xl"
        >
          <p className="text-muted-foreground">画像</p>
        </motion.div>
      )

    case 'map':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="flex items-center justify-center h-64 bg-muted rounded-xl"
        >
          <p className="text-muted-foreground">地図</p>
          {element.mapPins && element.mapPins.length > 0 && (
            <p className="text-xs text-primary ml-2">({element.mapPins.length}箇所)</p>
          )}
        </motion.div>
      )

    case 'embed':
      if (element.embedHtml) {
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="border rounded-lg p-4 bg-muted/30"
          >
            <div 
              className="embed-content"
              dangerouslySetInnerHTML={{ __html: element.embedHtml }}
            />
          </motion.div>
        )
      }
      return null

    default:
      return null
  }
}

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
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
  ArrowRight
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
import { EmbedViewer } from '@/components/editor/embed-editor'
import { isPast } from 'date-fns'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

// Leaflet用のdynamic import
const MapViewer = dynamic(
  () => import('@/components/editor/map-editor').then(mod => mod.MapViewer),
  { ssr: false, loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg" /> }
)

interface AssignmentViewProps {
  assignmentId: string
  onBack: () => void
}

export function AssignmentView({ assignmentId, onBack }: AssignmentViewProps) {
  const { 
    assignments, 
    submissions, 
    currentStudentId, 
    studentName,
    studentClass,
    addSubmission, 
    updateSubmission,
    saveProgress,
    getProgress,
    clearProgress
  } = useAppStore()

  const assignment = assignments.find(a => a.id === assignmentId)
  const existingSubmission = submissions.find(
    s => s.assignmentId === assignmentId && s.studentId === currentStudentId
  )

  // 進捗から回答を復元
  const savedAnswers = getProgress(assignmentId)
  
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (existingSubmission) {
      return { ...existingSubmission.answers }
    }
    if (savedAnswers) {
      return { ...savedAnswers }
    }
    return {}
  })
  const [showAnswers, setShowAnswers] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false)
  const [showAnswerConfirmDialog, setShowAnswerConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [highlightedAnswerId, setHighlightedAnswerId] = useState<string | null>(null)

  // 進捗を自動保存
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveProgress(assignmentId, answers)
    }
  }, [answers, assignmentId, saveProgress])

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>課題が見つかりません</p>
      </div>
    )
  }

  const answerElements = assignment.elements.filter(e => e.type === 'answer-box')
  const filledCount = answerElements.filter(e => answers[e.id]?.trim()).length
  const totalCount = answerElements.length
  const progress = totalCount > 0 ? (filledCount / totalCount) * 100 : 0
  const isComplete = filledCount === totalCount
  const isOverdue = isPast(new Date(assignment.deadline))
  const isSubmitted = existingSubmission?.status === 'submitted'

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

  // 答え表示前の確認
  const handleShowAnswersClick = () => {
    if (!showAnswers) {
      setShowAnswerConfirmDialog(true)
    } else {
      setShowAnswers(false)
    }
  }

  const confirmShowAnswers = () => {
    setShowAnswers(true)
    setShowAnswerConfirmDialog(false)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

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
        studentName: studentName || '名前未設定',
        studentClass: studentClass,
        answers,
        submittedAt: new Date(),
        history: [{ answers, submittedAt: new Date() }],
        status: 'submitted'
      })
    }

    // 進捗クリア
    clearProgress(assignmentId)

    setIsSubmitting(false)
    setSubmitSuccess(true)
    setShowSubmitDialog(false)
    setShowIncompleteWarning(false)

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
        className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b"
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
                  期限: {format(new Date(assignment.deadline), 'M月d日', { locale: ja })}
                  {assignment.deadlineTime && ` ${assignment.deadlineTime.hour}:${String(assignment.deadlineTime.minute).padStart(2, '0')}`}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">期限超過</Badge>
                  )}
                  {isSubmitted && (
                    <Badge className="bg-success text-success-foreground text-xs">提出済み</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showAnswers ? 'default' : 'outline'}
                onClick={handleShowAnswersClick}
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
        {/* 中央配置のコンテナ - 答え表示時にスライド */}
        <motion.div 
          className={`flex gap-6 ${showAnswers ? '' : 'justify-center'}`}
          animate={{ 
            x: showAnswers ? 0 : 0 
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* 問題・回答エリア */}
          <motion.div 
            className="space-y-4"
            animate={{ 
              width: showAnswers ? '50%' : '100%',
              maxWidth: showAnswers ? 'none' : '800px'
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    問題
                  </CardTitle>
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
                        isHighlighted={highlightedAnswerId === element.id}
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
                  className="w-full h-14 text-lg gap-3 rounded-xl shadow-lg"
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
          </motion.div>

          {/* 答え表示エリア */}
          <AnimatePresence>
            {showAnswers && (
              <motion.div
                initial={{ opacity: 0, x: 50, width: 0 }}
                animate={{ opacity: 1, x: 0, width: '50%' }}
                exit={{ opacity: 0, x: 50, width: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="shrink-0"
              >
                <Card className="border-answer/30 bg-answer/5 sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-answer">
                      <Eye className="w-5 h-5" />
                      答え
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      答えにカーソルを合わせると、対応する解答欄がハイライトされます
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4 no-select" style={{ userSelect: 'none' }}>
                        {answerElements.map((element, index) => {
                          const userAnswer = answers[element.id]?.trim() || ''
                          const correctAnswer = element.answer?.trim() || ''
                          const isCorrect = userAnswer === correctAnswer
                          const hasAnswered = userAnswer.length > 0
                          
                          return (
                            <motion.div
                              key={element.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                highlightedAnswerId === element.id
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-card'
                              }`}
                              onMouseEnter={() => setHighlightedAnswerId(element.id)}
                              onMouseLeave={() => setHighlightedAnswerId(null)}
                            >
                              <div className="flex items-start gap-3">
                                <Badge 
                                  variant="outline" 
                                  className={`shrink-0 ${
                                    highlightedAnswerId === element.id 
                                      ? 'bg-primary text-primary-foreground' 
                                      : ''
                                  }`}
                                >
                                  {element.content}
                                </Badge>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p 
                                      className="text-answer font-medium text-lg"
                                      onCopy={(e) => e.preventDefault()}
                                      onCut={(e) => e.preventDefault()}
                                    >
                                      {element.answer}
                                    </p>
                                    {hasAnswered && (
                                      <Badge 
                                        variant={isCorrect ? 'default' : 'destructive'}
                                        className={isCorrect ? 'bg-success' : ''}
                                      >
                                        {isCorrect ? '正解' : '不正解'}
                                      </Badge>
                                    )}
                                  </div>
                                  {hasAnswered && !isCorrect && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      あなたの回答: <span className="text-destructive">{userAnswer}</span>
                                    </p>
                                  )}
                                  {element.importantPoint && (
                                    <p className="text-sm text-muted-foreground mt-2 p-2 rounded-lg bg-muted/50">
                                      重要: {element.importantPoint}
                                    </p>
                                  )}
                                </div>
                                {/* 矢印アイコンで対応を示す */}
                                <ArrowRight className={`w-5 h-5 shrink-0 transition-colors ${
                                  highlightedAnswerId === element.id
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                }`} />
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* 答え表示確認ダイアログ */}
      <AlertDialog open={showAnswerConfirmDialog} onOpenChange={setShowAnswerConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>答えを表示しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              答えを見ると、自分で考える機会が減ってしまいます。
              まずは自分で解いてみることをおすすめします。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>もう少し考える</AlertDialogCancel>
            <AlertDialogAction onClick={confirmShowAnswers}>
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
  isHighlighted
}: {
  element: NonNullable<ReturnType<typeof useAppStore>['assignments'][0]>['elements'][0]
  index: number
  answer: string
  onAnswerChange: (value: string) => void
  showAnswer: boolean
  isSubmitted: boolean
  isOverdue: boolean
  isHighlighted: boolean
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
          style={element.size?.scale ? { fontSize: `${element.size.scale * 1.5}rem` } : {}}
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
          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            isHighlighted
              ? 'bg-primary/10 border-primary ring-2 ring-primary/50'
              : 'bg-muted/30'
          }`}
        >
          <Badge 
            variant="outline" 
            className={`shrink-0 ${isHighlighted ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
          >
            {element.content}
          </Badge>
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
              } ${isHighlighted ? 'border-primary' : ''}`}
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
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          {element.imageData ? (
            <img
              src={element.imageData}
              alt={element.content}
              className="max-w-full h-auto rounded-xl"
              style={{ maxHeight: '300px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-muted rounded-xl">
              <p className="text-muted-foreground">画像</p>
            </div>
          )}
        </motion.div>
      )

    case 'map':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          {element.mapData ? (
            <div className="h-64 rounded-xl overflow-hidden">
              <MapViewer data={element.mapData} className="h-full" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-xl">
              <p className="text-muted-foreground">地図</p>
            </div>
          )}
        </motion.div>
      )

    case 'embed':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="p-4 bg-muted/50 rounded-xl"
        >
          {element.embedHtml ? (
            <EmbedViewer html={element.embedHtml} />
          ) : (
            <p className="text-muted-foreground text-center">埋め込みコンテンツ</p>
          )}
        </motion.div>
      )

    default:
      return null
  }
}

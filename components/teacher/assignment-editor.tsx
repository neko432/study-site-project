'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Type,
  Heading1,
  FileQuestion,
  Image,
  Map,
  List,
  Minus,
  Save,
  Upload,
  Calendar,
  Printer,
  Trash2,
  GripVertical,
  X,
  Copy,
  Check,
  Clock,
  Undo2,
  Redo2,
  Code2,
  ImagePlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/lib/store'
import { KATAKANA_MARKERS, type EditorElement, type ElementType } from '@/lib/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface AssignmentEditorProps {
  assignmentId: string
  onBack: () => void
}

const ELEMENT_TYPES: { type: ElementType; icon: React.ReactNode; label: string }[] = [
  { type: 'heading', icon: <Heading1 className="w-4 h-4" />, label: '見出し' },
  { type: 'text', icon: <Type className="w-4 h-4" />, label: 'テキスト' },
  { type: 'answer-box', icon: <FileQuestion className="w-4 h-4" />, label: '解答欄' },
  { type: 'question-label', icon: <List className="w-4 h-4" />, label: '問題番号' },
  { type: 'katakana-marker', icon: <span className="text-sm font-bold">(ア)</span>, label: 'カタカナ' },
  { type: 'divider', icon: <Minus className="w-4 h-4" />, label: '区切り線' },
  { type: 'image', icon: <ImagePlus className="w-4 h-4" />, label: '画像' },
  { type: 'map', icon: <Map className="w-4 h-4" />, label: '地図' },
  { type: 'embed', icon: <Code2 className="w-4 h-4" />, label: '埋め込み' },
]

export function AssignmentEditor({ assignmentId, onBack }: AssignmentEditorProps) {
  const { assignments, addAssignment, updateAssignment, addTemplate } = useAppStore()

  const existingAssignment = assignments.find(a => a.id === assignmentId)
  const isNew = assignmentId === 'new' || assignmentId.startsWith('template-')

  const [title, setTitle] = useState(existingAssignment?.title || '')
  const [description, setDescription] = useState(existingAssignment?.description || '')
  const [elements, setElements] = useState<EditorElement[]>(
    existingAssignment?.elements || (assignmentId === 'template-history' ? getHistoryTemplate() : [])
  )
  const [deadline, setDeadline] = useState<Date>(
    existingAssignment?.deadline ? new Date(existingAssignment.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  )
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(
    existingAssignment?.scheduledAt ? new Date(existingAssignment.scheduledAt) : undefined
  )

  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [katakanaIndex, setKatakanaIndex] = useState(0)
  const [printWithAnswers, setPrintWithAnswers] = useState(true)
  const [templateName, setTemplateName] = useState('')
  const [showEmbedDialog, setShowEmbedDialog] = useState(false)
  const [embedHtml, setEmbedHtml] = useState('')
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [pendingImageElementId, setPendingImageElementId] = useState<string | null>(null)
  const [pendingEmbedElementId, setPendingEmbedElementId] = useState<string | null>(null)

  // Undo/Redo state
  const [history, setHistory] = useState<EditorElement[][]>([elements])
  const [historyIndex, setHistoryIndex] = useState(0)
  const isUndoRedoAction = useRef(false)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // Track element changes for history
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false
      return
    }
    // Only add to history if elements actually changed
    if (JSON.stringify(elements) !== JSON.stringify(history[historyIndex])) {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push([...elements])
      // Keep only last 50 states
      if (newHistory.length > 50) newHistory.shift()
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }, [elements])

  const handleUndo = useCallback(() => {
    if (canUndo) {
      isUndoRedoAction.current = true
      setHistoryIndex(prev => prev - 1)
      setElements([...history[historyIndex - 1]])
    }
  }, [canUndo, history, historyIndex])

  const handleRedo = useCallback(() => {
    if (canRedo) {
      isUndoRedoAction.current = true
      setHistoryIndex(prev => prev + 1)
      setElements([...history[historyIndex + 1]])
    }
  }, [canRedo, history, historyIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const addElement = useCallback((type: ElementType) => {
    const newElement: EditorElement = {
      id: generateId(),
      type,
      content: getDefaultContent(type, katakanaIndex),
      ...(type === 'answer-box' && { answer: '', importantPoint: '' }),
      ...(type === 'embed' && { embedHtml: '' }),
      ...(type === 'image' && { imageUrl: '', imageAlt: '' })
    }
    
    if (type === 'katakana-marker') {
      setKatakanaIndex(prev => (prev + 1) % KATAKANA_MARKERS.length)
    }
    
    // For image and embed, show dialog first
    if (type === 'image') {
      setPendingImageElementId(newElement.id)
      setImageUrl('')
      setImageAlt('')
      setShowImageDialog(true)
      setElements(prev => [...prev, newElement])
      setSelectedElement(newElement.id)
      return
    }
    
    if (type === 'embed') {
      setPendingEmbedElementId(newElement.id)
      setEmbedHtml('')
      setShowEmbedDialog(true)
      setElements(prev => [...prev, newElement])
      setSelectedElement(newElement.id)
      return
    }
    
    setElements(prev => [...prev, newElement])
    setSelectedElement(newElement.id)
    
    // Auto-scroll to new element after a brief delay
    setTimeout(() => {
      const element = document.getElementById(`element-${newElement.id}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [katakanaIndex])

  const updateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [])

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement])

  const duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElement = { ...element, id: generateId() }
      const index = elements.findIndex(el => el.id === id)
      setElements(prev => [
        ...prev.slice(0, index + 1),
        newElement,
        ...prev.slice(index + 1)
      ])
    }
  }, [elements])

  const handlePublish = () => {
    const assignmentData = {
      id: isNew ? generateId() : assignmentId,
      title,
      description,
      elements,
      deadline,
      publishedAt: new Date(),
      status: 'published' as const,
      createdAt: existingAssignment?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (isNew) {
      addAssignment(assignmentData)
    } else {
      updateAssignment(assignmentId, assignmentData)
    }
    setShowPublishDialog(false)
    onBack()
  }

  const handleSchedule = () => {
    if (!scheduledAt) return

    const assignmentData = {
      id: isNew ? generateId() : assignmentId,
      title,
      description,
      elements,
      deadline,
      scheduledAt,
      status: 'scheduled' as const,
      createdAt: existingAssignment?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (isNew) {
      addAssignment(assignmentData)
    } else {
      updateAssignment(assignmentId, assignmentData)
    }
    setShowScheduleDialog(false)
    onBack()
  }

  const handleSaveDraft = () => {
    const assignmentData = {
      id: isNew ? generateId() : assignmentId,
      title: title || '無題の課題',
      description,
      elements,
      deadline,
      status: 'draft' as const,
      createdAt: existingAssignment?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (isNew) {
      addAssignment(assignmentData)
    } else {
      updateAssignment(assignmentId, assignmentData)
    }
    onBack()
  }

  const handleSaveTemplate = () => {
    addTemplate({
      id: generateId(),
      name: templateName,
      description: description || 'カスタムテンプレート',
      elements: elements.map(el => ({
        ...el,
        answer: undefined,
        importantPoint: undefined
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    setShowSaveTemplateDialog(false)
    setTemplateName('')
  }

  const handlePrint = () => {
    // TODO: 実際の印刷機能を実装
    console.log('印刷:', printWithAnswers ? '答え含む' : '答え含まない')
    setShowPrintDialog(false)
  }

  const handleSaveImage = () => {
    if (pendingImageElementId) {
      updateElement(pendingImageElementId, {
        imageUrl,
        imageAlt,
        content: imageAlt || '画像'
      })
      setShowImageDialog(false)
      setPendingImageElementId(null)
      setImageUrl('')
      setImageAlt('')
    }
  }

  const handleSaveEmbed = () => {
    if (pendingEmbedElementId) {
      updateElement(pendingEmbedElementId, {
        embedHtml,
        content: '埋め込みコンテンツ'
      })
      setShowEmbedDialog(false)
      setPendingEmbedElementId(null)
      setEmbedHtml('')
    }
  }

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImageUrl(result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="課題タイトルを入力..."
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons */}
            <div className="flex items-center border rounded-lg mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={!canUndo}
                className="h-9 w-9 rounded-r-none"
                title="元に戻す (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={!canRedo}
                className="h-9 w-9 rounded-l-none border-l"
                title="やり直す (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setShowPrintDialog(true)}>
              <Printer className="w-4 h-4 mr-2" />
              印刷
            </Button>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(true)}>
              <Save className="w-4 h-4 mr-2" />
              テンプレート保存
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              下書き保存
            </Button>
            <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              予約投稿
            </Button>
            <Button onClick={() => setShowPublishDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              今すぐ公開
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* サイドバー - 要素追加 */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-64 shrink-0"
        >
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">要素を追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ELEMENT_TYPES.map((item) => (
                <motion.div key={item.type} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-10"
                    onClick={() => addElement(item.type)}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </motion.div>
              ))}

              {/* カタカナクイック選択 (ア-ン全対応) */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">カタカナ記号 (ア〜ン)</p>
                <div className="max-h-40 overflow-y-auto pr-1">
                  <div className="grid grid-cols-5 gap-1">
                    {KATAKANA_MARKERS.map((marker, index) => (
                      <motion.button
                        key={marker}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-sm rounded-lg bg-muted hover:bg-accent transition-colors"
                        onClick={() => {
                          setKatakanaIndex(index)
                          addElement('katakana-marker')
                        }}
                      >
                        ({marker})
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.aside>

        {/* メインエディター */}
        <div className="flex-1 space-y-4">
          {/* 説明文入力 */}
          <Card>
            <CardContent className="pt-4">
              <Label htmlFor="description" className="text-sm text-muted-foreground">
                課題の説明
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="生徒に表示する課題の説明を入力..."
                className="mt-2 min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* エディターキャンバス */}
          <Card className="min-h-[600px]">
            <CardContent className="p-6">
              {elements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                  <Plus className="w-12 h-12 mb-4" />
                  <p>左のパネルから要素を追加してください</p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={elements}
                  onReorder={setElements}
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {elements.map((element) => (
                      <Reorder.Item
                        key={element.id}
                        value={element}
                        className="relative"
                      >
                        <motion.div
                          id={`element-${element.id}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`group relative p-4 rounded-xl border-2 transition-colors ${
                            selectedElement === element.id
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent hover:border-border bg-muted/30'
                          }`}
                          onClick={() => setSelectedElement(element.id)}
                        >
                          {/* ドラッグハンドル */}
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>

                          {/* 要素コンテンツ */}
                          <div className="pl-6">
                            <ElementRenderer
                              element={element}
                              onUpdate={(updates) => updateElement(element.id, updates)}
                              isSelected={selectedElement === element.id}
                            />
                          </div>

                          {/* アクションボタン */}
                          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicateElement(element.id)
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteElement(element.id)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </motion.div>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </CardContent>
          </Card>

          {/* 期限設定 */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Label className="text-sm text-muted-foreground">提出期限:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-48">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(deadline, 'yyyy年M月d日', { locale: ja })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={deadline}
                      onSelect={(date) => {
                        if (date) {
                          const newDeadline = new Date(date)
                          newDeadline.setHours(deadline.getHours(), deadline.getMinutes())
                          setDeadline(newDeadline)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={format(deadline, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number)
                      const newDeadline = new Date(deadline)
                      newDeadline.setHours(hours, minutes)
                      setDeadline(newDeadline)
                    }}
                    className="w-28"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右サイドバー - 選択要素のプロパティ */}
        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-72 shrink-0"
        >
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">プロパティ</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedElement ? (
                <ElementProperties
                  element={elements.find(e => e.id === selectedElement)!}
                  onUpdate={(updates) => updateElement(selectedElement, updates)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  要素を選択してプロパティを編集
                </p>
              )}
            </CardContent>
          </Card>
        </motion.aside>
      </div>

      {/* 公開確認ダイアログ */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>課題を公開しますか？</DialogTitle>
            <DialogDescription>
              公開すると生徒がすぐにこの課題に取り組めるようになります。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">タイトル:</span>
              <span className="font-medium">{title || '無題の課題'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">問題数:</span>
              <span className="font-medium">
                {elements.filter(e => e.type === 'answer-box').length}問
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">期限:</span>
              <span className="font-medium">
                {format(deadline, 'M月d日 HH:mm', { locale: ja })}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handlePublish}>
              <Check className="w-4 h-4 mr-2" />
              公開する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 予約投稿ダイアログ */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約投稿の設定</DialogTitle>
            <DialogDescription>
              指定した日時に自動的に公開されます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm">公開日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    {scheduledAt
                      ? format(scheduledAt, 'yyyy年M月d日', { locale: ja })
                      : '日付を選択'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={scheduledAt}
                    onSelect={(date) => {
                      if (date) {
                        const newDate = new Date(date)
                        if (scheduledAt) {
                          newDate.setHours(scheduledAt.getHours(), scheduledAt.getMinutes())
                        } else {
                          newDate.setHours(9, 0) // Default to 9:00 AM
                        }
                        setScheduledAt(newDate)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm">公開時刻</Label>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={scheduledAt ? format(scheduledAt, 'HH:mm') : '09:00'}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    const newDate = scheduledAt ? new Date(scheduledAt) : new Date()
                    newDate.setHours(hours, minutes)
                    setScheduledAt(newDate)
                  }}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSchedule} disabled={!scheduledAt}>
              <Calendar className="w-4 h-4 mr-2" />
              予約する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* テンプレート保存ダイアログ */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレートとして保存</DialogTitle>
            <DialogDescription>
              答えを除いた状態でテンプレートとして保存されます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">テンプレート名</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="テンプレート名を入力..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 画像アップロードダイアログ */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="w-5 h-5" />
              画像を追加
            </DialogTitle>
            <DialogDescription>
              画像URLを入力するか、ファイルをアップロードしてください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="image-file">ファイルを選択</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="mt-2"
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">または</div>
            <div>
              <Label htmlFor="image-url">画像URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="image-alt">代替テキスト（アクセシビリティ用）</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="画像の説明"
                className="mt-2"
              />
            </div>
            {imageUrl && (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">プレビュー:</p>
                <img 
                  src={imageUrl} 
                  alt={imageAlt || 'プレビュー'} 
                  className="max-h-40 mx-auto rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImageDialog(false)
              if (pendingImageElementId) {
                deleteElement(pendingImageElementId)
                setPendingImageElementId(null)
              }
            }}>
              キャンセル
            </Button>
            <Button onClick={handleSaveImage} disabled={!imageUrl}>
              <ImagePlus className="w-4 h-4 mr-2" />
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HTML埋め込みダイアログ */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              HTMLを埋め込む
            </DialogTitle>
            <DialogDescription>
              埋め込みたいHTMLコードを入力してください（iframe、YouTube動画など）。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="embed-html">HTMLコード</Label>
              <Textarea
                id="embed-html"
                value={embedHtml}
                onChange={(e) => setEmbedHtml(e.target.value)}
                placeholder='<iframe src="..." width="100%" height="315"></iframe>'
                className="mt-2 min-h-[150px] font-mono text-sm"
              />
            </div>
            {embedHtml && (
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">プレビュー:</p>
                <div 
                  className="bg-muted/50 rounded p-4 overflow-auto max-h-60"
                  dangerouslySetInnerHTML={{ __html: embedHtml }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEmbedDialog(false)
              if (pendingEmbedElementId) {
                deleteElement(pendingEmbedElementId)
                setPendingEmbedElementId(null)
              }
            }}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEmbed} disabled={!embedHtml}>
              <Code2 className="w-4 h-4 mr-2" />
              埋め込む
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ElementRenderer({
  element,
  onUpdate,
  isSelected
}: {
  element: EditorElement
  onUpdate: (updates: Partial<EditorElement>) => void
  isSelected: boolean
}) {
  switch (element.type) {
    case 'heading':
      return (
        <Input
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 bg-transparent"
          placeholder="見出しを入力..."
        />
      )
    
    case 'text':
      return (
        <Textarea
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="border-none shadow-none focus-visible:ring-0 bg-transparent resize-none min-h-[60px]"
          placeholder="テキストを入力..."
        />
      )
    
    case 'question-label':
      return (
        <Input
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="font-medium border-none shadow-none focus-visible:ring-0 bg-transparent"
          placeholder="(1) 問題文を入力..."
        />
      )
    
    case 'answer-box':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-answer/10 text-answer border-answer">
              {element.content}
            </Badge>
            <span className="text-sm text-muted-foreground">解答欄</span>
          </div>
          <Input
            value={element.answer || ''}
            onChange={(e) => onUpdate({ answer: e.target.value })}
            className="border-answer/50 text-answer font-medium"
            placeholder="正解を入力..."
          />
        </div>
      )
    
    case 'katakana-marker':
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium">（　{element.content}　）</span>
        </div>
      )
    
    case 'divider':
      return <hr className="border-t-2 border-border" />
    
    case 'image':
      return element.imageUrl ? (
        <div className="rounded-lg overflow-hidden">
          <img 
            src={element.imageUrl} 
            alt={element.imageAlt || element.content}
            className="max-h-64 mx-auto rounded"
          />
          {element.imageAlt && (
            <p className="text-sm text-muted-foreground text-center mt-2">{element.imageAlt}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">画像をクリックして設定</p>
          </div>
        </div>
      )
    
    case 'map':
      return (
        <div className="flex items-center justify-center h-48 bg-muted rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Map className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">地図を追加</p>
          </div>
        </div>
      )
    
    case 'embed':
      return element.embedHtml ? (
        <div className="rounded-lg overflow-hidden bg-muted/30 p-4">
          <div dangerouslySetInnerHTML={{ __html: element.embedHtml }} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Code2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">埋め込みコンテンツを追加</p>
          </div>
        </div>
      )
    
    default:
      return null
  }
}

function ElementProperties({
  element,
  onUpdate
}: {
  element: EditorElement
  onUpdate: (updates: Partial<EditorElement>) => void
}) {
  if (element.type === 'answer-box') {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm">ラベル</Label>
          <Input
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="mt-1"
            placeholder="ア, イ, など"
          />
        </div>
        <div>
          <Label className="text-sm">正解</Label>
          <Input
            value={element.answer || ''}
            onChange={(e) => onUpdate({ answer: e.target.value })}
            className="mt-1 text-answer"
            placeholder="正解を入力"
          />
        </div>
        <div>
          <Label className="text-sm">重要ポイント</Label>
          <Textarea
            value={element.importantPoint || ''}
            onChange={(e) => onUpdate({ importantPoint: e.target.value })}
            className="mt-1"
            placeholder="この答えの重要ポイント..."
          />
        </div>
      </div>
    )
  }

  if (element.type === 'katakana-marker') {
    return (
      <div>
        <Label className="text-sm">カタカナ記号</Label>
        <Select
          value={element.content}
          onValueChange={(value) => onUpdate({ content: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KATAKANA_MARKERS.map((marker) => (
              <SelectItem key={marker} value={marker}>
                （{marker}）
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div>
      <Label className="text-sm">コンテンツ</Label>
      <Textarea
        value={element.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        className="mt-1"
      />
    </div>
  )
}

function getDefaultContent(type: ElementType, katakanaIndex: number): string {
  switch (type) {
    case 'heading':
      return '見出し'
    case 'text':
      return ''
    case 'question-label':
      return '(1) '
    case 'answer-box':
      return KATAKANA_MARKERS[katakanaIndex]
    case 'katakana-marker':
      return KATAKANA_MARKERS[katakanaIndex]
    default:
      return ''
  }
}

function getHistoryTemplate(): EditorElement[] {
  return [
    {
      id: 'template-1',
      type: 'heading',
      content: 'ふりかえりワーク歴史'
    },
    {
      id: 'template-2',
      type: 'text',
      content: '教科書を見て「学習課題」を自分で書き込もう。'
    },
    {
      id: 'template-3',
      type: 'question-label',
      content: '(1) 次の文章の空らんに当てはまる言葉を答えよう。'
    },
    {
      id: 'template-4',
      type: 'answer-box',
      content: 'ア',
      answer: '',
      importantPoint: ''
    }
  ]
}

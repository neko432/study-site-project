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
  Code,
  Settings
} from 'lucide-react'
import { useHistory } from '@/hooks/use-history'
import { MapEditor } from '@/components/map-editor'
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
  { type: 'divider', icon: <Minus className="w-4 h-4" />, label: '区切り線' },
  { type: 'image', icon: <Image className="w-4 h-4" />, label: '画像' },
  { type: 'map', icon: <Map className="w-4 h-4" />, label: '地図' },
  { type: 'embed', icon: <Code className="w-4 h-4" />, label: '埋め込み' },
]

export function AssignmentEditor({ assignmentId, onBack }: AssignmentEditorProps) {
  const { assignments, addAssignment, updateAssignment, addTemplate } = useAppStore()

  const existingAssignment = assignments.find(a => a.id === assignmentId)
  const isNew = assignmentId === 'new' || assignmentId.startsWith('template-')

  const [title, setTitle] = useState(existingAssignment?.title || '')
  const [description, setDescription] = useState(existingAssignment?.description || '')
  
  // Use history hook for undo/redo
  const {
    state: elements,
    set: setElements,
    setWithoutHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory<EditorElement[]>(
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
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [editingMapElementId, setEditingMapElementId] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [katakanaIndex, setKatakanaIndex] = useState(0)
  const [printWithAnswers, setPrintWithAnswers] = useState(true)
  const [templateName, setTemplateName] = useState('')
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const addElement = useCallback((type: ElementType, insertAtIndex?: number) => {
    const newElement: EditorElement = {
      id: generateId(),
      type,
      content: getDefaultContent(type, katakanaIndex),
      ...(type === 'answer-box' && { answer: '', importantPoint: '' }),
      ...(type === 'embed' && { embedCode: '' }),
      ...(type === 'map' && { mapData: { lat: 35.6762, lng: 139.6503, zoom: 10, markers: [] } })
    }
    
    if (type === 'katakana-marker' || type === 'answer-box') {
      setKatakanaIndex(prev => (prev + 1) % KATAKANA_MARKERS.length)
    }
    
    setElements(prev => {
      if (insertAtIndex !== undefined) {
        return [...prev.slice(0, insertAtIndex), newElement, ...prev.slice(insertAtIndex)]
      }
      return [...prev, newElement]
    })
    setSelectedElement(newElement.id)

    // Auto-scroll to new element
    setTimeout(() => {
      const element = document.getElementById(`element-${newElement.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }, [katakanaIndex, setElements])

  const updateElement = useCallback((id: string, updates: Partial<EditorElement>, addToHistory = true) => {
    const setter = addToHistory ? setElements : setWithoutHistory
    setter(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [setElements, setWithoutHistory])

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement, setElements])

  const duplicateElement = useCallback((id: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id)
      if (element) {
        const newElement = { ...element, id: generateId() }
        const index = prev.findIndex(el => el.id === id)
        return [
          ...prev.slice(0, index + 1),
          newElement,
          ...prev.slice(index + 1)
        ]
      }
      return prev
    })
  }, [setElements])

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
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title || '無題の課題'}</title>
          <style>
            body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; margin-bottom: 8px; border-bottom: 2px solid #333; padding-bottom: 8px; }
            .description { color: #666; margin-bottom: 24px; }
            .element { margin-bottom: 16px; }
            .heading { font-size: 20px; font-weight: bold; margin-top: 24px; }
            .text { line-height: 1.8; }
            .question-label { font-weight: bold; margin-top: 20px; }
            .answer-box { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f5f5f5; border-radius: 8px; margin: 8px 0; }
            .answer-label { background: #e0e0e0; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
            .answer-input { flex: 1; border-bottom: 1px solid #999; min-width: 150px; padding: 4px 0; }
            .answer-text { color: #d32f2f; font-weight: bold; }
            .divider { border-top: 1px solid #ccc; margin: 24px 0; }
            .deadline { color: #666; font-size: 14px; margin-top: 24px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>${title || '無題の課題'}</h1>
          <p class="description">${description}</p>
          ${elements.map(el => {
            switch(el.type) {
              case 'heading':
                return `<div class="element heading">${el.content}</div>`
              case 'text':
                return `<div class="element text">${el.content}</div>`
              case 'question-label':
                return `<div class="element question-label">${el.content}</div>`
              case 'answer-box':
                return `<div class="element answer-box">
                  <span class="answer-label">${el.content}</span>
                  ${printWithAnswers 
                    ? `<span class="answer-text">${el.answer || ''}</span>` 
                    : '<span class="answer-input"></span>'
                  }
                </div>`
              case 'divider':
                return '<div class="divider"></div>'
              default:
                return ''
            }
          }).join('')}
          <p class="deadline">提出期限: ${format(deadline, 'yyyy年M月d日 HH:mm', { locale: ja })}</p>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
    setShowPrintDialog(false)
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
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={!canUndo}
                title="元に戻す (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={!canRedo}
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
                        id={`element-${element.id}`}
                      >
                        <motion.div
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
                              onOpenMapEditor={() => {
                                setEditingMapElementId(element.id)
                                setShowMapDialog(true)
                              }}
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
                          const newDate = new Date(date)
                          newDate.setHours(deadline.getHours())
                          newDate.setMinutes(deadline.getMinutes())
                          setDeadline(newDate)
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
                      const newDate = new Date(deadline)
                      newDate.setHours(hours)
                      newDate.setMinutes(minutes)
                      setDeadline(newDate)
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
          <div className="py-4">
            <Label className="text-sm">公開日時</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-2">
                  <Clock className="w-4 h-4 mr-2" />
                  {scheduledAt
                    ? format(scheduledAt, 'yyyy年M月d日 HH:mm', { locale: ja })
                    : '日時を選択'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={scheduledAt}
                  onSelect={setScheduledAt}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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

      {/* 地図エディターダイアログ */}
      {editingMapElementId && (
        <MapEditor
          open={showMapDialog}
          onOpenChange={(open) => {
            setShowMapDialog(open)
            if (!open) setEditingMapElementId(null)
          }}
          mapData={
            elements.find(e => e.id === editingMapElementId)?.mapData || {
              lat: 35.6762,
              lng: 139.6503,
              zoom: 10,
              markers: []
            }
          }
          onSave={(data) => {
            updateElement(editingMapElementId, { mapData: data })
          }}
        />
      )}
    </div>
  )
}

function ElementRenderer({
  element,
  onUpdate,
  isSelected,
  onOpenMapEditor
}: {
  element: EditorElement
  onUpdate: (updates: Partial<EditorElement>) => void
  isSelected: boolean
  onOpenMapEditor?: () => void
}) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onUpdate({ imageUrl: event.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onUpdate({ imageUrl: event.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

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
          <span className="text-lg font-medium">{'\uff08\u3000'}{element.content}{'\u3000\uff09'}</span>
        </div>
      )
    
    case 'divider':
      return <hr className="border-t-2 border-border" />
    
    case 'image':
      return (
        <div
          className={`relative ${
            element.imageUrl 
              ? 'overflow-hidden rounded-lg' 
              : 'flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleImageDrop}
          style={element.size ? { width: element.size.width, height: element.size.height } : undefined}
        >
          {element.imageUrl ? (
            <div className="relative group">
              <img 
                src={element.imageUrl} 
                alt="Uploaded" 
                className="max-w-full h-auto rounded-lg"
                style={element.size ? { width: element.size.width, height: element.size.height, objectFit: 'cover' } : undefined}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium">
                    画像を変更
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">クリックまたはドラッグで画像をアップロード</p>
            </label>
          )}
        </div>
      )
    
    case 'map':
      return (
        <div 
          className="h-48 bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
          onClick={onOpenMapEditor}
        >
          {element.mapData && element.mapData.markers.length > 0 ? (
            <div className="w-full h-full p-2">
              <div className="w-full h-full bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                <Map className="w-8 h-8 text-primary mb-2" />
                <p className="text-sm text-foreground font-medium">
                  {element.mapData.markers.length}個のピンが設定されています
                </p>
                <p className="text-xs text-muted-foreground">クリックして編集</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Map className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">クリックして地図を追加</p>
            </div>
          )}
        </div>
      )
    
    case 'embed':
      return (
        <div className="space-y-2">
          <Textarea
            value={element.embedCode || ''}
            onChange={(e) => onUpdate({ embedCode: e.target.value })}
            className="font-mono text-sm min-h-[80px]"
            placeholder="HTMLコードを入力してください..."
          />
          {element.embedCode && (
            <div 
              className="p-4 border rounded-lg bg-muted/30"
              dangerouslySetInnerHTML={{ __html: element.embedCode }}
            />
          )}
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
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">カタカナ記号を選択:</p>
            <div className="flex flex-wrap gap-1">
              {KATAKANA_MARKERS.map((marker) => (
                <button
                  key={marker}
                  type="button"
                  onClick={() => onUpdate({ content: marker })}
                  className={`w-7 h-7 text-xs rounded border transition-colors ${
                    element.content === marker
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-accent border-border'
                  }`}
                >
                  {marker}
                </button>
              ))}
            </div>
          </div>
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

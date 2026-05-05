'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Type,
  Heading1,
  FileQuestion,
  ImageIcon,
  Map,
  List,
  Minus,
  Save,
  Upload,
  Calendar,
  Printer,
  Trash2,
  GripVertical,
  Copy,
  Check,
  Clock,
  Undo2,
  Redo2,
  Code,
  Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
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
import { KATAKANA_MARKERS, QUESTION_NUMBER_FORMATS, type EditorElement, type ElementType, type KatakanaMarker, type MapData } from '@/lib/types'
import { KatakanaGrid } from '@/components/editor/katakana-picker'
import { EmbedEditor, EmbedViewer } from '@/components/editor/embed-editor'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

// Leaflet用のdynamic import（SSR無効）
const MapEditor = dynamic(
  () => import('@/components/editor/map-editor').then(mod => mod.MapEditor),
  { ssr: false, loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg" /> }
)

const MapViewer = dynamic(
  () => import('@/components/editor/map-editor').then(mod => mod.MapViewer),
  { ssr: false, loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg" /> }
)

interface AssignmentEditorProps {
  assignmentId: string
  onBack: () => void
}

const ELEMENT_TYPES: { type: ElementType; icon: React.ReactNode; label: string }[] = [
  { type: 'heading', icon: <Heading1 className="w-4 h-4" />, label: '見出し' },
  { type: 'text', icon: <Type className="w-4 h-4" />, label: 'テキスト' },
  { type: 'answer-box', icon: <FileQuestion className="w-4 h-4" />, label: '解答欄' },
  { type: 'question-label', icon: <Hash className="w-4 h-4" />, label: '問題番号' },
  { type: 'divider', icon: <Minus className="w-4 h-4" />, label: '区切り線' },
  { type: 'image', icon: <ImageIcon className="w-4 h-4" />, label: '画像' },
  { type: 'map', icon: <Map className="w-4 h-4" />, label: '地図' },
  { type: 'embed', icon: <Code className="w-4 h-4" />, label: '埋め込み' },
]

export function AssignmentEditor({ assignmentId, onBack }: AssignmentEditorProps) {
  const { 
    assignments, 
    addAssignment, 
    updateAssignment, 
    addTemplate,
    currentEditor,
    setCurrentEditor,
    addElement: storeAddElement,
    updateElement: storeUpdateElement,
    deleteElement: storeDeleteElement,
    reorderElements,
    undo,
    redo,
    canUndo,
    canRedo
  } = useAppStore()

  const existingAssignment = assignments.find(a => a.id === assignmentId)
  const isNew = assignmentId === 'new' || assignmentId.startsWith('template-')

  const [title, setTitle] = useState(existingAssignment?.title || '')
  const [description, setDescription] = useState(existingAssignment?.description || '')
  const [deadline, setDeadline] = useState<Date>(
    existingAssignment?.deadline ? new Date(existingAssignment.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  )
  const [deadlineHour, setDeadlineHour] = useState(existingAssignment?.deadlineTime?.hour ?? 23)
  const [deadlineMinute, setDeadlineMinute] = useState(existingAssignment?.deadlineTime?.minute ?? 59)
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(
    existingAssignment?.scheduledAt ? new Date(existingAssignment.scheduledAt) : undefined
  )

  // ダイアログ状態
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [showEmbedDialog, setShowEmbedDialog] = useState(false)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [showAnswerDialog, setShowAnswerDialog] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [printWithAnswers, setPrintWithAnswers] = useState(true)
  const [templateName, setTemplateName] = useState('')
  
  // 問題番号/解答欄のダイアログ用
  const [questionFormat, setQuestionFormat] = useState<keyof typeof QUESTION_NUMBER_FORMATS>('parentheses')
  const [questionStartNumber, setQuestionStartNumber] = useState(1)
  const [answerLabel, setAnswerLabel] = useState('答え')
  
  // 地図編集対象
  const [editingMapElementId, setEditingMapElementId] = useState<string | null>(null)
  const [editingEmbedElementId, setEditingEmbedElementId] = useState<string | null>(null)

  // ドラッグ&ドロップ
  const [draggingType, setDraggingType] = useState<ElementType | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const lastAddedRef = useRef<string | null>(null)

  // 初期化
  useEffect(() => {
    if (existingAssignment) {
      setCurrentEditor(existingAssignment.elements)
    } else if (assignmentId === 'template-history') {
      setCurrentEditor(getHistoryTemplate())
    } else {
      setCurrentEditor([])
    }
  }, [assignmentId, existingAssignment, setCurrentEditor])

  const elements = currentEditor

  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  // 要素追加後の自動スクロール
  useEffect(() => {
    if (lastAddedRef.current) {
      const element = document.getElementById(`element-${lastAddedRef.current}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      lastAddedRef.current = null
    }
  }, [elements])

  const addElement = useCallback((type: ElementType, additionalProps?: Partial<EditorElement>) => {
    // 特殊タイプの場合はダイアログを表示
    if (type === 'image' && !additionalProps?.imageData) {
      setShowImageDialog(true)
      fileInputRef.current?.click()
      return
    }
    if (type === 'map' && !additionalProps?.mapData) {
      const newId = generateId()
      setEditingMapElementId(newId)
      setShowMapDialog(true)
      // 後でマップデータと一緒に追加
      return
    }
    if (type === 'embed' && !additionalProps?.embedHtml) {
      const newId = generateId()
      setEditingEmbedElementId(newId)
      setShowEmbedDialog(true)
      return
    }
    if (type === 'question-label' && !additionalProps) {
      setShowQuestionDialog(true)
      return
    }
    if (type === 'answer-box' && !additionalProps) {
      setShowAnswerDialog(true)
      return
    }

    const newElement: EditorElement = {
      id: generateId(),
      type,
      content: getDefaultContent(type),
      size: { scale: 1 },
      ...(type === 'answer-box' && { answer: '', importantPoint: '' }),
      ...additionalProps
    }
    
    storeAddElement(newElement)
    setSelectedElement(newElement.id)
    lastAddedRef.current = newElement.id
  }, [storeAddElement])

  const updateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    storeUpdateElement(id, updates)
  }, [storeUpdateElement])

  const deleteElement = useCallback((id: string) => {
    storeDeleteElement(id)
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement, storeDeleteElement])

  const duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElement = { ...element, id: generateId() }
      const index = elements.findIndex(el => el.id === id)
      const newElements = [
        ...elements.slice(0, index + 1),
        newElement,
        ...elements.slice(index + 1)
      ]
      reorderElements(newElements)
      lastAddedRef.current = newElement.id
    }
  }, [elements, reorderElements])

  // 画像ファイル選択ハンドラー
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target?.result as string
        const newElement: EditorElement = {
          id: generateId(),
          type: 'image',
          content: file.name,
          imageData,
          size: { scale: 1 }
        }
        storeAddElement(newElement)
        setSelectedElement(newElement.id)
        lastAddedRef.current = newElement.id
      }
      reader.readAsDataURL(file)
    }
    setShowImageDialog(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 画像の置き換え（ドラッグ&ドロップ）
  const handleImageReplace = (elementId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result as string
      updateElement(elementId, { imageData, content: file.name })
    }
    reader.readAsDataURL(file)
  }

  // マップ保存
  const handleMapSave = (mapData: MapData) => {
    if (editingMapElementId) {
      // 既存要素を更新するか、新しい要素を追加
      const existingElement = elements.find(el => el.id === editingMapElementId)
      if (existingElement) {
        updateElement(editingMapElementId, { mapData })
      } else {
        const newElement: EditorElement = {
          id: editingMapElementId,
          type: 'map',
          content: 'マップ',
          mapData,
          size: { scale: 1 }
        }
        storeAddElement(newElement)
        setSelectedElement(newElement.id)
        lastAddedRef.current = newElement.id
      }
    }
    setShowMapDialog(false)
    setEditingMapElementId(null)
  }

  // 埋め込みHTML保存
  const handleEmbedSave = (html: string) => {
    if (editingEmbedElementId) {
      const existingElement = elements.find(el => el.id === editingEmbedElementId)
      if (existingElement) {
        updateElement(editingEmbedElementId, { embedHtml: html })
      } else {
        const newElement: EditorElement = {
          id: editingEmbedElementId,
          type: 'embed',
          content: 'HTML埋め込み',
          embedHtml: html,
          size: { scale: 1 }
        }
        storeAddElement(newElement)
        setSelectedElement(newElement.id)
        lastAddedRef.current = newElement.id
      }
    }
    setShowEmbedDialog(false)
    setEditingEmbedElementId(null)
  }

  // 問題番号追加
  const handleAddQuestionLabel = () => {
    const content = QUESTION_NUMBER_FORMATS[questionFormat](questionStartNumber)
    addElement('question-label', { 
      content,
      questionNumber: { format: questionFormat, number: questionStartNumber }
    })
    setShowQuestionDialog(false)
    setQuestionStartNumber(prev => prev + 1)
  }

  // 解答欄追加
  const handleAddAnswerBox = () => {
    addElement('answer-box', {
      content: answerLabel,
      answerLabel: { format: 'custom', label: answerLabel }
    })
    setShowAnswerDialog(false)
  }

  // ドラッグ開始
  const handleDragStart = (type: ElementType) => {
    setDraggingType(type)
  }

  // ドラッグ終了（キャンバスへのドロップ）
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggingType) {
      addElement(draggingType)
      setDraggingType(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handlePublish = () => {
    const assignmentData = {
      id: isNew ? generateId() : assignmentId,
      title,
      description,
      elements,
      deadline,
      deadlineTime: { hour: deadlineHour, minute: deadlineMinute },
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
      deadlineTime: { hour: deadlineHour, minute: deadlineMinute },
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
      deadlineTime: { hour: deadlineHour, minute: deadlineMinute },
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
    if (!printWindow) return
    
    const html = generatePrintHTML(title, description, elements, printWithAnswers)
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
    setShowPrintDialog(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* ヘッダー */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b"
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
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={!canUndo()}
                title="元に戻す (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={!canRedo()}
                title="やり直す (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowPrintDialog(true)}>
              <Printer className="w-4 h-4 mr-2" />
              印刷
            </Button>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(true)}>
              <Save className="w-4 h-4 mr-2" />
              テンプレート
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              下書き保存
            </Button>
            <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              予約
            </Button>
            <Button onClick={() => setShowPublishDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              公開
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* サイドバー - 要素追加 */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-56 shrink-0"
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
                    draggable
                    onDragStart={() => handleDragStart(item.type)}
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
        <div className="flex-1 space-y-4" ref={editorRef}>
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
          <Card 
            className="min-h-[600px]"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <CardContent className="p-6">
              {elements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <Plus className="w-12 h-12 mb-4" />
                  <p>左のパネルから要素を追加</p>
                  <p className="text-sm mt-2">またはドラッグ&ドロップ</p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={elements}
                  onReorder={reorderElements}
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {elements.map((element) => (
                      <Reorder.Item
                        key={element.id}
                        value={element}
                        id={`element-${element.id}`}
                        className="relative"
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
                          style={{
                            transform: `scale(${element.size?.scale || 1})`,
                            transformOrigin: 'top left'
                          }}
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
                              onEditMap={() => {
                                setEditingMapElementId(element.id)
                                setShowMapDialog(true)
                              }}
                              onEditEmbed={() => {
                                setEditingEmbedElementId(element.id)
                                setShowEmbedDialog(true)
                              }}
                              onImageDrop={(file) => handleImageReplace(element.id, file)}
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
                      onSelect={(date) => date && setDeadline(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={deadlineHour}
                    onChange={(e) => setDeadlineHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 text-center"
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={deadlineMinute}
                    onChange={(e) => setDeadlineMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 text-center"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右サイドバー - プロパティ */}
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

      {/* 各種ダイアログ */}
      
      {/* 公開確認 */}
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
                {format(deadline, 'M月d日', { locale: ja })} {deadlineHour}:{String(deadlineMinute).padStart(2, '0')}
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

      {/* 予約投稿 */}
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

      {/* 印刷 */}
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

      {/* テンプレート保存 */}
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

      {/* マップ編集 */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>地図を編集</DialogTitle>
            <DialogDescription>
              地図上をクリックしてピンを配置してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <MapEditor
              initialData={
                editingMapElementId 
                  ? elements.find(e => e.id === editingMapElementId)?.mapData 
                  : undefined
              }
              onSave={handleMapSave}
              onCancel={() => {
                setShowMapDialog(false)
                setEditingMapElementId(null)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 埋め込みHTML編集 */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>HTMLを埋め込み</DialogTitle>
            <DialogDescription>
              HTMLコードを入力してください。セキュリティのため、スクリプトは実行されません。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <EmbedEditor
              initialHtml={
                editingEmbedElementId
                  ? elements.find(e => e.id === editingEmbedElementId)?.embedHtml
                  : undefined
              }
              onSave={handleEmbedSave}
              onCancel={() => {
                setShowEmbedDialog(false)
                setEditingEmbedElementId(null)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 問題番号選択 */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>問題番号を追加</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>番号形式</Label>
              <Select value={questionFormat} onValueChange={(v) => setQuestionFormat(v as keyof typeof QUESTION_NUMBER_FORMATS)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parentheses">(1), (2), (3)...</SelectItem>
                  <SelectItem value="dot">1., 2., 3....</SelectItem>
                  <SelectItem value="mon">問1, 問2, 問3...</SelectItem>
                  <SelectItem value="bracket">[1], [2], [3]...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>開始番号</Label>
              <Input
                type="number"
                min={1}
                value={questionStartNumber}
                onChange={(e) => setQuestionStartNumber(parseInt(e.target.value) || 1)}
                className="mt-2"
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">プレビュー: </span>
              <span className="font-medium">{QUESTION_NUMBER_FORMATS[questionFormat](questionStartNumber)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddQuestionLabel}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 解答欄選択 */}
      <Dialog open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>解答欄を追加</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>ラベル</Label>
              <Input
                value={answerLabel}
                onChange={(e) => setAnswerLabel(e.target.value)}
                placeholder="ア, イ, 答え など"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnswerDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddAnswerBox}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 要素レンダラー
function ElementRenderer({
  element,
  onUpdate,
  isSelected,
  onEditMap,
  onEditEmbed,
  onImageDrop
}: {
  element: EditorElement
  onUpdate: (updates: Partial<EditorElement>) => void
  isSelected: boolean
  onEditMap: () => void
  onEditEmbed: () => void
  onImageDrop: (file: File) => void
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/') && element.type === 'image') {
      onImageDrop(file)
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
          <span className="text-lg font-medium">（　{element.content}　）</span>
        </div>
      )
    
    case 'divider':
      return <hr className="border-t-2 border-border" />
    
    case 'image':
      return (
        <div
          className="relative"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {element.imageData ? (
            <img
              src={element.imageData}
              alt={element.content}
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '300px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">画像をドロップ</p>
              </div>
            </div>
          )}
        </div>
      )
    
    case 'map':
      return element.mapData ? (
        <div className="space-y-2">
          <div className="h-48">
            <MapViewer data={element.mapData} className="h-full" />
          </div>
          <Button variant="outline" size="sm" onClick={onEditMap}>
            編集
          </Button>
        </div>
      ) : (
        <div 
          className="flex items-center justify-center h-48 bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/80"
          onClick={onEditMap}
        >
          <div className="text-center">
            <Map className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">クリックして地図を追加</p>
          </div>
        </div>
      )
    
    case 'embed':
      return element.embedHtml ? (
        <div className="space-y-2">
          <div className="p-4 bg-muted/50 rounded-lg">
            <EmbedViewer html={element.embedHtml} />
          </div>
          <Button variant="outline" size="sm" onClick={onEditEmbed}>
            編集
          </Button>
        </div>
      ) : (
        <div 
          className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/80"
          onClick={onEditEmbed}
        >
          <div className="text-center">
            <Code className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">クリックしてHTMLを追加</p>
          </div>
        </div>
      )
    
    default:
      return null
  }
}

// プロパティパネル
function ElementProperties({
  element,
  onUpdate
}: {
  element: EditorElement
  onUpdate: (updates: Partial<EditorElement>) => void
}) {
  const scale = element.size?.scale || 1

  return (
    <div className="space-y-6">
      {/* サイズ変更（全要素共通） */}
      <div>
        <Label className="text-sm">サイズ</Label>
        <div className="mt-2 space-y-2">
          <Slider
            value={[scale * 100]}
            onValueChange={([value]) => onUpdate({ size: { ...element.size, scale: value / 100 } })}
            min={50}
            max={150}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50%</span>
            <span>{Math.round(scale * 100)}%</span>
            <span>150%</span>
          </div>
        </div>
      </div>

      {/* 解答欄プロパティ */}
      {element.type === 'answer-box' && (
        <>
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
          {/* カタカナ記号追加 */}
          <div>
            <Label className="text-sm">カタカナ記号を追加</Label>
            <div className="mt-2">
              <KatakanaGrid
                selectedValue={element.katakanaSymbol}
                onSelect={(k) => onUpdate({ katakanaSymbol: k, content: k })}
                compact
              />
            </div>
          </div>
        </>
      )}

      {/* カタカナマーカープロパティ */}
      {element.type === 'katakana-marker' && (
        <div>
          <Label className="text-sm">カタカナ記号</Label>
          <div className="mt-2">
            <KatakanaGrid
              selectedValue={element.content as KatakanaMarker}
              onSelect={(k) => onUpdate({ content: k })}
            />
          </div>
        </div>
      )}

      {/* テキスト系のプロパティ */}
      {(element.type === 'text' || element.type === 'heading' || element.type === 'question-label') && (
        <div>
          <Label className="text-sm">コンテンツ</Label>
          <Textarea
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="mt-1"
          />
        </div>
      )}
    </div>
  )
}

function getDefaultContent(type: ElementType): string {
  switch (type) {
    case 'heading':
      return '見出し'
    case 'text':
      return ''
    case 'question-label':
      return '(1) '
    case 'answer-box':
      return '答え'
    case 'katakana-marker':
      return 'ア'
    default:
      return ''
  }
}

function getHistoryTemplate(): EditorElement[] {
  return [
    {
      id: 'template-1',
      type: 'heading',
      content: 'ふりかえりワーク歴史',
      size: { scale: 1 }
    },
    {
      id: 'template-2',
      type: 'text',
      content: '教科書を見て「学習課題」を自分で書き込もう。',
      size: { scale: 1 }
    },
    {
      id: 'template-3',
      type: 'question-label',
      content: '(1) 次の文章の空らんに当てはまる言葉を答えよう。',
      size: { scale: 1 }
    },
    {
      id: 'template-4',
      type: 'answer-box',
      content: 'ア',
      answer: '',
      importantPoint: '',
      size: { scale: 1 }
    }
  ]
}

function generatePrintHTML(title: string, description: string, elements: EditorElement[], withAnswers: boolean): string {
  let content = ''
  
  elements.forEach(el => {
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
  <title>${title || '無題の課題'}</title>
  <style>
    body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1 style="font-size: 1.75rem; margin-bottom: 0.5rem;">${title || '無題の課題'}</h1>
  ${description ? `<p style="color: #666; margin-bottom: 1.5rem;">${description}</p>` : ''}
  ${content}
</body>
</html>`
}

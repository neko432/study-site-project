'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  Code,
  Undo2,
  Redo2,
  MapPin,
  Layout,
  LayoutGrid,
  Move
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
import { Slider } from '@/components/ui/slider'
import { useAppStore } from '@/lib/store'
import { KATAKANA_MARKERS, type EditorElement, type ElementType, type LayoutMode } from '@/lib/types'
import { ElementTransformControls, ElementResizeWidth } from '@/components/teacher/element-transform-controls'
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
  { type: 'embed', icon: <Code className="w-4 h-4" />, label: 'HTML埋め込み' },
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
  const [printWithImportantPoints, setPrintWithImportantPoints] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showAnswerLabelDialog, setShowAnswerLabelDialog] = useState(false)
  const [pendingAnswerBoxType, setPendingAnswerBoxType] = useState<'katakana' | 'number' | 'custom'>('katakana')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(existingAssignment?.layoutMode || 'linear')
  
  // Undo/Redo 履歴
  const [history, setHistory] = useState<EditorElement[][]>([existingAssignment?.elements || []])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  // 自動スクロール用のref
  const editorRef = useRef<HTMLDivElement>(null)
  const lastAddedElementRef = useRef<string | null>(null)
  
  // ドラッグ＆ドロップ用の状態
  const [isDraggingElement, setIsDraggingElement] = useState(false)
  const [draggedElementType, setDraggedElementType] = useState<ElementType | null>(null)

  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  // 履歴に保存
  const saveToHistory = useCallback((newElements: EditorElement[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      return [...newHistory, newElements]
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setElements(history[historyIndex - 1])
    }
  }, [historyIndex, history])

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setElements(history[historyIndex + 1])
    }
  }, [historyIndex, history])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // 使用済みのラベルを取得
  const usedLabels = elements
    .filter(e => e.type === 'answer-box')
    .map(e => e.content)
    
  // 次に使用可能なカタカナラベル
  const nextKatakanaLabel = KATAKANA_MARKERS.find(k => !usedLabels.includes(k)) || KATAKANA_MARKERS[0]
  
  // 次に使用可能な問題番号（Q1, Q2, ...）
  const getNextNumberLabel = () => {
    let num = 1
    while (usedLabels.includes(`Q${num}`)) {
      num++
    }
    return `Q${num}`
  }

  // 解答欄追加時にダイアログを表示
  const handleAddAnswerBox = () => {
    setShowAnswerLabelDialog(true)
  }
  
  // 選択したラベルで解答欄を追加
  const addAnswerBoxWithLabel = (label: string) => {
    const newElement: EditorElement = {
      id: generateId(),
      type: 'answer-box',
      content: label,
      answer: '',
      importantPoint: ''
    }
    
    const newElements = [...elements, newElement]
    setElements(newElements)
    saveToHistory(newElements)
    setSelectedElement(newElement.id)
    lastAddedElementRef.current = newElement.id
    setShowAnswerLabelDialog(false)
  }

  const addElement = useCallback((type: ElementType) => {
    // 解答欄の場合はダイアログを表示
    if (type === 'answer-box') {
      setShowAnswerLabelDialog(true)
      return
    }
    
    const newElement: EditorElement = {
      id: generateId(),
      type,
      content: getDefaultContent(type, katakanaIndex),
      ...(type === 'image' && { imageUrl: '' }),
      ...(type === 'map' && { mapPins: [] }),
      ...(type === 'embed' && { embedHtml: '' })
    }
    
    if (type === 'katakana-marker') {
      setKatakanaIndex(prev => (prev + 1) % KATAKANA_MARKERS.length)
    }
    
    const newElements = [...elements, newElement]
    setElements(newElements)
    saveToHistory(newElements)
    setSelectedElement(newElement.id)
    lastAddedElementRef.current = newElement.id
  }, [katakanaIndex, elements, saveToHistory])

  // 自動スクロール
  useEffect(() => {
    if (lastAddedElementRef.current && editorRef.current) {
      const elementNode = document.getElementById(`element-${lastAddedElementRef.current}`)
      if (elementNode) {
        elementNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
        lastAddedElementRef.current = null
      }
    }
  }, [elements])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  const updateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el)
    setElements(newElements)
    // Debounce history saving for text updates
  }, [elements])

  const deleteElement = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    saveToHistory(newElements)
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement, elements, saveToHistory])

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
    // 印刷用のHTMLを生成
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('ポップアップがブロックされました。印刷を許可してください。')
      return
    }
    
    const printContent = generatePrintHTML(
      title || '無題の課題',
      description,
      elements,
      printWithAnswers,
      printWithImportantPoints
    )
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // 印刷ダイアログを表示
    setTimeout(() => {
      printWindow.print()
    }, 250)
    
    setShowPrintDialog(false)
  }
  
  // 印刷用HTMLを生成する関数
  const generatePrintHTML = (
    title: string,
    description: string,
    elements: EditorElement[],
    showAnswers: boolean,
    showImportantPoints: boolean
  ): string => {
    const elementsHTML = elements.map(el => {
      switch (el.type) {
        case 'heading':
          return `<h2 class="print-heading">${escapeHTML(el.content)}</h2>`
        case 'text':
          return `<p class="print-question">${escapeHTML(el.content)}</p>`
        case 'question-label':
          return `<p class="print-question" style="font-weight: 600;">${escapeHTML(el.content)}</p>`
        case 'answer-box':
          const answerHTML = showAnswers && el.answer 
            ? `<span class="print-answer-text">${escapeHTML(el.answer)}</span>`
            : '<span style="display: inline-block; width: 150px; border-bottom: 1px solid #000;"></span>'
          const importantHTML = showImportantPoints && el.importantPoint
            ? `<div class="print-important-point">※ ${escapeHTML(el.importantPoint)}</div>`
            : ''
          return `
            <div class="print-answer-box print-no-break">
              <span class="print-answer-label">${escapeHTML(el.content)}:</span>
              ${answerHTML}
              ${importantHTML}
            </div>
          `
        case 'divider':
          return '<hr class="print-divider" />'
        case 'image':
          if (el.imageUrl) {
            const width = el.style?.width ? `width: ${el.style.width}%;` : 'max-width: 100%;'
            return `<img src="${el.imageUrl}" class="print-image" style="${width}" alt="画像" />`
          }
          return ''
        default:
          return ''
      }
    }).join('\n')
    
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>${escapeHTML(title)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Hiragino Sans', 'Meiryo', sans-serif; 
            font-size: 12pt; 
            line-height: 1.6;
            padding: 1cm;
          }
          .print-title { font-size: 20pt; font-weight: bold; margin-bottom: 0.5cm; text-align: center; }
          .print-description { font-size: 11pt; margin-bottom: 1cm; color: #333; }
          .print-heading { font-size: 14pt; font-weight: bold; margin: 0.8cm 0 0.3cm 0; }
          .print-question { font-size: 12pt; margin: 0.3cm 0; }
          .print-answer-box { 
            border: 1pt solid #ccc; 
            padding: 0.4cm; 
            margin: 0.3cm 0; 
            border-radius: 4px;
            background: #fafafa;
          }
          .print-answer-label { font-weight: bold; margin-right: 0.3cm; }
          .print-answer-text { color: #cc0000; font-weight: bold; }
          .print-important-point { color: #0066cc; font-size: 10pt; margin-top: 0.2cm; }
          .print-divider { border: none; border-top: 1px solid #ddd; margin: 0.5cm 0; }
          .print-image { max-width: 100%; height: auto; margin: 0.3cm 0; }
          .print-no-break { page-break-inside: avoid; }
          @media print {
            body { padding: 0; }
            .print-answer-box { background: white; }
          }
        </style>
      </head>
      <body>
        <h1 class="print-title">${escapeHTML(title)}</h1>
        ${description ? `<p class="print-description">${escapeHTML(description)}</p>` : ''}
        ${elementsHTML}
      </body>
      </html>
    `
  }
  
  // HTMLエスケープ用関数
  const escapeHTML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>')
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
            <div className="flex items-center gap-1 mr-2 border-r pr-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleUndo} 
                disabled={!canUndo}
                title="元に戻す (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRedo} 
                disabled={!canRedo}
                title="やり直し (Ctrl+Y)"
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
                    className="w-full justify-start gap-3 h-10 cursor-grab active:cursor-grabbing"
                    onClick={() => addElement(item.type)}
                    draggable
                    onDragStart={(e) => {
                      setIsDraggingElement(true)
                      setDraggedElementType(item.type)
                      e.dataTransfer.setData('elementType', item.type)
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onDragEnd={() => {
                      setIsDraggingElement(false)
                      setDraggedElementType(null)
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </motion.div>
              ))}

              {/* レイアウトモード切り替え */}
              <div className="pt-4 mt-4 border-t">
                <Label className="text-sm text-muted-foreground mb-2 block">レイアウトモード</Label>
                <div className="flex gap-2">
                  <Button
                    variant={layoutMode === 'linear' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setLayoutMode('linear')}
                  >
                    <Layout className="w-4 h-4" />
                    リニア
                  </Button>
                  <Button
                    variant={layoutMode === 'freeform' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setLayoutMode('freeform')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    自由
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {layoutMode === 'linear' 
                    ? '要素を上から下へ順番に配置' 
                    : '要素を自由に配置・移動可能'}
                </p>
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
          <Card className={`min-h-[600px] transition-colors ${isDraggingElement ? 'border-primary border-2 border-dashed' : ''}`}>
            <CardContent 
              className="p-6" 
              ref={editorRef}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={(e) => {
                e.preventDefault()
                const elementType = e.dataTransfer.getData('elementType') as ElementType
                if (elementType) {
                  addElement(elementType)
                }
                setIsDraggingElement(false)
                setDraggedElementType(null)
              }}
            >
              {elements.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-96 text-muted-foreground rounded-xl transition-colors ${isDraggingElement ? 'bg-primary/5' : ''}`}>
                  <Plus className="w-12 h-12 mb-4" />
                  <p>{isDraggingElement ? 'ここにドロップし��追加' : '左のパネルから要素を追加、またはドラッグ'}</p>
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
            <DialogDescription>
              印刷に含める内容を選択してください
            </DialogDescription>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-important-points"
                checked={printWithImportantPoints}
                onCheckedChange={(checked) => setPrintWithImportantPoints(checked as boolean)}
              />
              <Label htmlFor="print-important-points">重要ポイントを含めて印刷する</Label>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                プレビュー: {elements.filter(e => e.type === 'answer-box').length}問の解答欄
                {printWithAnswers && '（答え付き）'}
                {printWithImportantPoints && '（解説付き）'}
              </p>
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

      {/* 解答欄ラベル選択ダイアログ */}
      <Dialog open={showAnswerLabelDialog} onOpenChange={setShowAnswerLabelDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>解答欄のラベルを選択</DialogTitle>
            <DialogDescription>
              解答欄に表示するラベルを選んでください
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* カタカナ選択 */}
            <div>
              <Label className="text-sm font-medium mb-2 block">カタカナ（ア、イ、ウ...）</Label>
              <div className="flex flex-wrap gap-2">
                {KATAKANA_MARKERS.slice(0, 20).map((marker) => {
                  const isUsed = usedLabels.includes(marker)
                  return (
                    <Button
                      key={marker}
                      variant={isUsed ? 'outline' : 'secondary'}
                      size="sm"
                      className={`w-9 h-9 ${isUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={() => !isUsed && addAnswerBoxWithLabel(marker)}
                      disabled={isUsed}
                    >
                      {marker}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                次におすすめ: <Badge variant="outline" className="ml-1">{nextKatakanaLabel}</Badge>
              </p>
            </div>

            {/* 問題番号選択 */}
            <div>
              <Label className="text-sm font-medium mb-2 block">問題番号（Q1、Q2...）</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, i) => `Q${i + 1}`).map((label) => {
                  const isUsed = usedLabels.includes(label)
                  return (
                    <Button
                      key={label}
                      variant={isUsed ? 'outline' : 'secondary'}
                      size="sm"
                      className={`px-3 h-9 ${isUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={() => !isUsed && addAnswerBoxWithLabel(label)}
                      disabled={isUsed}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                次におすすめ: <Badge variant="outline" className="ml-1">{getNextNumberLabel()}</Badge>
              </p>
            </div>

            {/* カスタム入力 */}
            <div>
              <Label className="text-sm font-medium mb-2 block">カスタムラベル</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="例: 問1、(ア)、答え"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget
                      if (input.value.trim()) {
                        addAnswerBoxWithLabel(input.value.trim())
                        input.value = ''
                      }
                    }
                  }}
                />
                <Button
                  variant="default"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    if (input.value.trim()) {
                      addAnswerBoxWithLabel(input.value.trim())
                      input.value = ''
                    }
                  }}
                >
                  追加
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnswerLabelDialog(false)}>
              キャンセル
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
      const handleImageUpload = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            onUpdate({ imageUrl: e.target.result as string })
          }
        }
        reader.readAsDataURL(file)
      }

      const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
          handleImageUpload(file)
        }
      }

      const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
          handleImageUpload(file)
        }
      }

      if (element.imageUrl) {
        return (
          <div 
            className="relative group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <img 
              src={element.imageUrl} 
              alt="アップロード画像" 
              className="max-w-full h-auto rounded-lg"
              style={{ 
                width: element.style?.width ? `${element.style.width}%` : 'auto',
                height: element.style?.height ? `${element.style.height}px` : 'auto'
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <label className="cursor-pointer text-white text-sm">
                クリックまたはドラッグで置き換え
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>
        )
      }

      return (
        <div 
          className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <label className="cursor-pointer text-center">
            <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">クリックまたはドラッグで画像をアップロード</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      )
    
    case 'map':
      return (
        <div className="flex items-center justify-center h-48 bg-muted rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Map className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">地図を追加（プロパティで設定）</p>
            {element.mapPins && element.mapPins.length > 0 && (
              <p className="text-xs text-primary mt-1">{element.mapPins.length}個のピンが設定済み</p>
            )}
          </div>
        </div>
      )

    case 'embed':
      if (element.embedHtml) {
        return (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div 
              className="embed-content"
              dangerouslySetInnerHTML={{ __html: element.embedHtml }}
            />
          </div>
        )
      }
      return (
        <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Code className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">HTML埋め込み（プロパティで設定）</p>
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

  if (element.type === 'image') {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm">幅 (%)</Label>
          <Slider
            value={[element.style?.width || 100]}
            onValueChange={([value]) => onUpdate({ style: { ...element.style, width: value } })}
            min={10}
            max={100}
            step={5}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">{element.style?.width || 100}%</p>
        </div>
        {element.imageUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onUpdate({ imageUrl: '' })}
          >
            画像を削除
          </Button>
        )}
      </div>
    )
  }

  if (element.type === 'map') {
    const [newPin, setNewPin] = useState({ lat: '', lng: '', label: '' })
    
    const addPin = () => {
      if (newPin.lat && newPin.lng) {
        const pins = element.mapPins || []
        onUpdate({ 
          mapPins: [...pins, { 
            lat: parseFloat(newPin.lat), 
            lng: parseFloat(newPin.lng), 
            label: newPin.label 
          }] 
        })
        setNewPin({ lat: '', lng: '', label: '' })
      }
    }

    const removePin = (index: number) => {
      const pins = element.mapPins || []
      onUpdate({ mapPins: pins.filter((_, i) => i !== index) })
    }

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm">ピンを追加</Label>
          <div className="space-y-2 mt-2">
            <Input
              placeholder="緯度 (例: 35.6762)"
              value={newPin.lat}
              onChange={(e) => setNewPin({ ...newPin, lat: e.target.value })}
            />
            <Input
              placeholder="経度 (例: 139.6503)"
              value={newPin.lng}
              onChange={(e) => setNewPin({ ...newPin, lng: e.target.value })}
            />
            <Input
              placeholder="ラベル (任意)"
              value={newPin.label}
              onChange={(e) => setNewPin({ ...newPin, label: e.target.value })}
            />
            <Button size="sm" onClick={addPin} className="w-full">
              ピンを追加
            </Button>
          </div>
        </div>
        {element.mapPins && element.mapPins.length > 0 && (
          <div>
            <Label className="text-sm">設定済みのピン</Label>
            <div className="space-y-2 mt-2">
              {element.mapPins.map((pin, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                  <span className="flex-1">{pin.label || `ピン${index + 1}`}: ({pin.lat}, {pin.lng})</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => removePin(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (element.type === 'embed') {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm">HTMLコード</Label>
          <Textarea
            value={element.embedHtml || ''}
            onChange={(e) => onUpdate({ embedHtml: e.target.value })}
            className="mt-1 font-mono text-xs"
            placeholder="<iframe>...</iframe>"
            rows={6}
          />
          <p className="text-xs text-muted-foreground mt-1">
            iframe、動画、その他のHTMLを埋め込み
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">コンテンツ</Label>
        <Textarea
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-sm">フォントサイズ</Label>
        <Select
          value={element.style?.fontSize || 'default'}
          onValueChange={(value) => onUpdate({ style: { ...element.style, fontSize: value === 'default' ? undefined : value } })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="デフォルト" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">デフォルト</SelectItem>
            <SelectItem value="0.75rem">小</SelectItem>
            <SelectItem value="1rem">中</SelectItem>
            <SelectItem value="1.25rem">大</SelectItem>
            <SelectItem value="1.5rem">特大</SelectItem>
          </SelectContent>
        </Select>
      </div>
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

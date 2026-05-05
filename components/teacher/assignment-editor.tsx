'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
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
  MapPin,
  Move,
  Maximize2
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useAppStore } from '@/lib/store'
import { useHistory } from '@/lib/use-history'
import { KATAKANA_MARKERS, type EditorElement, type ElementType } from '@/lib/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface AssignmentEditorProps {
  assignmentId: string
  onBack: () => void
}

const ELEMENT_TYPES: { type: ElementType; icon: React.ReactNode; label: string; description?: string }[] = [
  { type: 'heading', icon: <Heading1 className="w-4 h-4" />, label: '見出し', description: 'セクションタイトル' },
  { type: 'text', icon: <Type className="w-4 h-4" />, label: 'テキスト', description: '説明文・問題文' },
  { type: 'answer-box', icon: <FileQuestion className="w-4 h-4" />, label: '解答欄', description: '生徒が回答する欄' },
  { type: 'question-label', icon: <List className="w-4 h-4" />, label: '問題番号', description: '(1), (2) など' },
  { type: 'divider', icon: <Minus className="w-4 h-4" />, label: '区切り線', description: 'セクション区切り' },
  { type: 'image', icon: <Image className="w-4 h-4" />, label: '画像', description: '画像をアップロード' },
  { type: 'map', icon: <Map className="w-4 h-4" />, label: '地図', description: 'ピン付き地図' },
  { type: 'embed', icon: <Code className="w-4 h-4" />, label: '埋め込み', description: 'HTMLを埋め込む' },
]

export function AssignmentEditor({ assignmentId, onBack }: AssignmentEditorProps) {
  const { assignments, addAssignment, updateAssignment, addTemplate } = useAppStore()

  const existingAssignment = assignments.find(a => a.id === assignmentId)
  const isNew = assignmentId === 'new' || assignmentId.startsWith('template-')

  const [title, setTitle] = useState(existingAssignment?.title || '')
  const [description, setDescription] = useState(existingAssignment?.description || '')
  
  // Undo/Redo対応のelements管理
  const {
    state: elements,
    set: setElements,
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
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [showEmbedDialog, setShowEmbedDialog] = useState(false)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [katakanaIndex, setKatakanaIndex] = useState(0)
  const [printWithAnswers, setPrintWithAnswers] = useState(true)
  const [templateName, setTemplateName] = useState('')
  const [embedCode, setEmbedCode] = useState('')
  const [draggedType, setDraggedType] = useState<ElementType | null>(null)
  
  // Refs
  const elementsContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastAddedElementRef = useRef<string | null>(null)
  
  // キーボードショートカット
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

  const addElement = useCallback((type: ElementType, insertIndex?: number) => {
    const newElement: EditorElement = {
      id: generateId(),
      type,
      content: getDefaultContent(type, katakanaIndex),
      ...(type === 'answer-box' && { answer: '', importantPoint: '' }),
      ...(type === 'image' && { src: '' }),
      ...(type === 'map' && { mapPosition: { lat: 35.6762, lng: 139.6503 }, mapPins: [] }),
      ...(type === 'embed' && { embedCode: '' }),
      size: { width: 'full', height: 'auto' }
    }
    
    if (type === 'katakana-marker') {
      setKatakanaIndex(prev => (prev + 1) % KATAKANA_MARKERS.length)
    }
    
    if (insertIndex !== undefined) {
      setElements(prev => [
        ...prev.slice(0, insertIndex),
        newElement,
        ...prev.slice(insertIndex)
      ])
    } else {
      setElements(prev => [...prev, newElement])
    }
    
    setSelectedElement(newElement.id)
    lastAddedElementRef.current = newElement.id
    
    // 自動スクロール
    setTimeout(() => {
      const elementNode = document.getElementById(`element-${newElement.id}`)
      if (elementNode) {
        elementNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
    
    // 画像の場合、ファイル選択ダイアログを開く
    if (type === 'image') {
      setTimeout(() => fileInputRef.current?.click(), 200)
    }
    // 埋め込みの場合、ダイアログを開く
    if (type === 'embed') {
      setShowEmbedDialog(true)
    }
  }, [katakanaIndex, setElements])

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
  }, [elements, setElements])
  
  // 画像アップロード処理
  const handleImageUpload = useCallback((file: File, elementId?: string) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      if (elementId) {
        // 既存要素の画像を置き換え
        updateElement(elementId, { src: base64 })
      } else if (lastAddedElementRef.current) {
        // 新規追加された画像要素に設定
        updateElement(lastAddedElementRef.current, { src: base64 })
      }
    }
    reader.readAsDataURL(file)
  }, [updateElement])
  
  // ドラッグ&ドロップで要素追加
  const handleDragStart = useCallback((type: ElementType) => {
    setDraggedType(type)
  }, [])
  
  const handleDragEnd = useCallback(() => {
    setDraggedType(null)
  }, [])
  
  const handleDropOnCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (draggedType) {
      addElement(draggedType)
      setDraggedType(null)
    }
  }, [draggedType, addElement])
  
  // 埋め込みコードの保存
  const handleSaveEmbed = useCallback(() => {
    if (lastAddedElementRef.current && embedCode) {
      updateElement(lastAddedElementRef.current, { embedCode })
    }
    setShowEmbedDialog(false)
    setEmbedCode('')
  }, [embedCode, updateElement])

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
    // 印刷用のウィンドウを開く
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      alert('ポップアップがブロックされました。ポップアップを許可してください。')
      return
    }
    
    // 印刷用HTMLを生成
    const printContent = generatePrintHTML(title, description, elements, printWithAnswers)
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // 印刷ダイアログを表示
    printWindow.onload = () => {
      printWindow.print()
    }
    
    setShowPrintDialog(false)
  }
  
  // 印刷用HTML生成関数
  const generatePrintHTML = (
    title: string, 
    description: string, 
    elements: EditorElement[], 
    showAnswers: boolean
  ) => {
    const elementsHTML = elements.map(el => {
      switch (el.type) {
        case 'heading':
          return `<h2 style="font-size: 1.25rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem;">${el.content}</h2>`
        case 'text':
          return `<p style="line-height: 1.75;">${el.content}</p>`
        case 'question-label':
          return `<p style="font-weight: 500; margin-top: 1rem;">${el.content}</p>`
        case 'answer-box':
          const answerDisplay = showAnswers && el.answer 
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
        case 'map':
          return `
            <div style="margin: 1rem 0; border: 1px solid #d1d5db; height: ${el.size?.height || 200}px; display: flex; align-items: center; justify-content: center; background: #f3f4f6;">
              <div style="text-align: center; color: #6b7280;">
                <p style="font-size: 0.875rem;">地図</p>
                <p style="font-size: 0.75rem;">緯度: ${el.mapPosition?.lat?.toFixed(4) || '35.6762'}, 経度: ${el.mapPosition?.lng?.toFixed(4) || '139.6503'}</p>
              </div>
            </div>
          `
        default:
          return ''
      }
    }).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title || '課題'} - 印刷</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
            line-height: 1.6;
            color: #000;
            background: #fff;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">${title || '無題の課題'}</h1>
              ${description ? `<p style="font-size: 0.875rem; margin-top: 0.5rem; color: #4b5563;">${description}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.875rem;">クラス:</span>
                <span style="border-bottom: 1px solid #000; min-width: 80px; display: inline-block; text-align: center;">&nbsp;</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                <span style="font-size: 0.875rem;">名前:</span>
                <span style="border-bottom: 1px solid #000; min-width: 120px; display: inline-block; text-align: center;">&nbsp;</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          ${elementsHTML}
        </div>
        
        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #d1d5db; font-size: 0.75rem; color: #6b7280; text-align: center;">
          ${showAnswers ? '【解答付き】' : ''}
        </div>
      </body>
      </html>
    `
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
            {/* Undo/Redo ボタン */}
            <TooltipProvider>
              <div className="flex items-center gap-1 mr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={undo}
                      disabled={!canUndo}
                      className="h-8 w-8"
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>元に戻す (Ctrl+Z)</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={redo}
                      disabled={!canRedo}
                      className="h-8 w-8"
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>やり直し (Ctrl+Shift+Z)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            
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

      {/* 非表示のファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleImageUpload(file)
          }
          e.target.value = ''
        }}
      />

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* サイドバー - 要素追加 */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-64 shrink-0"
        >
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                要素を追加
                <Badge variant="outline" className="text-xs font-normal">
                  ドラッグ可
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ELEMENT_TYPES.map((item) => (
                <TooltipProvider key={item.type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        draggable
                        onDragStart={() => handleDragStart(item.type)}
                        onDragEnd={handleDragEnd}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-10 cursor-grab active:cursor-grabbing"
                          onClick={() => addElement(item.type)}
                        >
                          <Move className="w-3 h-3 text-muted-foreground" />
                          {item.icon}
                          {item.label}
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    {item.description && (
                      <TooltipContent side="right">
                        <p>{item.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
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
          <Card 
            className={`min-h-[600px] transition-colors ${
              draggedType ? 'border-primary/50 bg-primary/5' : ''
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnCanvas}
          >
            <CardContent className="p-6" ref={elementsContainerRef}>
              {elements.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-96 text-muted-foreground border-2 border-dashed rounded-xl ${
                  draggedType ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                  <Plus className="w-12 h-12 mb-4" />
                  <p>左のパネルから要素を追加、またはドラッグ&ドロップ</p>
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
                              onImageUpload={(file) => handleImageUpload(file, element.id)}
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

      {/* 埋め込みダイアログ */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              HTMLを埋め込む
            </DialogTitle>
            <DialogDescription>
              埋め込みたいHTMLコードを入力してください。YouTube、Google Forms、その他の埋め込みコードが利用できます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="embed-code">埋め込みコード</Label>
            <Textarea
              id="embed-code"
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              placeholder='<iframe src="..." ...></iframe>'
              className="mt-2 min-h-[150px] font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEmbedDialog(false)
              setEmbedCode('')
            }}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEmbed} disabled={!embedCode}>
              <Check className="w-4 h-4 mr-2" />
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
  onImageUpload,
  isSelected
}: {
  element: EditorElement
  onUpdate: (updates: Partial<EditorElement>) => void
  onImageUpload?: (file: File) => void
  isSelected: boolean
}) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  
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
          className={`relative rounded-lg border-2 border-dashed transition-colors ${
            element.src ? 'border-transparent' : 'border-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const file = e.dataTransfer.files[0]
            if (file && file.type.startsWith('image/') && onImageUpload) {
              onImageUpload(file)
            }
          }}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file && onImageUpload) {
                onImageUpload(file)
              }
              e.target.value = ''
            }}
          />
          {element.src ? (
            <div className="relative group">
              <img 
                src={element.src} 
                alt="アップロード画像" 
                className="max-w-full rounded-lg"
                style={{
                  width: element.size?.width === 'full' ? '100%' : element.size?.width || 'auto',
                  height: element.size?.height === 'auto' ? 'auto' : element.size?.height
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image className="w-4 h-4 mr-2" />
                  画像を変更
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center h-32 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">クリックまたはドラッグで画像をアップロード</p>
            </div>
          )}
        </div>
      )
    
    case 'map':
      const mapLat = element.mapPosition?.lat || 35.6762
      const mapLng = element.mapPosition?.lng || 139.6503
      return (
        <div className="relative rounded-lg overflow-hidden border">
          <div 
            className="h-48 bg-muted flex items-center justify-center"
            style={{
              backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${mapLat},${mapLng}&zoom=12&size=600x300&maptype=roadmap&key=YOUR_API_KEY)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="text-center bg-card/90 p-4 rounded-lg">
              <MapPin className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">緯度: {mapLat.toFixed(4)}</p>
              <p className="text-sm font-medium">経度: {mapLng.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                プロパティパネルで位置を調整できます
              </p>
            </div>
          </div>
        </div>
      )
    
    case 'embed':
      return (
        <div className="rounded-lg border overflow-hidden">
          {element.embedCode ? (
            <div 
              className="embed-container"
              dangerouslySetInnerHTML={{ __html: element.embedCode }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-32 bg-muted">
              <Code className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">埋め込みコードを設定してください</p>
            </div>
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

  // 画像のプロパティ
  if (element.type === 'image') {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            サイズ設定
          </Label>
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">幅</p>
              <Select
                value={element.size?.width?.toString() || 'full'}
                onValueChange={(value) => onUpdate({ 
                  size: { ...element.size, width: value as 'auto' | 'full' | number } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">100%</SelectItem>
                  <SelectItem value="auto">自動</SelectItem>
                  <SelectItem value="300">300px</SelectItem>
                  <SelectItem value="400">400px</SelectItem>
                  <SelectItem value="500">500px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">高さ</p>
              <Select
                value={element.size?.height?.toString() || 'auto'}
                onValueChange={(value) => onUpdate({ 
                  size: { ...element.size, height: value === 'auto' ? 'auto' : parseInt(value) } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">自動</SelectItem>
                  <SelectItem value="150">150px</SelectItem>
                  <SelectItem value="200">200px</SelectItem>
                  <SelectItem value="300">300px</SelectItem>
                  <SelectItem value="400">400px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 地図のプロパティ
  if (element.type === 'map') {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            位置設定
          </Label>
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">緯度</p>
              <Input
                type="number"
                step="0.0001"
                value={element.mapPosition?.lat || 35.6762}
                onChange={(e) => onUpdate({ 
                  mapPosition: { 
                    ...element.mapPosition, 
                    lat: parseFloat(e.target.value) || 35.6762,
                    lng: element.mapPosition?.lng || 139.6503
                  } 
                })}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">経度</p>
              <Input
                type="number"
                step="0.0001"
                value={element.mapPosition?.lng || 139.6503}
                onChange={(e) => onUpdate({ 
                  mapPosition: { 
                    lat: element.mapPosition?.lat || 35.6762,
                    lng: parseFloat(e.target.value) || 139.6503
                  } 
                })}
              />
            </div>
          </div>
        </div>
        <div>
          <Label className="text-sm flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            サイズ
          </Label>
          <div className="mt-2">
            <Select
              value={element.size?.height?.toString() || '200'}
              onValueChange={(value) => onUpdate({ 
                size: { ...element.size, height: parseInt(value) } 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="150">小 (150px)</SelectItem>
                <SelectItem value="200">中 (200px)</SelectItem>
                <SelectItem value="300">大 (300px)</SelectItem>
                <SelectItem value="400">特大 (400px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  // 埋め込みのプロパティ
  if (element.type === 'embed') {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm">埋め込みコード</Label>
          <Textarea
            value={element.embedCode || ''}
            onChange={(e) => onUpdate({ embedCode: e.target.value })}
            className="mt-1 font-mono text-xs"
            placeholder="<iframe>...</iframe>"
            rows={5}
          />
        </div>
        <div>
          <Label className="text-sm flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            最小高さ
          </Label>
          <Select
            value={element.size?.minHeight?.toString() || '200'}
            onValueChange={(value) => onUpdate({ 
              size: { ...element.size, minHeight: parseInt(value) } 
            })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="150">150px</SelectItem>
              <SelectItem value="200">200px</SelectItem>
              <SelectItem value="300">300px</SelectItem>
              <SelectItem value="400">400px</SelectItem>
              <SelectItem value="500">500px</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

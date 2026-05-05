'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Printer, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Assignment, EditorElement } from '@/lib/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface PrintDialogProps {
  assignment: Assignment
  open: boolean
  onOpenChange: (open: boolean) => void
  printWithAnswers: boolean
  setPrintWithAnswers: (value: boolean) => void
}

export function PrintDialog({
  assignment,
  open,
  onOpenChange,
  printWithAnswers,
  setPrintWithAnswers
}: PrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = document.getElementById('print-preview-content')
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
          padding: 20mm;
          line-height: 1.6;
          color: #1a1a1a;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #333;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .description {
          font-size: 14px;
          color: #666;
        }
        .meta {
          font-size: 12px;
          color: #888;
          margin-top: 8px;
        }
        .element {
          margin-bottom: 16px;
        }
        .heading {
          font-size: 20px;
          font-weight: bold;
          margin: 24px 0 12px 0;
        }
        .text {
          font-size: 14px;
          line-height: 1.8;
        }
        .question-label {
          font-size: 14px;
          font-weight: 500;
          margin: 16px 0 8px 0;
        }
        .answer-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 12px 0;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
        }
        .answer-label {
          display: inline-block;
          padding: 4px 12px;
          background: #e0e7ff;
          color: #3730a3;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
        }
        .answer-input {
          flex: 1;
          min-height: 32px;
          border-bottom: 1px solid #ccc;
        }
        .answer-text {
          flex: 1;
          color: #059669;
          font-weight: 500;
          font-size: 16px;
        }
        .important-point {
          margin-top: 8px;
          padding: 8px;
          background: #fef3c7;
          border-radius: 4px;
          font-size: 12px;
          color: #92400e;
        }
        .divider {
          height: 2px;
          background: #e5e7eb;
          margin: 24px 0;
        }
        .image-container {
          margin: 16px 0;
          text-align: center;
        }
        .image-container img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        .map-placeholder {
          padding: 24px;
          background: #f3f4f6;
          border-radius: 8px;
          text-align: center;
          color: #6b7280;
        }
        .embed-content {
          padding: 16px;
          background: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
        }
        @media print {
          body {
            padding: 15mm;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    `

    const content = printContent.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${assignment.title} - 印刷</title>
          ${styles}
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const answerElements = assignment.elements.filter(e => e.type === 'answer-box')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            印刷プレビュー
          </DialogTitle>
          <DialogDescription>
            印刷オプションを選択してください
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Options */}
          <div className="w-64 shrink-0 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-answers"
                checked={printWithAnswers}
                onCheckedChange={(checked) => setPrintWithAnswers(checked as boolean)}
              />
              <Label htmlFor="print-answers" className="cursor-pointer">
                答えを含めて印刷する
              </Label>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">印刷内容</p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  課題タイトル
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  問題 ({assignment.elements.length}個の要素)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  解答欄 ({answerElements.length}問)
                </li>
                {printWithAnswers && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-answer" />
                    答え
                  </li>
                )}
              </ul>
            </div>

            <Button onClick={handlePrint} className="w-full">
              <Printer className="w-4 h-4 mr-2" />
              印刷する
            </Button>
          </div>

          {/* Preview */}
          <div className="flex-1 border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b">
              <p className="text-sm text-muted-foreground">プレビュー</p>
            </div>
            <div className="h-[500px] overflow-y-auto p-4 bg-white" ref={printRef}>
              <div id="print-preview-content">
                <PrintContent assignment={assignment} showAnswers={printWithAnswers} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PrintContent({ 
  assignment, 
  showAnswers 
}: { 
  assignment: Assignment
  showAnswers: boolean 
}) {
  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="header">
        <div className="title">{assignment.title}</div>
        {assignment.description && (
          <div className="description">{assignment.description}</div>
        )}
        <div className="meta">
          期限: {format(new Date(assignment.deadline), 'yyyy年M月d日 HH:mm', { locale: ja })}
        </div>
      </div>

      {/* Elements */}
      {assignment.elements.map((element) => (
        <PrintElement 
          key={element.id} 
          element={element} 
          showAnswer={showAnswers} 
        />
      ))}
    </div>
  )
}

function PrintElement({ 
  element, 
  showAnswer 
}: { 
  element: EditorElement
  showAnswer: boolean 
}) {
  switch (element.type) {
    case 'heading':
      return <div className="heading">{element.content}</div>

    case 'text':
      return <div className="text">{element.content}</div>

    case 'question-label':
      return <div className="question-label">{element.content}</div>

    case 'answer-box':
      return (
        <div className="answer-box">
          <span className="answer-label">{element.content}</span>
          {showAnswer ? (
            <span className="answer-text">{element.answer}</span>
          ) : (
            <span className="answer-input" />
          )}
        </div>
      )

    case 'divider':
      return <div className="divider" />

    case 'image':
      if (element.imageUrl) {
        return (
          <div className="image-container">
            <img src={element.imageUrl} alt="" />
          </div>
        )
      }
      return null

    case 'map':
      return (
        <div className="map-placeholder">
          [地図: {element.mapPins?.length || 0}個のピン]
        </div>
      )

    case 'embed':
      if (element.embedHtml) {
        return (
          <div className="embed-content">
            [埋め込みコンテンツ]
          </div>
        )
      }
      return null

    default:
      return null
  }
}

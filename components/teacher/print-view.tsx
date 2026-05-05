'use client'

import { forwardRef } from 'react'
import { EditorElement } from '@/lib/types'

interface PrintViewProps {
  title: string
  description: string
  elements: EditorElement[]
  showAnswers: boolean
  studentName?: string
  studentClass?: string
}

export const PrintView = forwardRef<HTMLDivElement, PrintViewProps>(
  ({ title, description, elements, showAnswers, studentName, studentClass }, ref) => {
    return (
      <div ref={ref} className="print-container bg-white text-black p-8 max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 border-b-2 border-black pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{title || '無題の課題'}</h1>
              {description && (
                <p className="text-sm mt-2 text-gray-600">{description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm">クラス:</span>
                <span className="border-b border-black min-w-[80px] inline-block text-center">
                  {studentClass || '　'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">名前:</span>
                <span className="border-b border-black min-w-[120px] inline-block text-center">
                  {studentName || '　'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="space-y-4">
          {elements.map((element) => (
            <PrintElement
              key={element.id}
              element={element}
              showAnswers={showAnswers}
            />
          ))}
        </div>

        {/* フッター */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          {showAnswers ? '【解答付き】' : ''}
        </div>

        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .print-container {
              padding: 0 !important;
              max-width: none !important;
            }
            
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    )
  }
)

PrintView.displayName = 'PrintView'

function PrintElement({
  element,
  showAnswers
}: {
  element: EditorElement
  showAnswers: boolean
}) {
  switch (element.type) {
    case 'heading':
      return (
        <h2 className="text-xl font-bold mt-6 mb-3">
          {element.content}
        </h2>
      )

    case 'text':
      return (
        <p className="leading-relaxed">
          {element.content}
        </p>
      )

    case 'question-label':
      return (
        <p className="font-medium mt-4">
          {element.content}
        </p>
      )

    case 'answer-box':
      return (
        <div className="flex items-center gap-3 my-2 ml-4">
          <span className="font-medium text-sm border border-black rounded px-2 py-0.5">
            {element.content}
          </span>
          <div className="flex-1 border-b border-black min-h-[24px] relative">
            {showAnswers && element.answer && (
              <span className="absolute left-2 bottom-0 text-red-600 font-medium">
                {element.answer}
              </span>
            )}
          </div>
        </div>
      )

    case 'divider':
      return <hr className="border-t border-gray-400 my-4" />

    case 'image':
      if (element.src) {
        return (
          <div className="my-4">
            <img
              src={element.src}
              alt=""
              className="max-w-full"
              style={{
                width: element.size?.width === 'full' ? '100%' : element.size?.width || 'auto',
                height: element.size?.height === 'auto' ? 'auto' : element.size?.height
              }}
            />
          </div>
        )
      }
      return null

    case 'map':
      // 印刷時は地図のプレースホルダーを表示
      return (
        <div 
          className="my-4 border border-gray-300 flex items-center justify-center bg-gray-100"
          style={{ height: element.size?.height || 200 }}
        >
          <div className="text-center text-gray-500">
            <p className="text-sm">地図</p>
            <p className="text-xs">
              緯度: {element.mapPosition?.lat?.toFixed(4) || '35.6762'}, 
              経度: {element.mapPosition?.lng?.toFixed(4) || '139.6503'}
            </p>
          </div>
        </div>
      )

    case 'embed':
      // 埋め込みコンテンツは印刷時には表示しない
      return (
        <div className="my-4 border border-gray-300 p-4 bg-gray-100 text-center text-gray-500 text-sm">
          [埋め込みコンテンツ - 印刷非対応]
        </div>
      )

    default:
      return null
  }
}

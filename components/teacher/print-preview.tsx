'use client'

import { useRef, forwardRef } from 'react'
import type { EditorElement, Assignment } from '@/lib/types'

interface PrintPreviewProps {
  assignment: Pick<Assignment, 'title' | 'description' | 'elements' | 'deadline'>
  showAnswers: boolean
}

export const PrintPreview = forwardRef<HTMLDivElement, PrintPreviewProps>(
  function PrintPreview({ assignment, showAnswers }, ref) {
    const answerElements = assignment.elements.filter(e => e.type === 'answer-box')

    return (
      <div ref={ref} className="print-preview bg-white text-black p-8 font-sans">
        <style jsx>{`
          @media print {
            .print-preview {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .answer-text {
              color: #dc2626 !important;
            }
            .page-break {
              page-break-before: always;
            }
          }
        `}</style>

        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-sm text-gray-600 mt-2 text-center">{assignment.description}</p>
          )}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <span>名前: ____________________</span>
            <span>クラス: ________</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {assignment.elements.map((element, index) => (
            <PrintElement 
              key={element.id} 
              element={element} 
              showAnswers={showAnswers}
              answerNumber={element.type === 'answer-box' ? answerElements.findIndex(e => e.id === element.id) + 1 : undefined}
            />
          ))}
        </div>

        {/* Answer key section (separate page) */}
        {showAnswers && answerElements.length > 0 && (
          <div className="page-break mt-8 pt-8 border-t-2 border-black">
            <h2 className="text-xl font-bold mb-4">解答</h2>
            <div className="grid grid-cols-2 gap-4">
              {answerElements.map((element, index) => (
                <div key={element.id} className="flex items-center gap-2">
                  <span className="font-medium">{element.content}:</span>
                  <span className="answer-text text-red-600 font-medium">{element.answer}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

function PrintElement({
  element,
  showAnswers,
  answerNumber
}: {
  element: EditorElement
  showAnswers: boolean
  answerNumber?: number
}) {
  switch (element.type) {
    case 'heading':
      return (
        <h2 
          className="text-xl font-bold mt-4"
          style={{ fontSize: element.style?.fontSize }}
        >
          {element.content}
        </h2>
      )

    case 'text':
      return (
        <p 
          className="leading-relaxed"
          style={{ fontSize: element.style?.fontSize }}
        >
          {element.content}
        </p>
      )

    case 'question-label':
      return (
        <p className="font-medium mt-4">{element.content}</p>
      )

    case 'answer-box':
      return (
        <div className="flex items-center gap-2 my-2 pl-4">
          <span className="font-medium">({element.content})</span>
          {showAnswers ? (
            <span className="answer-text text-red-600 font-medium border-b border-red-600 px-2 min-w-[100px]">
              {element.answer}
            </span>
          ) : (
            <span className="border-b border-black min-w-[150px] inline-block">&nbsp;</span>
          )}
        </div>
      )

    case 'divider':
      return <hr className="border-t border-gray-300 my-4" />

    case 'image':
      if (element.imageUrl) {
        return (
          <div className="my-4">
            <img 
              src={element.imageUrl} 
              alt="" 
              className="max-w-full"
              style={{ 
                width: element.style?.width ? `${element.style.width}%` : 'auto'
              }}
            />
          </div>
        )
      }
      return null

    case 'map':
      return (
        <div className="my-4 p-4 border border-gray-300 text-center text-gray-500">
          [地図: {element.mapPins?.length || 0}個のピン]
        </div>
      )

    case 'embed':
      return (
        <div className="my-4 p-4 border border-gray-300 text-center text-gray-500">
          [埋め込みコンテンツ]
        </div>
      )

    default:
      return null
  }
}

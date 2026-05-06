'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCw, Move } from 'lucide-react'

interface ElementTransformControlsProps {
  children: React.ReactNode
  isSelected: boolean
  width?: number
  height?: number
  rotation?: number
  position?: { x: number; y: number }
  layoutMode: 'linear' | 'freeform'
  onResize: (width: number, height: number) => void
  onRotate: (rotation: number) => void
  onPositionChange?: (x: number, y: number) => void
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export function ElementTransformControls({
  children,
  isSelected,
  width = 100,
  height = 100,
  rotation = 0,
  position = { x: 0, y: 0 },
  layoutMode,
  onResize,
  onRotate,
  onPositionChange,
  minWidth = 50,
  minHeight = 30,
  maxWidth = 800,
  maxHeight = 600
}: ElementTransformControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width, height })
  const [startRotation, setStartRotation] = useState(rotation)
  const [startCenter, setStartCenter] = useState({ x: 0, y: 0 })

  // リサイズハンドルの位置
  const handles: { position: ResizeHandle; style: React.CSSProperties; cursor: string }[] = [
    { position: 'n', style: { top: -4, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
    { position: 's', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
    { position: 'e', style: { right: -4, top: '50%', transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
    { position: 'w', style: { left: -4, top: '50%', transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
    { position: 'ne', style: { top: -4, right: -4 }, cursor: 'nesw-resize' },
    { position: 'nw', style: { top: -4, left: -4 }, cursor: 'nwse-resize' },
    { position: 'se', style: { bottom: -4, right: -4 }, cursor: 'nwse-resize' },
    { position: 'sw', style: { bottom: -4, left: -4 }, cursor: 'nesw-resize' }
  ]

  // リサイズ開始
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setActiveHandle(handle)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width, height })
  }, [width, height])

  // 回転開始
  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRotating(true)
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setStartCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }
    setStartRotation(rotation)
  }, [rotation])

  // ドラッグ開始（フリーフォームモード時）
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (layoutMode !== 'freeform' || !onPositionChange) return
    e.preventDefault()
    setIsDragging(true)
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [layoutMode, onPositionChange, position])

  // マウス移動処理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && activeHandle) {
        const deltaX = e.clientX - startPos.x
        const deltaY = e.clientY - startPos.y

        let newWidth = startSize.width
        let newHeight = startSize.height

        // 各ハンドルに応じたリサイズ計算
        switch (activeHandle) {
          case 'e':
            newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width + deltaX))
            break
          case 'w':
            newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width - deltaX))
            break
          case 's':
            newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height + deltaY))
            break
          case 'n':
            newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height - deltaY))
            break
          case 'se':
            newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width + deltaX))
            newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height + deltaY))
            break
          case 'sw':
            newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width - deltaX))
            newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height + deltaY))
            break
          case 'ne':
            newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width + deltaX))
            newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height - deltaY))
            break
          case 'nw':
            newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.width - deltaX))
            newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.height - deltaY))
            break
        }

        onResize(newWidth, newHeight)
      }

      if (isRotating) {
        const angle = Math.atan2(
          e.clientY - startCenter.y,
          e.clientX - startCenter.x
        ) * (180 / Math.PI)
        
        // 90度で丸める（Shiftキー押下時）
        let newRotation = angle + 90
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15
        }
        
        onRotate(newRotation)
      }

      if (isDragging && onPositionChange) {
        const newX = e.clientX - startPos.x
        const newY = e.clientY - startPos.y
        onPositionChange(newX, newY)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setIsRotating(false)
      setIsDragging(false)
      setActiveHandle(null)
    }

    if (isResizing || isRotating || isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isRotating, isDragging, activeHandle, startPos, startSize, startCenter, startRotation, minWidth, minHeight, maxWidth, maxHeight, onResize, onRotate, onPositionChange])

  const containerStyle: React.CSSProperties = layoutMode === 'freeform' ? {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: width,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center'
  } : {
    width: width !== 100 ? width : 'auto',
    minHeight: height !== 100 ? height : 'auto',
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center'
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${isSelected ? 'z-10' : ''}`}
      style={containerStyle}
    >
      {/* メインコンテンツ */}
      <div 
        className={`relative ${layoutMode === 'freeform' && isSelected ? 'cursor-move' : ''}`}
        onMouseDown={handleDragStart}
      >
        {children}
      </div>

      {/* 選択時のコントロール */}
      {isSelected && (
        <>
          {/* 選択境界線 */}
          <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />

          {/* リサイズハンドル */}
          {handles.map(({ position: pos, style, cursor }) => (
            <div
              key={pos}
              className="absolute w-3 h-3 bg-background border-2 border-primary rounded-sm hover:bg-primary hover:border-primary transition-colors"
              style={{ ...style, cursor, zIndex: 20 }}
              onMouseDown={(e) => handleResizeStart(e, pos)}
            />
          ))}

          {/* 回転ハンドル */}
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ zIndex: 20 }}
          >
            <div
              className="w-6 h-6 bg-background border-2 border-primary rounded-full flex items-center justify-center cursor-grab hover:bg-primary hover:text-primary-foreground transition-colors"
              onMouseDown={handleRotateStart}
            >
              <RotateCw className="w-3 h-3" />
            </div>
            <div className="w-px h-4 bg-primary" />
          </div>

          {/* フリーフォームモード時の移動インジケーター */}
          {layoutMode === 'freeform' && (
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <Move className="w-3 h-3" />
            </div>
          )}

          {/* サイズ表示 */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border whitespace-nowrap">
            {Math.round(width)} x {Math.round(height)}px
            {rotation !== 0 && ` / ${Math.round(rotation)}°`}
          </div>
        </>
      )}
    </div>
  )
}

// 高さ自動調整バージョン（テキスト要素向け）
export function ElementResizeWidth({
  children,
  isSelected,
  width = 100,
  rotation = 0,
  onResize,
  onRotate,
  minWidth = 100,
  maxWidth = 800
}: Omit<ElementTransformControlsProps, 'height' | 'position' | 'layoutMode' | 'onPositionChange'> & { width?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(width)
  const [startCenter, setStartCenter] = useState({ x: 0, y: 0 })

  const handleResizeStart = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setStartX(e.clientX)
    setStartWidth(width)
  }, [width])

  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRotating(true)
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setStartCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - startX
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX))
        onResize(newWidth, 0) // height is ignored for width-only resize
      }

      if (isRotating) {
        const angle = Math.atan2(
          e.clientY - startCenter.y,
          e.clientX - startCenter.x
        ) * (180 / Math.PI)
        
        let newRotation = angle + 90
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15
        }
        
        onRotate(newRotation)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setIsRotating(false)
    }

    if (isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isRotating, startX, startWidth, startCenter, minWidth, maxWidth, onResize, onRotate])

  return (
    <div
      ref={containerRef}
      className={`relative ${isSelected ? 'z-10' : ''}`}
      style={{
        width: width,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center'
      }}
    >
      {children}

      {isSelected && (
        <>
          <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />

          {/* 左右のリサイズハンドル */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize group"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-background border-2 border-primary rounded-sm group-hover:bg-primary transition-colors" />
          </div>
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize group"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-background border-2 border-primary rounded-sm group-hover:bg-primary transition-colors" />
          </div>

          {/* 回転ハンドル */}
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ zIndex: 20 }}
          >
            <div
              className="w-6 h-6 bg-background border-2 border-primary rounded-full flex items-center justify-center cursor-grab hover:bg-primary hover:text-primary-foreground transition-colors"
              onMouseDown={handleRotateStart}
            >
              <RotateCw className="w-3 h-3" />
            </div>
            <div className="w-px h-4 bg-primary" />
          </div>

          {/* サイズ表示 */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border whitespace-nowrap">
            {Math.round(width)}px
            {rotation !== 0 && ` / ${Math.round(rotation)}°`}
          </div>
        </>
      )}
    </div>
  )
}

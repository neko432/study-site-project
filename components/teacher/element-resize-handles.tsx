'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'

interface ElementResizeHandlesProps {
  width: number
  height: number
  rotation?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  aspectRatio?: boolean
  onResize: (width: number, height: number) => void
  onRotate?: (rotation: number) => void
  children: React.ReactNode
}

export function ElementResizeHandles({
  width,
  height,
  rotation = 0,
  minWidth = 50,
  minHeight = 30,
  maxWidth = 800,
  maxHeight = 600,
  aspectRatio = false,
  onResize,
  onRotate,
  children
}: ElementResizeHandlesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [activeHandle, setActiveHandle] = useState<string | null>(null)
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const centerRef = useRef({ x: 0, y: 0 })

  const handles = [
    { id: 'nw', cursor: 'nw-resize', position: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' },
    { id: 'n', cursor: 'n-resize', position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
    { id: 'ne', cursor: 'ne-resize', position: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' },
    { id: 'e', cursor: 'e-resize', position: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
    { id: 'se', cursor: 'se-resize', position: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' },
    { id: 's', cursor: 's-resize', position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
    { id: 'sw', cursor: 'sw-resize', position: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' },
    { id: 'w', cursor: 'w-resize', position: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' },
  ]

  const handleResizeStart = useCallback((e: React.MouseEvent, handleId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setActiveHandle(handleId)
    startPos.current = { x: e.clientX, y: e.clientY, width, height }
  }, [width, height])

  const handleRotateStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
    setIsRotating(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && activeHandle) {
        const dx = e.clientX - startPos.current.x
        const dy = e.clientY - startPos.current.y

        let newWidth = startPos.current.width
        let newHeight = startPos.current.height

        if (activeHandle.includes('e')) newWidth = startPos.current.width + dx
        if (activeHandle.includes('w')) newWidth = startPos.current.width - dx
        if (activeHandle.includes('s')) newHeight = startPos.current.height + dy
        if (activeHandle.includes('n')) newHeight = startPos.current.height - dy

        // Constrain to bounds
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

        // Maintain aspect ratio if shift is held or aspectRatio prop is true
        if (aspectRatio || e.shiftKey) {
          const originalRatio = startPos.current.width / startPos.current.height
          if (activeHandle.includes('e') || activeHandle.includes('w')) {
            newHeight = newWidth / originalRatio
          } else {
            newWidth = newHeight * originalRatio
          }
        }

        onResize(newWidth, newHeight)
      }

      if (isRotating && onRotate) {
        const angle = Math.atan2(
          e.clientY - centerRef.current.y,
          e.clientX - centerRef.current.x
        ) * (180 / Math.PI) + 90
        onRotate(Math.round(angle / 5) * 5) // Snap to 5-degree increments
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setIsRotating(false)
      setActiveHandle(null)
    }

    if (isResizing || isRotating) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isRotating, activeHandle, minWidth, minHeight, maxWidth, maxHeight, aspectRatio, onResize, onRotate])

  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center'
      }}
    >
      {/* Content */}
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>

      {/* Selection border */}
      <div className="absolute inset-0 border-2 border-primary pointer-events-none rounded-sm" />

      {/* Resize handles */}
      {handles.map((handle) => (
        <motion.div
          key={handle.id}
          className={`absolute ${handle.position} w-3 h-3 bg-primary border-2 border-primary-foreground rounded-full cursor-${handle.cursor} hover:scale-125 transition-transform z-10`}
          onMouseDown={(e) => handleResizeStart(e, handle.id)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        />
      ))}

      {/* Rotation handle */}
      {onRotate && (
        <motion.div
          className="absolute left-1/2 -top-10 -translate-x-1/2 cursor-grab active:cursor-grabbing z-10"
          onMouseDown={handleRotateStart}
          whileHover={{ scale: 1.1 }}
        >
          <div className="w-px h-6 bg-primary mx-auto" />
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <RotateCw className="w-3 h-3" />
          </div>
        </motion.div>
      )}

      {/* Size indicator */}
      {(isResizing || isRotating) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -bottom-8 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap z-20"
        >
          {isRotating ? `${rotation}deg` : `${Math.round(width)} x ${Math.round(height)}`}
        </motion.div>
      )}
    </div>
  )
}

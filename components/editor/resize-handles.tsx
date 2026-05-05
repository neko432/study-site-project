'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCw } from 'lucide-react'

interface ResizeHandlesProps {
  width: number
  height: number
  rotation?: number
  onResize: (width: number, height: number) => void
  onRotate?: (rotation: number) => void
  aspectRatio?: number // set to lock aspect ratio
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export function ResizeHandles({
  width,
  height,
  rotation = 0,
  onResize,
  onRotate,
  aspectRatio,
  minWidth = 50,
  minHeight = 50,
  maxWidth = 1000,
  maxHeight = 1000
}: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0, rotation: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: HandlePosition) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setActiveHandle(handle)
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      width,
      height,
      rotation
    }
  }, [width, height, rotation])

  const handleRotateMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onRotate) return
    
    setIsRotating(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      startPosRef.current = {
        x: centerX,
        y: centerY,
        width,
        height,
        rotation
      }
    }
  }, [onRotate, width, height, rotation])

  useEffect(() => {
    if (!isResizing && !isRotating) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isRotating && onRotate) {
        const centerX = startPosRef.current.x
        const centerY = startPosRef.current.y
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
        const degrees = (angle * 180) / Math.PI + 90
        onRotate(Math.round(degrees))
        return
      }

      if (!isResizing || !activeHandle) return

      const deltaX = e.clientX - startPosRef.current.x
      const deltaY = e.clientY - startPosRef.current.y
      let newWidth = startPosRef.current.width
      let newHeight = startPosRef.current.height

      // Calculate new dimensions based on handle position
      switch (activeHandle) {
        case 'e':
          newWidth = startPosRef.current.width + deltaX
          break
        case 'w':
          newWidth = startPosRef.current.width - deltaX
          break
        case 's':
          newHeight = startPosRef.current.height + deltaY
          break
        case 'n':
          newHeight = startPosRef.current.height - deltaY
          break
        case 'se':
          newWidth = startPosRef.current.width + deltaX
          newHeight = startPosRef.current.height + deltaY
          break
        case 'sw':
          newWidth = startPosRef.current.width - deltaX
          newHeight = startPosRef.current.height + deltaY
          break
        case 'ne':
          newWidth = startPosRef.current.width + deltaX
          newHeight = startPosRef.current.height - deltaY
          break
        case 'nw':
          newWidth = startPosRef.current.width - deltaX
          newHeight = startPosRef.current.height - deltaY
          break
      }

      // Apply aspect ratio lock
      if (aspectRatio) {
        if (['e', 'w'].includes(activeHandle)) {
          newHeight = newWidth / aspectRatio
        } else if (['n', 's'].includes(activeHandle)) {
          newWidth = newHeight * aspectRatio
        } else {
          // Corner handles - maintain aspect ratio based on dominant axis
          const widthRatio = newWidth / startPosRef.current.width
          const heightRatio = newHeight / startPosRef.current.height
          if (Math.abs(widthRatio - 1) > Math.abs(heightRatio - 1)) {
            newHeight = newWidth / aspectRatio
          } else {
            newWidth = newHeight * aspectRatio
          }
        }
      }

      // Clamp values
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

      onResize(Math.round(newWidth), Math.round(newHeight))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setIsRotating(false)
      setActiveHandle(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isRotating, activeHandle, aspectRatio, minWidth, minHeight, maxWidth, maxHeight, onResize, onRotate])

  const handleStyle = "absolute w-3 h-3 bg-white border-2 border-primary rounded-sm shadow-sm hover:scale-125 transition-transform cursor-pointer z-10"
  
  const handles: { position: HandlePosition; className: string; cursor: string }[] = [
    { position: 'nw', className: '-top-1.5 -left-1.5', cursor: 'nwse-resize' },
    { position: 'n', className: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
    { position: 'ne', className: '-top-1.5 -right-1.5', cursor: 'nesw-resize' },
    { position: 'e', className: 'top-1/2 -right-1.5 -translate-y-1/2', cursor: 'ew-resize' },
    { position: 'se', className: '-bottom-1.5 -right-1.5', cursor: 'nwse-resize' },
    { position: 's', className: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
    { position: 'sw', className: '-bottom-1.5 -left-1.5', cursor: 'nesw-resize' },
    { position: 'w', className: 'top-1/2 -left-1.5 -translate-y-1/2', cursor: 'ew-resize' },
  ]

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Selection border */}
      <div className="absolute inset-0 border-2 border-primary border-dashed rounded-lg" />
      
      {/* Resize handles */}
      {handles.map(({ position, className, cursor }) => (
        <motion.div
          key={position}
          className={`${handleStyle} ${className} pointer-events-auto`}
          style={{ cursor }}
          onMouseDown={(e) => handleMouseDown(e, position)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
        />
      ))}
      
      {/* Rotation handle */}
      {onRotate && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-primary rounded-full shadow-sm flex items-center justify-center cursor-grab pointer-events-auto"
          onMouseDown={handleRotateMouseDown}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95, cursor: 'grabbing' }}
        >
          <RotateCw className="w-3 h-3 text-primary" />
        </motion.div>
      )}
      
      {/* Rotation line */}
      {onRotate && (
        <div className="absolute -top-6 left-1/2 w-0.5 h-4 bg-primary -translate-x-1/2" />
      )}
      
      {/* Size indicator */}
      {(isResizing || isRotating) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none"
        >
          {isRotating ? `${rotation}°` : `${width} × ${height}`}
        </motion.div>
      )}
    </div>
  )
}

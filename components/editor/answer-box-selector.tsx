'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileQuestion, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KATAKANA_MARKERS } from '@/lib/types'

interface AnswerBoxSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usedLabels: string[]
  onAdd: (labels: string[]) => void
}

// 問題番号のプリセット
const QUESTION_NUMBER_PRESETS = [
  { label: '問1', prefix: '問' },
  { label: '(1)', prefix: '(' },
  { label: 'Q1', prefix: 'Q' },
  { label: '第1問', prefix: '第' },
]

export function AnswerBoxSelector({ open, onOpenChange, usedLabels, onAdd }: AnswerBoxSelectorProps) {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [customLabel, setCustomLabel] = useState('')
  const [mode, setMode] = useState<'katakana' | 'number' | 'custom'>('katakana')
  const [numberPrefix, setNumberPrefix] = useState('(')

  const handleToggleLabel = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  const handleAddCustom = () => {
    if (customLabel.trim() && !selectedLabels.includes(customLabel.trim())) {
      setSelectedLabels(prev => [...prev, customLabel.trim()])
      setCustomLabel('')
    }
  }

  const handleConfirm = () => {
    if (selectedLabels.length > 0) {
      onAdd(selectedLabels)
      setSelectedLabels([])
      onOpenChange(false)
    }
  }

  const generateNumberLabels = (prefix: string, count: number = 10) => {
    return Array.from({ length: count }, (_, i) => {
      const num = i + 1
      switch (prefix) {
        case '(':
          return `(${num})`
        case '問':
          return `問${num}`
        case 'Q':
          return `Q${num}`
        case '第':
          return `第${num}問`
        default:
          return `${num}`
      }
    })
  }

  const numberLabels = generateNumberLabels(numberPrefix)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5" />
            解答欄の追加
          </DialogTitle>
          <DialogDescription>
            追加する解答欄のラベルを選択してください。複数選択できます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* モード切替 */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'katakana' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('katakana')}
            >
              カタカナ (ア, イ, ウ...)
            </Button>
            <Button
              variant={mode === 'number' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('number')}
            >
              番号 ((1), (2)...)
            </Button>
            <Button
              variant={mode === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('custom')}
            >
              カスタム
            </Button>
          </div>

          {/* カタカナモード */}
          {mode === 'katakana' && (
            <ScrollArea className="h-[200px] rounded-lg border p-4">
              <div className="grid grid-cols-10 gap-2">
                {KATAKANA_MARKERS.map((marker) => {
                  const isUsed = usedLabels.includes(marker)
                  const isSelected = selectedLabels.includes(marker)
                  
                  return (
                    <motion.button
                      key={marker}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => !isUsed && handleToggleLabel(marker)}
                      disabled={isUsed}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium transition-colors
                        ${isUsed 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                          : isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 hover:bg-muted'
                        }
                      `}
                    >
                      {isSelected && !isUsed ? <Check className="w-4 h-4" /> : marker}
                    </motion.button>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {/* 番号モード */}
          {mode === 'number' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {QUESTION_NUMBER_PRESETS.map((preset) => (
                  <Button
                    key={preset.prefix}
                    variant={numberPrefix === preset.prefix ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNumberPrefix(preset.prefix)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <ScrollArea className="h-[150px] rounded-lg border p-4">
                <div className="grid grid-cols-5 gap-2">
                  {numberLabels.map((label) => {
                    const isUsed = usedLabels.includes(label)
                    const isSelected = selectedLabels.includes(label)
                    
                    return (
                      <motion.button
                        key={label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !isUsed && handleToggleLabel(label)}
                        disabled={isUsed}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isUsed 
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                            : isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 hover:bg-muted'
                          }
                        `}
                      >
                        {isSelected && !isUsed ? <Check className="w-4 h-4 mx-auto" /> : label}
                      </motion.button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* カスタムモード */}
          {mode === 'custom' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="カスタムラベルを入力..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
                <Button onClick={handleAddCustom} disabled={!customLabel.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                例: A, B, C / 甲, 乙, 丙 / X, Y, Z など自由に設定できます
              </p>
            </div>
          )}

          {/* 選択中のラベル */}
          {selectedLabels.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/30 border">
              <Label className="text-sm text-muted-foreground mb-2 block">
                選択中 ({selectedLabels.length}個)
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedLabels.map((label) => (
                  <Badge
                    key={label}
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => handleToggleLabel(label)}
                  >
                    {label}
                    <span className="ml-1 opacity-50">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} disabled={selectedLabels.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            {selectedLabels.length}個追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

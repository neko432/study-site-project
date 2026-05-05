'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { KATAKANA_MARKERS, type KatakanaMarker } from '@/lib/types'

interface KatakanaPickerProps {
  value?: KatakanaMarker
  onChange: (value: KatakanaMarker) => void
  trigger?: React.ReactNode
}

// カタカナをグループ化
const KATAKANA_GROUPS = {
  'ア行': ['ア', 'イ', 'ウ', 'エ', 'オ'],
  'カ行': ['カ', 'キ', 'ク', 'ケ', 'コ'],
  'サ行': ['サ', 'シ', 'ス', 'セ', 'ソ'],
  'タ行': ['タ', 'チ', 'ツ', 'テ', 'ト'],
  'ナ行': ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  'ハ行': ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  'マ行': ['マ', 'ミ', 'ム', 'メ', 'モ'],
  'ヤ行': ['ヤ', 'ユ', 'ヨ'],
  'ラ行': ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  'ワ行': ['ワ', 'ヲ', 'ン'],
} as const

export function KatakanaPicker({ value, onChange, trigger }: KatakanaPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (katakana: KatakanaMarker) => {
    onChange(katakana)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start">
            {value || 'カタカナを選択'}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            カタカナ記号を選択
          </p>
          <div className="space-y-2">
            {Object.entries(KATAKANA_GROUPS).map(([group, katakanas]) => (
              <div key={group} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8 shrink-0">
                  {group}
                </span>
                <div className="flex flex-wrap gap-1">
                  {katakanas.map((k) => (
                    <button
                      key={k}
                      onClick={() => handleSelect(k as KatakanaMarker)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        value === k
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// インライングリッド表示用
interface KatakanaGridProps {
  selectedValue?: KatakanaMarker
  onSelect: (value: KatakanaMarker) => void
  compact?: boolean
}

export function KatakanaGrid({ selectedValue, onSelect, compact = false }: KatakanaGridProps) {
  const buttonSize = compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
  
  return (
    <div className="space-y-2">
      {Object.entries(KATAKANA_GROUPS).map(([group, katakanas]) => (
        <div key={group} className="flex items-center gap-2">
          {!compact && (
            <span className="text-xs text-muted-foreground w-8 shrink-0">
              {group}
            </span>
          )}
          <div className="flex flex-wrap gap-1">
            {katakanas.map((k) => (
              <button
                key={k}
                onClick={() => onSelect(k as KatakanaMarker)}
                className={`${buttonSize} rounded font-medium transition-colors ${
                  selectedValue === k
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 全カタカナをフラット表示
export function KatakanaFlatGrid({ selectedValue, onSelect }: KatakanaGridProps) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {KATAKANA_MARKERS.map((k) => (
        <button
          key={k}
          onClick={() => onSelect(k as KatakanaMarker)}
          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
            selectedValue === k
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  )
}

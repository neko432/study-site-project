'use client'

import { useState, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { Code, Eye, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EmbedEditorProps {
  initialHtml?: string
  onSave: (html: string) => void
  onCancel: () => void
}

export function EmbedEditor({ initialHtml, onSave, onCancel }: EmbedEditorProps) {
  const [html, setHtml] = useState(initialHtml || '')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  // HTMLをサニタイズ
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'span', 'br', 'hr',
        'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'img',
        'blockquote', 'code', 'pre',
        'sup', 'sub',
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'target', 'rel',
        'class', 'style',
        'width', 'height',
        'colspan', 'rowspan',
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
    })
  }, [html])

  const handleSave = () => {
    onSave(sanitizedHtml)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          セキュリティのため、スクリプトや危険なタグは自動的に除去されます。
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            プレビュー
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="mt-4">
          <div className="space-y-2">
            <Label>HTMLコード</Label>
            <Textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="<div>HTMLコードを入力...</div>"
              className="font-mono text-sm min-h-[300px]"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <div className="space-y-2">
            <Label>プレビュー</Label>
            <div 
              className="min-h-[300px] p-4 border border-border rounded-lg bg-card prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  )
}

// 表示専用コンポーネント
interface EmbedViewerProps {
  html: string
  className?: string
}

export function EmbedViewer({ html, className }: EmbedViewerProps) {
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'span', 'br', 'hr',
        'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'img',
        'blockquote', 'code', 'pre',
        'sup', 'sub',
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'target', 'rel',
        'class', 'style',
        'width', 'height',
        'colspan', 'rowspan',
      ],
    })
  }, [html])

  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

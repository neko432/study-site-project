'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Code, Play, AlertTriangle, Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

interface SafeEmbedProps {
  html: string
  onHtmlChange?: (html: string) => void
  mode: 'edit' | 'view'
  height?: number
}

// 許可するタグのホワイトリスト
const ALLOWED_TAGS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'img', 'br', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'form', 'input', 'button', 'select', 'option', 'textarea', 'label',
  'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'style', 'script'
]

export function SafeEmbed({ html, onHtmlChange, mode, height = 400 }: SafeEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [editedHtml, setEditedHtml] = useState(html)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // HTMLをiframeに安全に注入
  const injectHtml = (htmlContent: string) => {
    if (!iframeRef.current) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    // 基本的なスタイルとスクリプト環境を設定
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 16px;
              font-family: system-ui, -apple-system, sans-serif;
              background: #fff;
            }
            canvas {
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `

    try {
      doc.open()
      doc.write(fullHtml)
      doc.close()
      setError(null)
    } catch (e) {
      setError('HTMLの読み込みに失敗しました')
      console.error('Error injecting HTML:', e)
    }
  }

  useEffect(() => {
    if (html) {
      injectHtml(html)
    }
  }, [html])

  const handleRefresh = () => {
    if (html) {
      injectHtml(html)
    }
  }

  const handleSaveCode = () => {
    if (onHtmlChange) {
      onHtmlChange(editedHtml)
    }
    setShowCodeDialog(false)
    setTimeout(() => injectHtml(editedHtml), 100)
  }

  // エディットモード
  if (mode === 'edit' && !html) {
    return (
      <div className="space-y-4">
        <div 
          className="flex flex-col items-center justify-center h-48 bg-muted rounded-xl border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
          onClick={() => setShowCodeDialog(true)}
        >
          <Code className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">クリックしてHTMLを入力</p>
          <p className="text-xs text-muted-foreground mt-1">
            JavaScript付きのインタラクティブなコンテンツを作成できます
          </p>
        </div>

        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                HTML埋め込みコード
              </DialogTitle>
              <DialogDescription>
                HTML、CSS、JavaScriptを入力してインタラクティブなコンテンツを作成できます
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">HTML</Badge>
                <Badge variant="outline">CSS</Badge>
                <Badge variant="outline">JavaScript</Badge>
                <Badge variant="secondary" className="ml-auto">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  サンドボックス内で実行
                </Badge>
              </div>

              <Textarea
                value={editedHtml}
                onChange={(e) => setEditedHtml(e.target.value)}
                placeholder={`<!-- HTMLを入力 -->
<div id="game-container">
  <canvas id="canvas" width="400" height="300"></canvas>
</div>

<style>
  #game-container {
    text-align: center;
  }
</style>

<script>
  // JavaScriptコードを入力
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  // ゲームロジックなど...
</script>`}
                className="min-h-[300px] font-mono text-sm"
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSaveCode}>
                  <Play className="w-4 h-4 mr-2" />
                  保存してプレビュー
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // 表示/プレビューモード
  return (
    <div className="space-y-2">
      {/* コントロールバー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Code className="w-3 h-3" />
            HTML埋め込み
          </Badge>
          {error && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="再読み込み">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {mode === 'edit' && (
            <Button variant="ghost" size="icon" onClick={() => setShowCodeDialog(true)} title="コードを編集">
              <Code className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? '縮小' : '拡大'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* iframe コンテナ */}
      <motion.div
        animate={{ height: isFullscreen ? 600 : height }}
        className="relative rounded-xl overflow-hidden border bg-white"
      >
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Embedded Content"
        />
      </motion.div>

      {/* コード編集ダイアログ */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              HTML埋め込みコード
            </DialogTitle>
          </DialogHeader>

          <Textarea
            value={editedHtml}
            onChange={(e) => setEditedHtml(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveCode}>
              <Play className="w-4 h-4 mr-2" />
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// サンプルコード: テトリス
export const SAMPLE_TETRIS_CODE = `
<div style="text-align: center;">
  <h3 style="margin-bottom: 10px;">テトリス</h3>
  <canvas id="tetris" width="200" height="400" style="border: 2px solid #333; background: #000;"></canvas>
  <p style="margin-top: 10px; font-size: 12px;">矢印キーで操作</p>
</div>

<script>
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

const SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[1,1,1],[0,1,0]],
  [[1,1,1],[1,0,0]],
  [[1,1,1],[0,0,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]]
];

const COLORS = ['#00f0f0','#f0f000','#a000f0','#f0a000','#0000f0','#00f000','#f00000'];

let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
let current, currentX, currentY, currentShape;

function newPiece() {
  const idx = Math.floor(Math.random() * SHAPES.length);
  current = { shape: SHAPES[idx], color: COLORS[idx] };
  currentX = Math.floor(COLS/2) - 1;
  currentY = 0;
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  for(let y = 0; y < ROWS; y++) {
    for(let x = 0; x < COLS; x++) {
      if(board[y][x]) {
        ctx.fillStyle = board[y][x];
        ctx.fillRect(x*BLOCK_SIZE, y*BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
      }
    }
  }
  
  if(current) {
    ctx.fillStyle = current.color;
    current.shape.forEach((row, dy) => {
      row.forEach((val, dx) => {
        if(val) {
          ctx.fillRect((currentX+dx)*BLOCK_SIZE, (currentY+dy)*BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
        }
      });
    });
  }
}

function valid(nx, ny, shape) {
  return shape.every((row, dy) => row.every((val, dx) => {
    const x = nx + dx, y = ny + dy;
    return !val || (x >= 0 && x < COLS && y < ROWS && !board[y]?.[x]);
  }));
}

function merge() {
  current.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if(val) board[currentY+dy][currentX+dx] = current.color;
    });
  });
  
  board = board.filter(row => row.some(cell => !cell));
  while(board.length < ROWS) board.unshift(Array(COLS).fill(0));
}

function drop() {
  if(valid(currentX, currentY+1, current.shape)) {
    currentY++;
  } else {
    merge();
    newPiece();
    if(!valid(currentX, currentY, current.shape)) {
      board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    }
  }
  draw();
}

document.addEventListener('keydown', e => {
  if(e.key === 'ArrowLeft' && valid(currentX-1, currentY, current.shape)) currentX--;
  if(e.key === 'ArrowRight' && valid(currentX+1, currentY, current.shape)) currentX++;
  if(e.key === 'ArrowDown') drop();
  if(e.key === 'ArrowUp') {
    const rotated = current.shape[0].map((_, i) => current.shape.map(row => row[i]).reverse());
    if(valid(currentX, currentY, rotated)) current.shape = rotated;
  }
  draw();
});

newPiece();
setInterval(drop, 500);
</script>
`

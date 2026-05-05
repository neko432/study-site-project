// 学習サイトの型定義

export type UserRole = 'teacher' | 'student' | null

export type StudentClass = '1' | '2'

// エディター要素の種類
export type ElementType = 
  | 'text'
  | 'heading'
  | 'answer-box'
  | 'image'
  | 'table-of-contents'
  | 'map'
  | 'katakana-marker'
  | 'divider'
  | 'question-label'
  | 'embed'

// 地図のピンデータ
export interface MapPin {
  lat: number
  lng: number
  label?: string
}

// 地図データ
export interface MapData {
  center: [number, number]
  zoom: number
  pins: MapPin[]
}

// 要素サイズ
export interface ElementSize {
  width?: number | 'auto'
  height?: number | 'auto'
  scale?: number // 1.0 = 100%
}

// エディター要素
export interface EditorElement {
  id: string
  type: ElementType
  content: string
  answer?: string
  importantPoint?: string
  style?: {
    fontSize?: string
    fontWeight?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
  }
  position?: {
    x: number
    y: number
  }
  // 新しいプロパティ
  size?: ElementSize
  mapData?: MapData
  embedHtml?: string
  imageData?: string // base64 encoded image
  katakanaSymbol?: KatakanaMarker
  questionNumber?: {
    format: 'parentheses' | 'dot' | 'mon' | 'bracket'
    number: number
  }
  answerLabel?: {
    format: 'default' | 'alphabet' | 'number' | 'custom'
    label: string
  }
}

// 課題テンプレート
export interface AssignmentTemplate {
  id: string
  name: string
  description: string
  elements: EditorElement[]
  createdAt: Date
  updatedAt: Date
}

// 課題
export interface Assignment {
  id: string
  title: string
  description: string
  elements: EditorElement[]
  deadline: Date
  deadlineTime?: { // 時間設定追加
    hour: number
    minute: number
  }
  publishedAt?: Date
  scheduledAt?: Date
  status: 'draft' | 'scheduled' | 'published'
  createdAt: Date
  updatedAt: Date
}

// 生徒の回答
export interface StudentSubmission {
  id: string
  assignmentId: string
  studentId: string
  studentName: string
  studentClass: StudentClass
  answers: Record<string, string> // elementId -> answer
  submittedAt: Date
  history: {
    answers: Record<string, string>
    submittedAt: Date
  }[]
  status: 'in-progress' | 'submitted'
}

// 生徒の進捗（ローカル保存用）
export interface StudentProgress {
  assignmentId: string
  answers: Record<string, string>
  lastUpdated: Date
}

// AI採点結果
export interface GradingResult {
  isCorrect: boolean
  confidence: number
  feedback?: string
}

// カタカナマーカーの種類（ア〜ン全て）
export const KATAKANA_MARKERS = [
  'ア', 'イ', 'ウ', 'エ', 'オ',
  'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ',
  'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ',
  'ヤ', 'ユ', 'ヨ',
  'ラ', 'リ', 'ル', 'レ', 'ロ',
  'ワ', 'ヲ', 'ン'
] as const

export type KatakanaMarker = typeof KATAKANA_MARKERS[number]

// Undo/Redo用の履歴状態
export interface UndoRedoState<T> {
  past: T[]
  present: T
  future: T[]
}

// 問題番号フォーマット
export const QUESTION_NUMBER_FORMATS = {
  parentheses: (n: number) => `(${n})`,
  dot: (n: number) => `${n}.`,
  mon: (n: number) => `問${n}`,
  bracket: (n: number) => `[${n}]`,
} as const

// 解答欄ラベルフォーマット
export const ANSWER_LABEL_FORMATS = {
  default: '答え',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  number: '123456789',
  custom: '',
} as const

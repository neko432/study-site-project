// 学習サイトの型定義

export type UserRole = 'teacher' | 'student' | null

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
  answers: Record<string, string> // elementId -> answer
  submittedAt: Date
  history: {
    answers: Record<string, string>
    submittedAt: Date
  }[]
  status: 'in-progress' | 'submitted'
}

// カタカナマーカーの種類
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

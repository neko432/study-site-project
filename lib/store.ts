'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  UserRole, 
  Assignment, 
  AssignmentTemplate, 
  StudentSubmission, 
  EditorElement,
  StudentClass
} from './types'

// Undo/Redo用の履歴管理
interface EditorHistory {
  past: EditorElement[][]
  present: EditorElement[]
  future: EditorElement[][]
}

interface AppState {
  // 認証関連
  role: UserRole
  isAuthenticated: boolean
  keepLoggedIn: boolean
  
  // 生徒情報
  studentName: string
  studentClass: StudentClass
  
  // 先生用
  assignments: Assignment[]
  templates: AssignmentTemplate[]
  currentEditor: EditorElement[]
  
  // Undo/Redo用履歴
  editorHistory: EditorHistory
  
  // 生徒用
  submissions: StudentSubmission[]
  currentStudentId: string
  
  // 進捗保存
  savedProgress: Record<string, Record<string, string>> // assignmentId -> answers
  
  // アクション
  setRole: (role: UserRole) => void
  setAuthenticated: (auth: boolean) => void
  setKeepLoggedIn: (keep: boolean) => void
  logout: () => void
  
  // 生徒情報
  setStudentName: (name: string) => void
  setStudentClass: (cls: StudentClass) => void
  
  // 課題管理
  addAssignment: (assignment: Assignment) => void
  updateAssignment: (id: string, assignment: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  
  // テンプレート管理
  addTemplate: (template: AssignmentTemplate) => void
  deleteTemplate: (id: string) => void
  
  // エディター（Undo/Redo対応）
  setCurrentEditor: (elements: EditorElement[]) => void
  addElement: (element: EditorElement) => void
  updateElement: (id: string, element: Partial<EditorElement>) => void
  deleteElement: (id: string) => void
  reorderElements: (elements: EditorElement[]) => void
  
  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // 進捗保存
  saveProgress: (assignmentId: string, answers: Record<string, string>) => void
  getProgress: (assignmentId: string) => Record<string, string> | null
  clearProgress: (assignmentId: string) => void
  
  // 提出管理
  addSubmission: (submission: StudentSubmission) => void
  updateSubmission: (id: string, submission: Partial<StudentSubmission>) => void
}

// サンプル課題データ
const sampleAssignments: Assignment[] = [
  {
    id: 'sample-1',
    title: '第5章・4節 列強との戦い - 日露戦争とその影響',
    description: '日露戦争について、教科書p.192~p.193を参考に空欄を埋めましょう。',
    elements: [
      {
        id: 'q1',
        type: 'heading',
        content: '学習課題',
        style: { fontSize: '1.5rem', fontWeight: 'bold' }
      },
      {
        id: 'q2',
        type: 'text',
        content: '日露戦争は、なぜ起こり、国内や国際社会にどのような影響を与えたのでしょうか。'
      },
      {
        id: 'q3',
        type: 'question-label',
        content: '(1) 次の文章のア～カの空らんに，「ロシア」または「韓国」の国名を入れ，文章を完成させよう。'
      },
      {
        id: 'q4',
        type: 'text',
        content: '満州を占領したロシアは，清との条約による撤兵の期限が来ても応じず，韓国にも軍事施設をつくり始めた。危機感を強めた日本政府は，外交により，満州での（　ア　）の権益を認めるかわりに，（　イ　）に対する日本の支配権を認めさせようとした。'
      },
      {
        id: 'a1',
        type: 'answer-box',
        content: 'ア',
        answer: 'ロシア',
        importantPoint: '満州はロシアの勢力範囲'
      },
      {
        id: 'a2',
        type: 'answer-box',
        content: 'イ',
        answer: '韓国',
        importantPoint: '日本は韓国の支配権を求めていた'
      },
      {
        id: 'q5',
        type: 'question-label',
        content: '(2) 日露戦争に対してキリスト教徒の内村鑑三や社会主義者の幸徳秋水が唱えた主張を何というか,答えよう。'
      },
      {
        id: 'a3',
        type: 'answer-box',
        content: '答え',
        answer: '非戦論',
        importantPoint: '戦争反対の立場を表明'
      },
      {
        id: 'q6',
        type: 'question-label',
        content: '(3) 日露戦争に出兵した弟の身を案じ「君死にたまふことなかれ」という詩をよんだ人物の名前を答えよう。'
      },
      {
        id: 'a4',
        type: 'answer-box',
        content: '答え',
        answer: '与謝野晶子',
        importantPoint: '明星派の歌人、反戦詩で有名'
      },
      {
        id: 'q7',
        type: 'question-label',
        content: '(4) 次の文章のア，イの空らんに当てはまる言葉は何か，答えよう。'
      },
      {
        id: 'q8',
        type: 'text',
        content: '日露戦争で日本軍は，ロシア軍を破って旅順や奉天を占領し，また，（　ア　）の率いる日本艦隊が，日本海海戦でロシア艦隊に勝利するなど，戦いを有利に進めた。'
      },
      {
        id: 'a5',
        type: 'answer-box',
        content: 'ア',
        answer: '東郷平八郎',
        importantPoint: '連合艦隊司令長官'
      },
      {
        id: 'q9',
        type: 'text',
        content: '1905年，アメリカ大統領の仲立ちで講和会議が開かれ，（　イ　）が結ばれた。'
      },
      {
        id: 'a6',
        type: 'answer-box',
        content: 'イ',
        answer: 'ポーツマス条約',
        importantPoint: '賠償金なし、南樺太獲得'
      }
    ],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    deadlineTime: { hour: 23, minute: 59 },
    publishedAt: new Date(),
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const initialEditorHistory: EditorHistory = {
  past: [],
  present: [],
  future: []
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初期状態
      role: null,
      isAuthenticated: false,
      keepLoggedIn: false,
      studentName: '',
      studentClass: '1',
      assignments: sampleAssignments,
      templates: [],
      currentEditor: [],
      editorHistory: initialEditorHistory,
      submissions: [],
      currentStudentId: 'student-1',
      savedProgress: {},
      
      // 認証アクション
      setRole: (role) => set({ role }),
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),
      setKeepLoggedIn: (keep) => set({ keepLoggedIn: keep }),
      logout: () => set({ role: null, isAuthenticated: false }),
      
      // 生徒情報
      setStudentName: (name) => set({ studentName: name }),
      setStudentClass: (cls) => set({ studentClass: cls }),
      
      // 課題管理
      addAssignment: (assignment) => 
        set((state) => ({ assignments: [...state.assignments, assignment] })),
      updateAssignment: (id, updates) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
          )
        })),
      deleteAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id)
        })),
      
      // テンプレート管理
      addTemplate: (template) =>
        set((state) => ({ templates: [...state.templates, template] })),
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id)
        })),
      
      // エディター（履歴付き）
      setCurrentEditor: (elements) => set({ 
        currentEditor: elements,
        editorHistory: {
          past: [],
          present: elements,
          future: []
        }
      }),
      
      addElement: (element) =>
        set((state) => {
          const newElements = [...state.currentEditor, element]
          return {
            currentEditor: newElements,
            editorHistory: {
              past: [...state.editorHistory.past, state.editorHistory.present],
              present: newElements,
              future: []
            }
          }
        }),
        
      updateElement: (id, updates) =>
        set((state) => {
          const newElements = state.currentEditor.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          )
          return {
            currentEditor: newElements,
            editorHistory: {
              past: [...state.editorHistory.past, state.editorHistory.present],
              present: newElements,
              future: []
            }
          }
        }),
        
      deleteElement: (id) =>
        set((state) => {
          const newElements = state.currentEditor.filter((e) => e.id !== id)
          return {
            currentEditor: newElements,
            editorHistory: {
              past: [...state.editorHistory.past, state.editorHistory.present],
              present: newElements,
              future: []
            }
          }
        }),
        
      reorderElements: (elements) =>
        set((state) => ({
          currentEditor: elements,
          editorHistory: {
            past: [...state.editorHistory.past, state.editorHistory.present],
            present: elements,
            future: []
          }
        })),
      
      // Undo/Redo
      undo: () => set((state) => {
        if (state.editorHistory.past.length === 0) return state
        const previous = state.editorHistory.past[state.editorHistory.past.length - 1]
        const newPast = state.editorHistory.past.slice(0, -1)
        return {
          currentEditor: previous,
          editorHistory: {
            past: newPast,
            present: previous,
            future: [state.editorHistory.present, ...state.editorHistory.future]
          }
        }
      }),
      
      redo: () => set((state) => {
        if (state.editorHistory.future.length === 0) return state
        const next = state.editorHistory.future[0]
        const newFuture = state.editorHistory.future.slice(1)
        return {
          currentEditor: next,
          editorHistory: {
            past: [...state.editorHistory.past, state.editorHistory.present],
            present: next,
            future: newFuture
          }
        }
      }),
      
      canUndo: () => get().editorHistory.past.length > 0,
      canRedo: () => get().editorHistory.future.length > 0,
      
      // 進捗保存
      saveProgress: (assignmentId, answers) =>
        set((state) => ({
          savedProgress: {
            ...state.savedProgress,
            [assignmentId]: answers
          }
        })),
        
      getProgress: (assignmentId) => get().savedProgress[assignmentId] || null,
      
      clearProgress: (assignmentId) =>
        set((state) => {
          const { [assignmentId]: _, ...rest } = state.savedProgress
          return { savedProgress: rest }
        }),
      
      // 提出管理
      addSubmission: (submission) =>
        set((state) => ({ submissions: [...state.submissions, submission] })),
      updateSubmission: (id, updates) =>
        set((state) => ({
          submissions: state.submissions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          )
        }))
    }),
    {
      name: 'learning-site-storage',
      partialize: (state) => 
        state.keepLoggedIn 
          ? { 
              role: state.role, 
              isAuthenticated: state.isAuthenticated,
              keepLoggedIn: state.keepLoggedIn,
              studentName: state.studentName,
              studentClass: state.studentClass,
              assignments: state.assignments,
              templates: state.templates,
              submissions: state.submissions,
              savedProgress: state.savedProgress
            }
          : {
              studentName: state.studentName,
              studentClass: state.studentClass,
              assignments: state.assignments,
              templates: state.templates,
              submissions: state.submissions,
              savedProgress: state.savedProgress
            }
    }
  )
)

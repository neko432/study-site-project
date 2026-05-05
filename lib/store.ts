'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  UserRole, 
  Assignment, 
  AssignmentTemplate, 
  StudentSubmission, 
  EditorElement 
} from './types'

interface AppState {
  // 認証関連
  role: UserRole
  isAuthenticated: boolean
  keepLoggedIn: boolean
  
  // 先生用
  assignments: Assignment[]
  templates: AssignmentTemplate[]
  currentEditor: EditorElement[]
  
  // 生徒用
  submissions: StudentSubmission[]
  currentStudentId: string
  
  // アクション
  setRole: (role: UserRole) => void
  setAuthenticated: (auth: boolean) => void
  setKeepLoggedIn: (keep: boolean) => void
  logout: () => void
  
  // 課題管理
  addAssignment: (assignment: Assignment) => void
  updateAssignment: (id: string, assignment: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  
  // テンプレート管理
  addTemplate: (template: AssignmentTemplate) => void
  deleteTemplate: (id: string) => void
  
  // エディター
  setCurrentEditor: (elements: EditorElement[]) => void
  addElement: (element: EditorElement) => void
  updateElement: (id: string, element: Partial<EditorElement>) => void
  deleteElement: (id: string) => void
  
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
    publishedAt: new Date(),
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初期状態
      role: null,
      isAuthenticated: false,
      keepLoggedIn: false,
      assignments: sampleAssignments,
      templates: [],
      currentEditor: [],
      submissions: [],
      currentStudentId: 'student-1',
      
      // 認証アクション
      setRole: (role) => set({ role }),
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),
      setKeepLoggedIn: (keep) => set({ keepLoggedIn: keep }),
      logout: () => set({ role: null, isAuthenticated: false }),
      
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
      
      // エディター
      setCurrentEditor: (elements) => set({ currentEditor: elements }),
      addElement: (element) =>
        set((state) => ({
          currentEditor: [...state.currentEditor, element]
        })),
      updateElement: (id, updates) =>
        set((state) => ({
          currentEditor: state.currentEditor.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          )
        })),
      deleteElement: (id) =>
        set((state) => ({
          currentEditor: state.currentEditor.filter((e) => e.id !== id)
        })),
      
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
              assignments: state.assignments,
              templates: state.templates,
              submissions: state.submissions
            }
          : {
              assignments: state.assignments,
              templates: state.templates,
              submissions: state.submissions
            }
    }
  )
)

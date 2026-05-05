'use client'

import { useState, useCallback, useRef } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

interface UseHistoryReturn<T> {
  state: T
  set: (newState: T | ((prev: T) => T)) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clear: () => void
  undoCount: number
  redoCount: number
}

const MAX_HISTORY_SIZE = 50

export function useHistory<T>(initialState: T): UseHistoryReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  })

  // 一括更新用のタイマー
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingStateRef = useRef<T | null>(null)

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((currentHistory) => {
      const actualNewState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(currentHistory.present)
        : newState

      // 同じ状態なら何もしない
      if (JSON.stringify(actualNewState) === JSON.stringify(currentHistory.present)) {
        return currentHistory
      }

      const newPast = [...currentHistory.past, currentHistory.present]
      
      // 履歴サイズを制限
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift()
      }

      return {
        past: newPast,
        present: actualNewState,
        future: [] // 新しい変更で未来の履歴はリセット
      }
    })
  }, [])

  // バッチ更新用（連続した変更をまとめる）
  const setBatched = useCallback((newState: T | ((prev: T) => T), delay: number = 300) => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }

    setHistory((currentHistory) => {
      const actualNewState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(currentHistory.present)
        : newState
      
      pendingStateRef.current = actualNewState
      
      return {
        ...currentHistory,
        present: actualNewState
      }
    })

    batchTimeoutRef.current = setTimeout(() => {
      if (pendingStateRef.current !== null) {
        set(pendingStateRef.current)
        pendingStateRef.current = null
      }
    }, delay)
  }, [set])

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.past.length === 0) {
        return currentHistory
      }

      const previous = currentHistory.past[currentHistory.past.length - 1]
      const newPast = currentHistory.past.slice(0, -1)

      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future]
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      if (currentHistory.future.length === 0) {
        return currentHistory
      }

      const next = currentHistory.future[0]
      const newFuture = currentHistory.future.slice(1)

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture
      }
    })
  }, [])

  const clear = useCallback(() => {
    setHistory({
      past: [],
      present: history.present,
      future: []
    })
  }, [history.present])

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
    undoCount: history.past.length,
    redoCount: history.future.length
  }
}

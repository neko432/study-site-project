'use client'

import { useState, useCallback, useRef } from 'react'
import { produce } from 'immer'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function useHistory<T>(initialState: T, maxHistory = 50) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  })

  // Use ref to track if we should add to history (for batching)
  const skipHistory = useRef(false)

  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  const set = useCallback((newPresent: T | ((prev: T) => T), addToHistory = true) => {
    setHistory(prev => {
      const resolvedPresent = typeof newPresent === 'function'
        ? (newPresent as (prev: T) => T)(prev.present)
        : newPresent

      if (!addToHistory || skipHistory.current) {
        return { ...prev, present: resolvedPresent }
      }

      const newPast = [...prev.past, prev.present].slice(-maxHistory)
      return {
        past: newPast,
        present: resolvedPresent,
        future: []
      }
    })
  }, [maxHistory])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev

      const newPast = prev.past.slice(0, -1)
      const newPresent = prev.past[prev.past.length - 1]
      const newFuture = [prev.present, ...prev.future]

      return {
        past: newPast,
        present: newPresent,
        future: newFuture
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev

      const newFuture = prev.future.slice(1)
      const newPresent = prev.future[0]
      const newPast = [...prev.past, prev.present]

      return {
        past: newPast,
        present: newPresent,
        future: newFuture
      }
    })
  }, [])

  const reset = useCallback((newPresent: T) => {
    setHistory({
      past: [],
      present: newPresent,
      future: []
    })
  }, [])

  // Batch multiple operations into one history entry
  const batch = useCallback((operations: () => void) => {
    skipHistory.current = true
    operations()
    skipHistory.current = false
  }, [])

  // Update without adding to history (for intermediate states)
  const setWithoutHistory = useCallback((newPresent: T | ((prev: T) => T)) => {
    set(newPresent, false)
  }, [set])

  return {
    state: history.present,
    set,
    setWithoutHistory,
    undo,
    redo,
    reset,
    batch,
    canUndo,
    canRedo,
    history: {
      past: history.past,
      future: history.future
    }
  }
}

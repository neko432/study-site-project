'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'

interface FancyDatetimePickerProps {
  value?: Date
  onChange: (date: Date) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export function FancyDatetimePicker({
  value,
  onChange,
  open,
  onOpenChange,
  title = '日時を選択',
  description
}: FancyDatetimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [selectedHour, setSelectedHour] = useState(value?.getHours() ?? 9)
  const [selectedMinute, setSelectedMinute] = useState(value?.getMinutes() ?? 0)
  const [step, setStep] = useState<'date' | 'time'>('date')

  useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setSelectedHour(value.getHours())
      setSelectedMinute(value.getMinutes())
      setCurrentMonth(value)
    }
  }, [value])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // 週の開始日を月曜にするために調整
  const startDay = monthStart.getDay()
  const paddingDays = startDay === 0 ? 6 : startDay - 1

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setStep('time')
  }

  const handleConfirm = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate)
      finalDate.setHours(selectedHour)
      finalDate.setMinutes(selectedMinute)
      onChange(finalDate)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0 bg-gradient-to-br from-background via-background to-primary/5">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/10"
              initial={{ 
                x: Math.random() * 400, 
                y: Math.random() * 500,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                y: [null, Math.random() * -100],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        <DialogHeader className="p-6 pb-4 relative z-10">
          <DialogTitle className="text-xl flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {step === 'date' ? (
                <Calendar className="w-6 h-6 text-primary" />
              ) : (
                <Clock className="w-6 h-6 text-primary" />
              )}
            </motion.div>
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <div className="relative z-10">
          {/* Step indicator */}
          <div className="flex gap-2 px-6 mb-4">
            <motion.button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === 'date' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
              onClick={() => setStep('date')}
              whileTap={{ scale: 0.98 }}
            >
              日付
            </motion.button>
            <motion.button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === 'time' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
              onClick={() => selectedDate && setStep('time')}
              disabled={!selectedDate}
              whileTap={{ scale: 0.98 }}
            >
              時刻
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'date' ? (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-6"
              >
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <motion.h3
                    key={format(currentMonth, 'yyyy-MM')}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-semibold"
                  >
                    {format(currentMonth, 'yyyy年 M月', { locale: ja })}
                  </motion.h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['月', '火', '水', '木', '金', '土', '日'].map((day, i) => (
                    <div
                      key={day}
                      className={`text-center text-xs font-medium py-2 ${
                        i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-muted-foreground'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Padding for days before month start */}
                  {Array.from({ length: paddingDays }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                  
                  {days.map((day, i) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isCurrentDay = isToday(day)
                    const dayOfWeek = day.getDay()
                    const isSaturday = dayOfWeek === 6
                    const isSunday = dayOfWeek === 0

                    return (
                      <motion.button
                        key={day.toISOString()}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDateSelect(day)}
                        className={`
                          relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                            : isCurrentDay
                              ? 'bg-primary/20 text-primary'
                              : isSunday
                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                                : isSaturday
                                  ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                                  : 'hover:bg-muted'
                          }
                        `}
                      >
                        {format(day, 'd')}
                        {isCurrentDay && !isSelected && (
                          <motion.div
                            className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                            layoutId="today-indicator"
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-6"
              >
                <div className="flex gap-4">
                  {/* Hour picker */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2 text-center">時</p>
                    <div className="h-48 overflow-y-auto rounded-lg bg-muted/30 scrollbar-thin">
                      <div className="py-2">
                        {HOURS.map((hour) => (
                          <motion.button
                            key={hour}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedHour(hour)}
                            className={`
                              w-full py-2 text-center text-lg font-medium transition-all
                              ${selectedHour === hour 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-muted'
                              }
                            `}
                          >
                            {hour.toString().padStart(2, '0')}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="flex items-center text-2xl font-bold text-muted-foreground">:</div>

                  {/* Minute picker */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2 text-center">分</p>
                    <div className="h-48 overflow-y-auto rounded-lg bg-muted/30 scrollbar-thin">
                      <div className="py-2">
                        {MINUTES.map((minute) => (
                          <motion.button
                            key={minute}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedMinute(minute)}
                            className={`
                              w-full py-2 text-center text-lg font-medium transition-all
                              ${selectedMinute === minute 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-muted'
                              }
                            `}
                          >
                            {minute.toString().padStart(2, '0')}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border"
                >
                  <p className="text-sm text-muted-foreground">選択中の日時</p>
                  <p className="text-xl font-bold mt-1">
                    {selectedDate && format(selectedDate, 'yyyy年M月d日', { locale: ja })} {' '}
                    {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm button */}
          <div className="px-6 pb-6">
            <Button
              className="w-full h-12 text-lg rounded-xl shadow-lg"
              onClick={handleConfirm}
              disabled={!selectedDate}
            >
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                決定
              </motion.span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

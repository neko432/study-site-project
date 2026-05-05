'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Sunset
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { format, setHours, setMinutes, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'

interface RichDateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  minDate?: Date
  className?: string
}

const TIME_PRESETS = [
  { label: '朝', icon: Sunrise, hours: 8, minutes: 0 },
  { label: '昼', icon: Sun, hours: 12, minutes: 0 },
  { label: '夕', icon: Sunset, hours: 17, minutes: 0 },
  { label: '夜', icon: Moon, hours: 21, minutes: 0 },
]

export function RichDateTimePicker({
  value,
  onChange,
  label,
  placeholder = '日時を選択',
  minDate,
  className
}: RichDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [hours, setHoursState] = useState(value ? value.getHours() : 12)
  const [minutes, setMinutesState] = useState(value ? value.getMinutes() : 0)
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date')

  useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setHoursState(value.getHours())
      setMinutesState(value.getMinutes())
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = setMinutes(setHours(date, hours), minutes)
      setSelectedDate(newDate)
      onChange(newDate)
      setActiveTab('time')
    }
  }

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHoursState(newHours)
    setMinutesState(newMinutes)
    if (selectedDate) {
      const newDate = setMinutes(setHours(selectedDate, newHours), newMinutes)
      setSelectedDate(newDate)
      onChange(newDate)
    }
  }

  const handlePresetClick = (preset: typeof TIME_PRESETS[0]) => {
    handleTimeChange(preset.hours, preset.minutes)
  }

  const incrementHours = () => {
    const newHours = (hours + 1) % 24
    handleTimeChange(newHours, minutes)
  }

  const decrementHours = () => {
    const newHours = (hours - 1 + 24) % 24
    handleTimeChange(newHours, minutes)
  }

  const incrementMinutes = () => {
    const newMinutes = (minutes + 5) % 60
    if (newMinutes < minutes) {
      handleTimeChange((hours + 1) % 24, newMinutes)
    } else {
      handleTimeChange(hours, newMinutes)
    }
  }

  const decrementMinutes = () => {
    const newMinutes = (minutes - 5 + 60) % 60
    if (newMinutes > minutes) {
      handleTimeChange((hours - 1 + 24) % 24, newMinutes)
    } else {
      handleTimeChange(hours, newMinutes)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-start text-left font-normal group ${className}`}
        >
          <motion.div
            className="flex items-center gap-2 w-full"
            whileHover={{ scale: 1.01 }}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            {value ? (
              <span className="flex-1">
                {format(value, 'yyyy年M月d日 HH:mm', { locale: ja })}
              </span>
            ) : (
              <span className="flex-1 text-muted-foreground">{placeholder}</span>
            )}
          </motion.div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 overflow-hidden" align="start">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('date')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'date' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                日付
              </span>
              {activeTab === 'date' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'time' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                時間
              </span>
              {activeTab === 'time' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'date' ? (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-3"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => minDate ? date < minDate : false}
                  initialFocus
                />
              </motion.div>
            ) : (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                {/* Time Presets */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {TIME_PRESETS.map((preset) => {
                    const Icon = preset.icon
                    const isActive = hours === preset.hours && minutes === preset.minutes
                    return (
                      <motion.button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-transparent bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs font-medium">{preset.label}</div>
                        <div className="text-[10px] opacity-70">
                          {preset.hours.toString().padStart(2, '0')}:00
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Time Picker */}
                <div className="flex items-center justify-center gap-4">
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <motion.button
                      onClick={incrementHours}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronLeft className="w-5 h-5 rotate-90" />
                    </motion.button>
                    <motion.div
                      key={hours}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl font-bold w-16 text-center py-2"
                    >
                      {hours.toString().padStart(2, '0')}
                    </motion.div>
                    <motion.button
                      onClick={decrementHours}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </motion.button>
                    <span className="text-xs text-muted-foreground mt-1">時</span>
                  </div>

                  <span className="text-3xl font-bold text-muted-foreground">:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <motion.button
                      onClick={incrementMinutes}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronLeft className="w-5 h-5 rotate-90" />
                    </motion.button>
                    <motion.div
                      key={minutes}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl font-bold w-16 text-center py-2"
                    >
                      {minutes.toString().padStart(2, '0')}
                    </motion.div>
                    <motion.button
                      onClick={decrementMinutes}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </motion.button>
                    <span className="text-xs text-muted-foreground mt-1">分</span>
                  </div>
                </div>

                {/* Current Selection Display */}
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-3 rounded-xl bg-primary/10 text-center"
                  >
                    <p className="text-sm text-muted-foreground">選択中</p>
                    <p className="text-lg font-semibold text-primary">
                      {format(selectedDate, 'M月d日(E) HH:mm', { locale: ja })}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="border-t p-3 flex justify-between items-center bg-card/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined)
                setSelectedDate(undefined)
                setIsOpen(false)
              }}
            >
              クリア
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={!selectedDate}
            >
              確定
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

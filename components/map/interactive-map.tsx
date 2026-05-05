'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Plus, Trash2, X, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MapPin {
  lat: number
  lng: number
  label?: string
}

interface InteractiveMapProps {
  pins: MapPin[]
  onPinsChange: (pins: MapPin[]) => void
  mode: 'edit' | 'view' | 'answer'
  correctPins?: MapPin[]
  studentPins?: MapPin[]
  onStudentPinsChange?: (pins: MapPin[]) => void
}

// 日本の主要都市のプリセット
const PRESET_LOCATIONS = [
  { name: '東京', lat: 35.6762, lng: 139.6503 },
  { name: '大阪', lat: 34.6937, lng: 135.5023 },
  { name: '京都', lat: 35.0116, lng: 135.7681 },
  { name: '名古屋', lat: 35.1815, lng: 136.9066 },
  { name: '福岡', lat: 33.5902, lng: 130.4017 },
  { name: '札幌', lat: 43.0618, lng: 141.3545 },
  { name: '仙台', lat: 38.2682, lng: 140.8694 },
  { name: '広島', lat: 34.3853, lng: 132.4553 },
  { name: '神戸', lat: 34.6901, lng: 135.1956 },
  { name: '横浜', lat: 35.4437, lng: 139.6380 },
]

export function InteractiveMap({
  pins,
  onPinsChange,
  mode,
  correctPins,
  studentPins,
  onStudentPinsChange
}: InteractiveMapProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newPinLat, setNewPinLat] = useState('')
  const [newPinLng, setNewPinLng] = useState('')
  const [newPinLabel, setNewPinLabel] = useState('')
  const [center, setCenter] = useState({ lat: 36.2048, lng: 138.2529 }) // 日本の中心
  const [zoom, setZoom] = useState(5)
  const mapRef = useRef<HTMLIFrameElement>(null)

  // Google Maps Embed URLを生成
  const getMapUrl = useCallback(() => {
    const markers = (mode === 'answer' ? studentPins : pins) || []
    const markerString = markers.map(p => `${p.lat},${p.lng}`).join('|')
    
    // API不要のEmbed版を使用
    let url = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d${1000000 / zoom}!2d${center.lng}!3d${center.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sja!2sjp!4v1`
    
    return url
  }, [pins, studentPins, mode, center, zoom])

  const handleAddPin = useCallback(() => {
    const lat = parseFloat(newPinLat)
    const lng = parseFloat(newPinLng)
    
    if (!isNaN(lat) && !isNaN(lng)) {
      const newPin: MapPin = { lat, lng, label: newPinLabel || undefined }
      
      if (mode === 'answer' && onStudentPinsChange) {
        onStudentPinsChange([...(studentPins || []), newPin])
      } else {
        onPinsChange([...pins, newPin])
      }
      
      setNewPinLat('')
      setNewPinLng('')
      setNewPinLabel('')
      setShowAddDialog(false)
    }
  }, [newPinLat, newPinLng, newPinLabel, pins, studentPins, mode, onPinsChange, onStudentPinsChange])

  const handleSelectPreset = useCallback((location: typeof PRESET_LOCATIONS[0]) => {
    setNewPinLat(location.lat.toString())
    setNewPinLng(location.lng.toString())
    setNewPinLabel(location.name)
    setCenter({ lat: location.lat, lng: location.lng })
  }, [])

  const handleRemovePin = useCallback((index: number) => {
    if (mode === 'answer' && onStudentPinsChange) {
      onStudentPinsChange((studentPins || []).filter((_, i) => i !== index))
    } else {
      onPinsChange(pins.filter((_, i) => i !== index))
    }
  }, [pins, studentPins, mode, onPinsChange, onStudentPinsChange])

  const currentPins = mode === 'answer' ? (studentPins || []) : pins

  // 距離計算（正解判定用）
  const calculateDistance = useCallback((pin1: MapPin, pin2: MapPin) => {
    const R = 6371 // 地球の半径(km)
    const dLat = (pin2.lat - pin1.lat) * Math.PI / 180
    const dLng = (pin2.lng - pin1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pin1.lat * Math.PI / 180) * Math.cos(pin2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }, [])

  return (
    <div className="space-y-4">
      {/* 地図表示 */}
      <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-muted">
        <iframe
          ref={mapRef}
          src={getMapUrl()}
          className="w-full h-full"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        
        {/* ピンオーバーレイ */}
        <div className="absolute inset-0 pointer-events-none">
          {currentPins.map((pin, index) => (
            <motion.div
              key={`${pin.lat}-${pin.lng}-${index}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute flex items-center gap-1"
              style={{
                // 簡易的な位置計算（実際のマップ座標変換は複雑）
                left: `${((pin.lng - (center.lng - 10)) / 20) * 100}%`,
                top: `${((center.lat + 5 - pin.lat) / 10) * 100}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="relative pointer-events-auto">
                <MapPin className="w-6 h-6 text-destructive fill-destructive drop-shadow-lg" />
                {pin.label && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs"
                  >
                    {pin.label}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 編集モードのオーバーレイ */}
        {mode === 'edit' && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="shadow-lg"
            >
              <Plus className="w-4 h-4 mr-1" />
              ピンを追加
            </Button>
          </div>
        )}

        {/* 回答モードのオーバーレイ */}
        {mode === 'answer' && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="shadow-lg"
            >
              <Crosshair className="w-4 h-4 mr-1" />
              位置をマーク
            </Button>
          </div>
        )}
      </div>

      {/* ピン一覧 */}
      {currentPins.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            {mode === 'answer' ? 'マークした位置' : '設定したピン'}
          </Label>
          <div className="flex flex-wrap gap-2">
            {currentPins.map((pin, index) => (
              <motion.div
                key={`${pin.lat}-${pin.lng}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Badge variant="outline" className="flex items-center gap-2 py-1 px-3">
                  <MapPin className="w-3 h-3" />
                  <span>{pin.label || `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`}</span>
                  {(mode === 'edit' || mode === 'answer') && (
                    <button
                      onClick={() => handleRemovePin(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 正解との比較 (表示モード) */}
      {mode === 'view' && correctPins && studentPins && (
        <div className="p-4 rounded-lg bg-muted/50">
          <Label className="text-sm text-muted-foreground mb-2 block">判定結果</Label>
          {studentPins.map((studentPin, i) => {
            const closestCorrect = correctPins.reduce((closest, correctPin) => {
              const dist = calculateDistance(studentPin, correctPin)
              return dist < closest.dist ? { pin: correctPin, dist } : closest
            }, { pin: correctPins[0], dist: Infinity })
            
            const isCorrect = closestCorrect.dist < 50 // 50km以内を正解とする
            
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant={isCorrect ? 'default' : 'destructive'}>
                  {studentPin.label || `位置${i + 1}`}
                </Badge>
                <span className="text-muted-foreground">
                  {isCorrect 
                    ? `正解 (誤差: ${closestCorrect.dist.toFixed(1)}km)` 
                    : `不正解 (最寄りの正解から${closestCorrect.dist.toFixed(1)}km)`
                  }
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ピン追加ダイアログ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {mode === 'answer' ? '位置をマーク' : 'ピンを追加'}
            </DialogTitle>
            <DialogDescription>
              場所を選択するか、座標を直接入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* プリセット場所 */}
            <div>
              <Label className="text-sm mb-2 block">主要都市から選択</Label>
              <ScrollArea className="h-32">
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_LOCATIONS.map((location) => (
                    <Button
                      key={location.name}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleSelectPreset(location)}
                    >
                      <MapPin className="w-3 h-3 mr-2" />
                      {location.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* 座標入力 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">緯度</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={newPinLat}
                  onChange={(e) => setNewPinLat(e.target.value)}
                  placeholder="35.6762"
                />
              </div>
              <div>
                <Label htmlFor="lng">経度</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={newPinLng}
                  onChange={(e) => setNewPinLng(e.target.value)}
                  placeholder="139.6503"
                />
              </div>
            </div>

            {/* ラベル */}
            <div>
              <Label htmlFor="label">ラベル (任意)</Label>
              <Input
                id="label"
                value={newPinLabel}
                onChange={(e) => setNewPinLabel(e.target.value)}
                placeholder="東京タワー"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={handleAddPin}
              disabled={!newPinLat || !newPinLng}
            >
              <Plus className="w-4 h-4 mr-2" />
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Plus, Search, Trash2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'

interface MapPin {
  lat: number
  lng: number
  label?: string
}

interface GoogleMapPickerProps {
  pins: MapPin[]
  onPinsChange: (pins: MapPin[]) => void
  isOpen: boolean
  onClose: () => void
}

const containerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 35.6762,
  lng: 139.6503
}

// Predefined locations for quick access
const PRESET_LOCATIONS = [
  { name: '東京', lat: 35.6762, lng: 139.6503 },
  { name: '京都', lat: 35.0116, lng: 135.7681 },
  { name: '大阪', lat: 34.6937, lng: 135.5023 },
  { name: '奈良', lat: 34.6851, lng: 135.8048 },
  { name: '広島', lat: 34.3853, lng: 132.4553 },
  { name: '長崎', lat: 32.7503, lng: 129.8779 },
  { name: 'ソウル', lat: 37.5665, lng: 126.9780 },
  { name: '北京', lat: 39.9042, lng: 116.4074 },
]

export function GoogleMapPicker({
  pins,
  onPinsChange,
  isOpen,
  onClose
}: GoogleMapPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedPin, setSelectedPin] = useState<number | null>(null)
  const [newPinLabel, setNewPinLabel] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [center, setCenter] = useState(defaultCenter)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check if Google Maps API key is available
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const hasApiKey = apiKey.length > 0

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    language: 'ja'
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    if (pins.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      pins.forEach(pin => {
        bounds.extend({ lat: pin.lat, lng: pin.lng })
      })
      map.fitBounds(bounds)
    }
  }, [pins])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPin: MapPin = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        label: `ポイント ${pins.length + 1}`
      }
      onPinsChange([...pins, newPin])
    }
  }, [pins, onPinsChange])

  const handlePinDrag = useCallback((index: number, e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const updatedPins = [...pins]
      updatedPins[index] = {
        ...updatedPins[index],
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }
      onPinsChange(updatedPins)
    }
  }, [pins, onPinsChange])

  const handleDeletePin = (index: number) => {
    const updatedPins = pins.filter((_, i) => i !== index)
    onPinsChange(updatedPins)
    setSelectedPin(null)
  }

  const handleUpdatePinLabel = (index: number, label: string) => {
    const updatedPins = [...pins]
    updatedPins[index] = { ...updatedPins[index], label }
    onPinsChange(updatedPins)
  }

  const handlePresetLocation = (preset: typeof PRESET_LOCATIONS[0]) => {
    if (map) {
      map.panTo({ lat: preset.lat, lng: preset.lng })
      map.setZoom(12)
    }
    setCenter({ lat: preset.lat, lng: preset.lng })
  }

  const handleSearch = async () => {
    if (!searchQuery || !map) return
    
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location
        map.panTo(location)
        map.setZoom(14)
        setCenter({ lat: location.lat(), lng: location.lng() })
      }
    })
  }

  // Fallback UI when no API key is available
  const renderFallbackMap = () => (
    <div className="w-full h-[400px] bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground">
      <MapPin className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-center mb-4">
        Google Maps APIキーが設定されていません。
        <br />
        手動で座標を入力してください。
      </p>
      
      {/* Manual coordinate input */}
      <div className="flex items-center gap-2 mt-4">
        <Input
          type="number"
          step="0.0001"
          placeholder="緯度"
          className="w-28"
          onChange={(e) => {
            const lat = parseFloat(e.target.value)
            if (!isNaN(lat)) {
              setCenter(prev => ({ ...prev, lat }))
            }
          }}
        />
        <Input
          type="number"
          step="0.0001"
          placeholder="経度"
          className="w-28"
          onChange={(e) => {
            const lng = parseFloat(e.target.value)
            if (!isNaN(lng)) {
              setCenter(prev => ({ ...prev, lng }))
            }
          }}
        />
        <Button
          size="sm"
          onClick={() => {
            if (center.lat && center.lng) {
              const newPin: MapPin = {
                lat: center.lat,
                lng: center.lng,
                label: `ポイント ${pins.length + 1}`
              }
              onPinsChange([...pins, newPin])
            }
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            地図でピンを配置
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map Area */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            {hasApiKey && (
              <div className="flex gap-2 mb-3">
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="場所を検索..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Quick location buttons */}
            {hasApiKey && (
              <div className="flex flex-wrap gap-1 mb-3">
                {PRESET_LOCATIONS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetLocation(preset)}
                    className="text-xs"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    {preset.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Map */}
            {hasApiKey && isLoaded ? (
              <div className="rounded-lg overflow-hidden border">
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={10}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  onClick={handleMapClick}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: true,
                    fullscreenControl: false
                  }}
                >
                  {pins.map((pin, index) => (
                    <Marker
                      key={index}
                      position={{ lat: pin.lat, lng: pin.lng }}
                      label={{
                        text: (index + 1).toString(),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      draggable
                      onDragEnd={(e) => handlePinDrag(index, e)}
                      onClick={() => setSelectedPin(index)}
                    />
                  ))}
                  
                  {selectedPin !== null && pins[selectedPin] && (
                    <InfoWindow
                      position={{ lat: pins[selectedPin].lat, lng: pins[selectedPin].lng }}
                      onCloseClick={() => setSelectedPin(null)}
                    >
                      <div className="p-2">
                        <Input
                          value={pins[selectedPin].label || ''}
                          onChange={(e) => handleUpdatePinLabel(selectedPin, e.target.value)}
                          placeholder="ラベルを入力"
                          className="mb-2 text-sm"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePin(selectedPin)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          削除
                        </Button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            ) : loadError ? (
              <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center text-destructive">
                地図の読み込みに失敗しました
              </div>
            ) : !hasApiKey ? (
              renderFallbackMap()
            ) : (
              <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </motion.div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {hasApiKey 
                ? 'クリックでピンを追加、ドラッグで移動できます'
                : 'APIキーを設定すると地図上で直接ピンを配置できます'
              }
            </p>
          </div>

          {/* Pin List */}
          <div className="lg:col-span-1">
            <Label className="text-sm font-medium mb-2 block">
              配置済みのピン ({pins.length})
            </Label>
            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-2 space-y-2">
                <AnimatePresence>
                  {pins.map((pin, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedPin === index 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="shrink-0">
                              {index + 1}
                            </Badge>
                            <span className="text-sm font-medium truncate">
                              {pin.label || `ポイント ${index + 1}`}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeletePin(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        value={pin.label || ''}
                        onChange={(e) => handleUpdatePinLabel(index, e.target.value)}
                        placeholder="ラベルを入力..."
                        className="mt-2 text-xs h-8"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {pins.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">ピンがありません</p>
                    <p className="text-xs">地図をクリックして追加</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Simple map display component for viewing (non-editable)
export function GoogleMapDisplay({ pins }: { pins: MapPin[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const hasApiKey = apiKey.length > 0

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    language: 'ja'
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    if (pins.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      pins.forEach(pin => {
        bounds.extend({ lat: pin.lat, lng: pin.lng })
      })
      map.fitBounds(bounds)
    }
  }, [pins])

  if (!hasApiKey) {
    return (
      <div className="w-full h-48 bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground">
        <MapPin className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">{pins.length}個のピンが設定済み</p>
        <div className="mt-2 space-y-1 text-xs">
          {pins.map((pin, i) => (
            <div key={i}>
              {pin.label || `ポイント${i + 1}`}: ({pin.lat.toFixed(2)}, {pin.lng.toFixed(2)})
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
        <MapPin className="w-6 h-6 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  const center = pins.length > 0 
    ? { lat: pins[0].lat, lng: pins[0].lng }
    : defaultCenter

  return (
    <div className="rounded-lg overflow-hidden border">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '200px' }}
        center={center}
        zoom={8}
        onLoad={onLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: false,
          draggable: false
        }}
      >
        {pins.map((pin, index) => (
          <Marker
            key={index}
            position={{ lat: pin.lat, lng: pin.lng }}
            label={{
              text: pin.label || (index + 1).toString(),
              color: 'white',
              fontSize: '10px'
            }}
          />
        ))}
      </GoogleMap>
    </div>
  )
}

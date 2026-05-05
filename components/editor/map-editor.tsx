'use client'

import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Icon, LatLng } from 'leaflet'
import { MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MapData, MapPin as MapPinType } from '@/lib/types'
import 'leaflet/dist/leaflet.css'

// カスタムマーカーアイコン
const customIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

interface MapClickHandlerProps {
  onMapClick: (latlng: LatLng) => void
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng)
    },
  })
  return null
}

interface MapEditorProps {
  initialData?: MapData
  onSave: (data: MapData) => void
  onCancel: () => void
}

export function MapEditor({ initialData, onSave, onCancel }: MapEditorProps) {
  const [center, setCenter] = useState<[number, number]>(
    initialData?.center || [35.6762, 139.6503] // Tokyo default
  )
  const [zoom, setZoom] = useState(initialData?.zoom || 10)
  const [pins, setPins] = useState<MapPinType[]>(initialData?.pins || [])
  const [editingPinIndex, setEditingPinIndex] = useState<number | null>(null)
  const [pinLabel, setPinLabel] = useState('')

  const handleMapClick = useCallback((latlng: LatLng) => {
    const newPin: MapPinType = {
      lat: latlng.lat,
      lng: latlng.lng,
      label: `ピン ${pins.length + 1}`,
    }
    setPins([...pins, newPin])
    setEditingPinIndex(pins.length)
    setPinLabel(newPin.label || '')
  }, [pins])

  const handlePinLabelSave = () => {
    if (editingPinIndex !== null) {
      const updatedPins = [...pins]
      updatedPins[editingPinIndex] = {
        ...updatedPins[editingPinIndex],
        label: pinLabel,
      }
      setPins(updatedPins)
      setEditingPinIndex(null)
      setPinLabel('')
    }
  }

  const handleDeletePin = (index: number) => {
    setPins(pins.filter((_, i) => i !== index))
    if (editingPinIndex === index) {
      setEditingPinIndex(null)
      setPinLabel('')
    }
  }

  const handleSave = () => {
    onSave({
      center,
      zoom,
      pins,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative min-h-[400px] rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full"
          whenReady={(map) => {
            map.target.on('moveend', () => {
              const mapCenter = map.target.getCenter()
              setCenter([mapCenter.lat, mapCenter.lng])
            })
            map.target.on('zoomend', () => {
              setZoom(map.target.getZoom())
            })
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {pins.map((pin, index) => (
            <Marker
              key={index}
              position={[pin.lat, pin.lng]}
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  setEditingPinIndex(index)
                  setPinLabel(pin.label || '')
                },
              }}
            />
          ))}
        </MapContainer>
        
        {/* 使い方ヒント */}
        <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-muted-foreground border border-border shadow-sm">
          <MapPin className="w-4 h-4 inline mr-1" />
          地図をクリックしてピンを追加
        </div>
      </div>

      {/* ピン一覧 */}
      {pins.length > 0 && (
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          <Label className="text-sm font-medium">配置したピン</Label>
          {pins.map((pin, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg border ${
                editingPinIndex === index ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              {editingPinIndex === index ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={pinLabel}
                    onChange={(e) => setPinLabel(e.target.value)}
                    placeholder="ラベル"
                    className="h-8"
                    autoFocus
                  />
                  <Button size="sm" onClick={handlePinLabelSave}>
                    保存
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    className="flex-1 text-sm cursor-pointer hover:text-primary"
                    onClick={() => {
                      setEditingPinIndex(index)
                      setPinLabel(pin.label || '')
                    }}
                  >
                    {pin.label || `ピン ${index + 1}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                  </span>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleDeletePin(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  )
}

// 表示専用の地図コンポーネント
interface MapViewerProps {
  data: MapData
  className?: string
}

export function MapViewer({ data, className }: MapViewerProps) {
  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className || ''}`}>
      <MapContainer
        center={data.center}
        zoom={data.zoom}
        className="w-full h-full"
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.pins.map((pin, index) => (
          <Marker
            key={index}
            position={[pin.lat, pin.lng]}
            icon={customIcon}
          />
        ))}
      </MapContainer>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Plus, Trash2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MapMarker {
  lat: number
  lng: number
  label?: string
}

interface MapData {
  lat: number
  lng: number
  zoom: number
  markers: MapMarker[]
}

interface MapEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapData: MapData
  onSave: (data: MapData) => void
}

// Simple map component without external dependencies
function SimpleMap({ 
  mapData, 
  onMapClick, 
  onMarkerRemove 
}: { 
  mapData: MapData
  onMapClick?: (lat: number, lng: number) => void
  onMarkerRemove?: (index: number) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      // Fix for default marker icon
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapRef.current) return

      // Initialize map
      const map = L.map(mapRef.current).setView([mapData.lat, mapData.lng], mapData.zoom)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map)

      // Add click handler
      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng.lat, e.latlng.lng)
        })
      }

      setMapInstance(map)

      return () => {
        map.remove()
      }
    })
  }, [])

  // Update markers when mapData changes
  useEffect(() => {
    if (!mapInstance) return

    import('leaflet').then((L) => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      // Add new markers
      mapData.markers.forEach((marker, index) => {
        const m = L.marker([marker.lat, marker.lng])
          .addTo(mapInstance)
        
        if (marker.label) {
          m.bindPopup(marker.label)
        }
        
        if (onMarkerRemove) {
          m.on('click', () => {
            if (confirm('このピンを削除しますか?')) {
              onMarkerRemove(index)
            }
          })
        }
        
        markersRef.current.push(m)
      })
    })
  }, [mapInstance, mapData.markers, onMarkerRemove])

  // Update view when center changes
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setView([mapData.lat, mapData.lng], mapData.zoom)
    }
  }, [mapInstance, mapData.lat, mapData.lng, mapData.zoom])

  return (
    <div ref={mapRef} className="w-full h-full rounded-lg" />
  )
}

export function MapEditor({ open, onOpenChange, mapData, onSave }: MapEditorProps) {
  const [localData, setLocalData] = useState<MapData>(mapData)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMarkerLabel, setNewMarkerLabel] = useState('')

  useEffect(() => {
    setLocalData(mapData)
  }, [mapData])

  const handleMapClick = (lat: number, lng: number) => {
    const newMarker: MapMarker = {
      lat,
      lng,
      label: newMarkerLabel || `地点 ${localData.markers.length + 1}`
    }
    setLocalData(prev => ({
      ...prev,
      markers: [...prev.markers, newMarker]
    }))
    setNewMarkerLabel('')
  }

  const handleMarkerRemove = (index: number) => {
    setLocalData(prev => ({
      ...prev,
      markers: prev.markers.filter((_, i) => i !== index)
    }))
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      )
      const results = await response.json()
      
      if (results.length > 0) {
        const { lat, lon } = results[0]
        setLocalData(prev => ({
          ...prev,
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          zoom: 12
        }))
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleSave = () => {
    onSave(localData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            地図エディター
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-full min-h-0">
          {/* Map */}
          <div className="flex-1 min-h-0">
            <div className="h-full border rounded-lg overflow-hidden">
              <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
              />
              <SimpleMap
                mapData={localData}
                onMapClick={handleMapClick}
                onMarkerRemove={handleMarkerRemove}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-64 space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>場所を検索</Label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="地名を入力..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button size="icon" variant="outline" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* New marker label */}
            <div className="space-y-2">
              <Label>新しいピンのラベル</Label>
              <Input
                value={newMarkerLabel}
                onChange={(e) => setNewMarkerLabel(e.target.value)}
                placeholder="ラベルを入力..."
              />
              <p className="text-xs text-muted-foreground">
                地図をクリックしてピンを追加
              </p>
            </div>

            {/* Markers list */}
            <div className="space-y-2">
              <Label>ピン一覧 ({localData.markers.length})</Label>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {localData.markers.map((marker, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm truncate max-w-[120px]">
                          {marker.label || `地点 ${index + 1}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleMarkerRemove(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  ))}
                  {localData.markers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      ピンがありません
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Coordinates */}
            <div className="space-y-2">
              <Label>中心座標</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">緯度</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={localData.lat.toFixed(4)}
                    onChange={(e) => setLocalData(prev => ({
                      ...prev,
                      lat: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">経度</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={localData.lng.toFixed(4)}
                    onChange={(e) => setLocalData(prev => ({
                      ...prev,
                      lng: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Simple map display component (read-only)
export function MapDisplay({ mapData }: { mapData: MapData }) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (!mapRef.current) return

      const map = L.map(mapRef.current, { 
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
      }).setView([mapData.lat, mapData.lng], mapData.zoom)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)

      mapData.markers.forEach(marker => {
        const m = L.marker([marker.lat, marker.lng]).addTo(map)
        if (marker.label) {
          m.bindPopup(marker.label)
        }
      })

      return () => {
        map.remove()
      }
    })
  }, [mapData])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
      />
      <div ref={mapRef} className="w-full h-48 rounded-lg" />
    </>
  )
}

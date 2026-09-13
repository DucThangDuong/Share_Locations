import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Calendar, Globe, Lock } from 'lucide-react'
import type { VisitLogItem } from '@/types/models/userProfile.model'

interface VisitedLogMapProps {
  logs: VisitLogItem[]
  onSelectPlace?: (log: VisitLogItem) => void
}

export const VisitedLogMap: React.FC<VisitedLogMapProps> = ({ logs, onSelectPlace }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [selectedLog, setSelectedLog] = useState<VisitLogItem | null>(null)

  const mapboxToken = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() ||
    'pk.eyJ1IjoibGFuZ3RoYW5nLXZuIiwiYSI6ImNtODFhYmNkZTAxMzAya3B0eGZjcHB0ZmoifQ.placeholder'

  const logsWithCoords = logs.map((log) => {
    if (log.lat && log.lng) return log
    const prov = log.province || ''
    if (prov.includes('Đà Lạt') || prov.includes('Lâm Đồng')) {
      return { ...log, lat: 11.9404, lng: 108.4583 }
    }
    if (prov.includes('Hội An') || prov.includes('Quảng Nam')) {
      return { ...log, lat: 15.8794, lng: 108.3323 }
    }
    if (prov.includes('Hà Nội')) {
      return { ...log, lat: 21.0315, lng: 105.8524 }
    }
    if (prov.includes('Hà Giang')) {
      return { ...log, lat: 23.3601, lng: 105.3184 }
    }
    if (prov.includes('Sa Pa') || prov.includes('Lào Cai')) {
      return { ...log, lat: 22.3364, lng: 103.8438 }
    }
    if (prov.includes('Ninh Bình')) {
      return { ...log, lat: 20.2506, lng: 105.9745 }
    }
    if (prov.includes('Hồ Chí Minh') || prov.includes('Sài Gòn')) {
      return { ...log, lat: 10.7769, lng: 106.7009 }
    }
    if (prov.includes('Đà Nẵng')) {
      return { ...log, lat: 16.0544, lng: 108.2022 }
    }
    return { ...log, lat: 16.047079, lng: 108.20623 }
  })

  useEffect(() => {
    if (!mapContainerRef.current) return

    try {
      mapboxgl.accessToken = mapboxToken

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [106.5, 16.0],
        zoom: 5.2
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

      map.on('load', () => {
        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        const bounds = new mapboxgl.LngLatBounds()

        logsWithCoords.forEach((log) => {
          if (!log.lat || !log.lng) return

          bounds.extend([log.lng, log.lat])

          const el = document.createElement('div')
          el.className = 'cursor-pointer group flex flex-col items-center'
          el.innerHTML = `
            <div class="relative w-8 h-8 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white flex items-center justify-center transform hover:scale-125 transition-transform duration-200">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <div class="px-2 py-0.5 mt-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
              ${log.placeName}
            </div>
          `

          el.addEventListener('click', () => {
            setSelectedLog(log)
            if (onSelectPlace) onSelectPlace(log)
            map.flyTo({ center: [log.lng!, log.lat!], zoom: 13, duration: 1200 })
          })

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([log.lng, log.lat])
            .addTo(map)

          markersRef.current.push(marker)
        })

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 12 })
        }
      })

      mapInstanceRef.current = map

      return () => {
        markersRef.current.forEach((m) => m.remove())
        map.remove()
      }
    } catch {
    }
  }, [logs])

  return (
    <div className="relative w-full h-[450px] sm:h-[550px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />

      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-md text-xs flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-slate-800">
          {logsWithCoords.length} điểm dấu chân trên bản đồ
        </span>
      </div>

      {selectedLog && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl space-y-2.5 animate-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {selectedLog.category}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">{selectedLog.placeName}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{selectedLog.province}</span>
              </p>
            </div>
            <button type="button"
              onClick={() => setSelectedLog(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {selectedLog.coverImg && (
            <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100">
              <img
                src={selectedLog.coverImg}
                alt={selectedLog.placeName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{selectedLog.visitedDate}</span>
            </span>
            <span className="flex items-center gap-1">
              {selectedLog.privacy === 0 ? (
                <>
                  <Globe className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Công khai</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500 font-medium">Riêng tư</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

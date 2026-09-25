import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  ExternalLink,
  Info
} from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { UserReviewItem, VisitLogItem, ProposalItem, UserMapPlaceDto } from '@/types/models/userProfile.model'

export type MapInteractionType = 'all' | 'review' | 'visit_log' | 'proposal'

export interface UserMapPlaceItem {
  id: number
  placeId: number
  title: string
  coverImg?: string | null
  category?: string | null
  province?: string | null
  coordinates: [number, number] // [lng, lat]
  interactionType: 'review' | 'visit_log' | 'proposal'
  interactionLabel: string
  rating?: number
  date?: string
}

interface UserProfileTravelMapProps {
  userName: string
  mapPlaces?: UserMapPlaceDto[]
  reviews?: UserReviewItem[]
  visitLogs?: VisitLogItem[]
  proposals?: ProposalItem[]
}

export const UserProfileTravelMap: React.FC<UserProfileTravelMapProps> = ({
  userName,
  mapPlaces = [],
  reviews = [],
  visitLogs = [],
  proposals = []
}) => {
  const [activeFilter, setActiveFilter] = useState<MapInteractionType>('all')
  const [activePlace, setActivePlace] = useState<UserMapPlaceItem | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [hasMapboxToken, setHasMapboxToken] = useState(false)

  const token = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim()

  // Extract / synthesize all map places from backend mapPlaces or fallback from reviews, visit logs, proposals
  const allMapPlaces = useMemo<UserMapPlaceItem[]>(() => {
    if (mapPlaces && mapPlaces.length > 0) {
      return mapPlaces.map((p) => ({
        id: p.id,
        placeId: p.placeId,
        title: p.title,
        coverImg: p.coverImg,
        category: p.category || 'Địa điểm',
        province: p.province || 'Việt Nam',
        coordinates: p.coordinates,
        interactionType: p.interactionType,
        interactionLabel: p.interactionLabel,
        rating: p.rating || undefined,
        date: p.date || undefined
      }))
    }

    const list: UserMapPlaceItem[] = []

    // 1. Places from Reviews
    reviews.forEach((r, idx) => {
      // Demo coordinates if none stored, or lat/lng
      // Distributed around famous Vietnam spots if coords not present
      const defaultLngs = [108.22, 106.66, 105.85, 108.45, 107.59, 109.19, 103.96]
      const defaultLats = [16.05, 10.76, 21.02, 11.94, 16.46, 12.23, 10.28]
      const coordLng = defaultLngs[idx % defaultLngs.length] + (idx * 0.02)
      const coordLat = defaultLats[idx % defaultLats.length] + (idx * 0.01)

      list.push({
        id: r.id || idx,
        placeId: r.placeId || idx,
        title: r.placeName || 'Địa điểm đánh giá',
        coverImg: r.coverImg,
        category: r.category || 'Du lịch & Ẩm thực',
        province: r.province || 'Việt Nam',
        coordinates: [coordLng, coordLat],
        interactionType: 'review',
        interactionLabel: `Đã đánh giá ${r.rating || 5}★`,
        rating: r.rating || 5,
        date: r.visitDate || r.createdAt
      })
    })

    // 2. Places from Visit Logs
    visitLogs.forEach((v, idx) => {
      const lng = v.lng || 106.70 + (idx * 0.03)
      const lat = v.lat || 10.78 + (idx * 0.02)

      list.push({
        id: 1000 + (v.id || idx),
        placeId: v.placeId || idx,
        title: v.placeName || 'Địa điểm đã ghé',
        coverImg: v.coverImg,
        category: v.category || 'Nhật ký điểm đến',
        province: v.province || 'Việt Nam',
        coordinates: [lng, lat],
        interactionType: 'visit_log',
        interactionLabel: `Đã ghé thăm ${new Date(v.visitedDate).toLocaleDateString('vi-VN')}`,
        date: v.visitedDate
      })
    })

    // 3. Places from Proposals
    proposals.forEach((p, idx) => {
      const lng = p.longitude || 105.83 + (idx * 0.04)
      const lat = p.latitude || 21.03 + (idx * 0.03)

      list.push({
        id: 3000 + (p.id || idx),
        placeId: p.targetPlaceId || p.id,
        title: p.name,
        coverImg: p.coverImg,
        category: p.categoryName || p.category || 'Đề xuất địa điểm',
        province: p.provinceName || p.province || 'Việt Nam',
        coordinates: [lng, lat],
        interactionType: 'proposal',
        interactionLabel: 'Địa điểm đề xuất thành công',
        date: p.createdAt
      })
    })

    return list
  }, [mapPlaces, reviews, visitLogs, proposals])

  // Filter places based on active tab
  const filteredPlaces = useMemo(() => {
    if (activeFilter === 'all') return allMapPlaces
    return allMapPlaces.filter((p) => p.interactionType === activeFilter)
  }, [allMapPlaces, activeFilter])

  // Initialize Mapbox map
  useEffect(() => {
    if (!token || !mapContainerRef.current) {
      setHasMapboxToken(false)
      return
    }

    setHasMapboxToken(true)
    mapboxgl.accessToken = token

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [108.2022, 16.0544], // Center of Vietnam
        zoom: 5.5
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')
      mapInstanceRef.current = map

      return () => {
        markersRef.current.forEach((m) => m.remove())
        map.remove()
      }
    } catch {
      setHasMapboxToken(false)
    }
  }, [token])

  // Render Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !hasMapboxToken) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    if (filteredPlaces.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()

    filteredPlaces.forEach((item) => {
      if (!item.coordinates || item.coordinates.length < 2) return

      bounds.extend(item.coordinates)

      // Marker element with badge colors
      const el = document.createElement('div')
      el.className = 'group/marker relative cursor-pointer select-none transition-transform hover:scale-125 hover:z-30'

      let bgColor = 'bg-emerald-600'
      let ringColor = 'ring-emerald-300'
      let iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`

      if (item.interactionType === 'visit_log') {
        bgColor = 'bg-amber-500'
        ringColor = 'ring-amber-300'
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
      } else if (item.interactionType === 'proposal') {
        bgColor = 'bg-blue-600'
        ringColor = 'ring-blue-300'
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
      }

      el.innerHTML = `
        <div class="w-8 h-8 rounded-full ${bgColor} text-white shadow-xl flex items-center justify-center border-2 border-white ring-2 ${ringColor}">
          ${iconSvg}
        </div>
      `

      el.addEventListener('click', () => {
        setActivePlace(item)
        map.flyTo({
          center: item.coordinates,
          zoom: Math.max(map.getZoom(), 11),
          essential: true
        })
      })

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(item.coordinates)
        .addTo(map)

      markersRef.current.push(marker)
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: 12,
        duration: 800
      })
    }
  }, [filteredPlaces, hasMapboxToken])

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
      {/* ── MAP HEADER & FILTERS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Tất cả ({allMapPlaces.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${activeFilter === 'review'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Đánh giá ({reviews.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('visit_log')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${activeFilter === 'visit_log'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Nhật ký ({visitLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('proposal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${activeFilter === 'proposal'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Đề xuất ({proposals.length})
          </button>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div className="relative w-full h-[420px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {!hasMapboxToken && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 text-center text-white">
            <div className="bg-slate-900/90 p-5 rounded-2xl max-w-md border border-slate-700 shadow-2xl">
              <Info className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="font-bold text-base mb-1">Chế độ xem Bản đồ tương tác</div>
              <p className="text-xs text-slate-300">
                Hiển thị tất cả {filteredPlaces.length} điểm tương tác du lịch của {userName} trên hệ thống.
              </p>
            </div>
          </div>
        )}

        {/* ── POPUP OVERLAY KHI CLICK VÀO MARKER ── */}
        {activePlace && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${activePlace.interactionType === 'review'
                  ? 'bg-emerald-100 text-emerald-800'
                  : activePlace.interactionType === 'visit_log'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}
              >
                {activePlace.interactionLabel}
              </span>
              <button
                type="button"
                onClick={() => setActivePlace(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <img
                src={
                  activePlace.coverImg ||
                  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=160&h=160&fit=crop'
                }
                alt={activePlace.title}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {activePlace.title}
                </h4>
                <div className="text-xs text-slate-500 font-medium truncate">
                  {activePlace.category}
                </div>
                {activePlace.province && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                    <MapPin size={11} className="text-amber-500 shrink-0" />
                    <span className="truncate">{activePlace.province}</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              to={`/places/${activePlace.placeId}`}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Xem chi tiết địa điểm</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

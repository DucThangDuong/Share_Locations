import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Info, SlidersHorizontal, ChevronRight } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { placeService } from '@/services/placeService'
import { MapSidebar } from '@/components/map/MapSidebar'
import type { PlaceMapItemDto, LookupItemDto, RegionLookupDto } from '@/types/models/place.model'

export const MapPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [places, setPlaces] = useState<PlaceMapItemDto[]>([])
  const [categories, setCategories] = useState<LookupItemDto[]>([])
  const [regions, setRegions] = useState<RegionLookupDto[]>([])
  const [loading, setLoading] = useState(true)

  // Sync state with URL params
  const searchKeyword = searchParams.get('q') || searchParams.get('keyword') || searchParams.get('search') || ''
  const selectedCategoryId = useMemo(() => {
    const raw = searchParams.get('catId') || searchParams.get('categoryId') || searchParams.get('cat')
    return raw ? Number(raw) || 0 : 0
  }, [searchParams])
  const selectedProvinceId = useMemo(() => {
    const raw = searchParams.get('provinceId') || searchParams.get('provId') || searchParams.get('province')
    return raw ? Number(raw) || 0 : 0
  }, [searchParams])

  const [activePlace, setActivePlace] = useState<PlaceMapItemDto | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [hasMapboxToken, setHasMapboxToken] = useState(false)

  const token = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim()

  const activeFilterCount = (selectedCategoryId > 0 ? 1 : 0) + (selectedProvinceId > 0 ? 1 : 0)

  const updateUrlParams = (updates: { q?: string; catId?: number; provinceId?: number }) => {
    const params = new URLSearchParams(searchParams)
    if (updates.q !== undefined) {
      if (updates.q.trim()) params.set('q', updates.q.trim())
      else params.delete('q')
    }
    if (updates.catId !== undefined) {
      if (updates.catId > 0) params.set('catId', String(updates.catId))
      else {
        params.delete('catId')
        params.delete('categoryId')
        params.delete('cat')
      }
    }
    if (updates.provinceId !== undefined) {
      if (updates.provinceId > 0) params.set('provinceId', String(updates.provinceId))
      else {
        params.delete('provinceId')
        params.delete('provId')
        params.delete('province')
      }
    }
    setSearchParams(params, { replace: true })
  }

  const handleSearchChange = (keyword: string) => {
    updateUrlParams({ q: keyword })
  }

  const handleCategoryChange = (catId: number) => {
    updateUrlParams({ catId })
  }

  const handleProvinceChange = (provinceId: number) => {
    updateUrlParams({ provinceId })
  }

  const handleResetFilters = () => {
    const params = new URLSearchParams()
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await placeService.getFilterOptions()
        if (res.success && res.data) {
          setCategories(res.data.categories || [])
          setRegions(res.data.regions || [])
        }
      } catch (err) {
        console.error('Error fetching filter options:', err)
      }
    }
    fetchOptions()
  }, [])

  useEffect(() => {
    const fetchMapPlaces = async () => {
      setLoading(true)
      try {
        const res = await placeService.getPlacesMap({
          keyword: searchKeyword.trim() || undefined,
          categoryId: selectedCategoryId > 0 ? selectedCategoryId : undefined,
          provinceId: selectedProvinceId > 0 ? selectedProvinceId : undefined
        })
        if (res.success && res.data) {
          setPlaces(res.data)
          if (res.data.length > 0) {
            setActivePlace(res.data[0])
            if (selectedProvinceId > 0 && mapInstanceRef.current && res.data[0].coordinates) {
              mapInstanceRef.current.flyTo({
                center: [res.data[0].coordinates[0], res.data[0].coordinates[1]],
                zoom: 10,
                essential: true
              })
            }
          }
        }
      } catch {
        setPlaces([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchMapPlaces, 300)
    return () => clearTimeout(timeoutId)
  }, [searchKeyword, selectedCategoryId, selectedProvinceId])

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
        center: [108.2022, 16.0544],
        zoom: 5.5
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      mapInstanceRef.current = map

      return () => {
        markersRef.current.forEach((m) => m.remove())
        map.remove()
      }
    } catch {
      setHasMapboxToken(false)
    }
  }, [token])

  // Trigger Mapbox resize when sidebar opens/collapses
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.resize()
    }, 150)
    return () => clearTimeout(timer)
  }, [isSidebarOpen])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !hasMapboxToken) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    places.forEach((place) => {
      if (!place.coordinates || place.coordinates.length < 2) return

      const el = document.createElement('div')
      el.className = 'w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white cursor-pointer hover:brightness-125 hover:ring-4 hover:ring-emerald-400/40 transition-all'
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
          ${place.imageUrl ? `<img src="${place.imageUrl}" alt="${place.name}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ''}
          <h4 style="font-weight: 700; font-size: 14px; margin: 0 0 4px 0; color: #111;">${place.name}</h4>
          <p style="font-size: 12px; color: #666; margin: 0 0 6px 0;">${place.address}</p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 12px; font-weight: 600; color: #059669;">★ ${place.avgRating}</span>
            <a href="/places/${place.id}" style="font-size: 12px; color: #059669; font-weight: bold; text-decoration: underline;">Chi tiết</a>
          </div>
        </div>
      `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([place.coordinates[0], place.coordinates[1]])
        .setPopup(popup)
        .addTo(map)

      el.addEventListener('click', () => {
        setActivePlace(place)
      })

      markersRef.current.push(marker)
    })
  }, [places, hasMapboxToken])

  const handleSelectPlace = (place: PlaceMapItemDto) => {
    setActivePlace(place)
    if (mapInstanceRef.current && hasMapboxToken && place.coordinates) {
      mapInstanceRef.current.flyTo({
        center: [place.coordinates[0], place.coordinates[1]],
        zoom: 12,
        essential: true
      })
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-full flex flex-col py-2.5">
        <div className="flex-1 flex overflow-hidden relative rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
          <MapSidebar
            places={places}
            loading={loading}
            searchKeyword={searchKeyword}
            categories={categories}
            regions={regions}
            selectedCategoryId={selectedCategoryId}
            selectedProvinceId={selectedProvinceId}
            activePlace={activePlace}
            isOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onProvinceChange={handleProvinceChange}
            onResetFilters={handleResetFilters}
            onSelectPlace={handleSelectPlace}
          />

          <div className="flex-1 h-full relative bg-slate-900">
            {/* Floating Expand Sidebar Button when collapsed */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Mở bộ lọc và danh sách địa điểm"
                className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200/80 text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 transition-all font-bold text-xs cursor-pointer group"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                <span>Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <div ref={mapContainerRef} className="w-full h-full" />

            {!hasMapboxToken && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <Info className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Chưa cấu hình Mapbox Token</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
                  Để trải nghiệm bản đồ 3D vệ tinh mượt mà, vui lòng cấu hình <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-xs">VITE_MAPBOX_ACCESS_TOKEN</code> trong tệp <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-xs">.env</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


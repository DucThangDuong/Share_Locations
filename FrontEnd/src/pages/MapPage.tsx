import { useState, useEffect, useRef } from 'react'
import { Compass, Layers, Info } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { placeService } from '@/services/placeService'
import { MapSidebar } from '@/components/map/MapSidebar'
import { MapPlaceDrawer } from '@/components/map/MapPlaceDrawer'
import type { PlaceMapItemDto } from '@/types/models/place.model'

export const MapPage = () => {
  const [places, setPlaces] = useState<PlaceMapItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number>(0)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [activePlace, setActivePlace] = useState<PlaceMapItemDto | null>(null)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [hasMapboxToken, setHasMapboxToken] = useState(false)

  const token = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim()

  useEffect(() => {
    const fetchMapPlaces = async () => {
      setLoading(true)
      try {
        const res = await placeService.getPlacesMap({
          keyword: searchKeyword,
          categoryId: selectedCategory > 0 ? selectedCategory : undefined,
          region: selectedRegion !== 'all' ? selectedRegion : undefined
        })
        if (res.success && res.data) {
          setPlaces(res.data)
          if (res.data.length > 0) {
            setActivePlace(res.data[0])
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
  }, [searchKeyword, selectedCategory, selectedRegion])

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

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !hasMapboxToken) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    places.forEach((place) => {
      if (!place.coordinates || place.coordinates.length < 2) return

      const el = document.createElement('div')
      el.className = 'w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-125 transition-transform'
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
          ${place.imageUrl ? `<img src="${place.imageUrl}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ''}
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
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              Bản Đồ Du Lịch Việt Nam
            </h1>
            <p className="text-xs text-gray-500">
              Khám phá hơn 63 tỉnh thành & tọa độ nổi tiếng theo thời gian thực
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="md:hidden flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setMobileView('map')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                mobileView === 'map' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600'
              }`}
            >
              Bản đồ
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                mobileView === 'list' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600'
              }`}
            >
              Danh sách ({places.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hiển thị: <strong className="text-gray-900">{places.length}</strong> địa điểm</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <MapSidebar
          places={places}
          loading={loading}
          searchKeyword={searchKeyword}
          selectedCategory={selectedCategory}
          selectedRegion={selectedRegion}
          activePlace={activePlace}
          mobileView={mobileView}
          onSearchChange={setSearchKeyword}
          onCategoryChange={setSelectedCategory}
          onRegionChange={setSelectedRegion}
          onSelectPlace={handleSelectPlace}
        />

        <div className="flex-1 h-full relative bg-slate-900">
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

          <MapPlaceDrawer
            place={activePlace}
            onClose={() => setActivePlace(null)}
          />
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  Navigation,
  Car,
  Bike,
  Footprints,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  MapPin,
  AlertCircle
} from 'lucide-react'

export const DirectionsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const destLngParam = parseFloat(searchParams.get('destLng') || '0')
  const destLatParam = parseFloat(searchParams.get('destLat') || '0')
  const placeName = searchParams.get('name') || 'Điểm đến'
  const placeAddress = searchParams.get('address') || ''

  const [profile, setProfile] = useState<'driving' | 'cycling' | 'walking'>('driving')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [destination] = useState<[number, number]>([
    !isNaN(destLngParam) && destLngParam !== 0 ? destLngParam : 108.2022,
    !isNaN(destLatParam) && destLatParam !== 0 ? destLatParam : 16.0544
  ])

  const [distanceKm, setDistanceKm] = useState<string | null>(null)
  const [durationMin, setDurationMin] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [geoError, setGeoError] = useState<string | null>(null)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null)

  const token = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim()

  const fetchShortestRoute = async (
    start: [number, number],
    end: [number, number],
    routeProfile: 'driving' | 'cycling' | 'walking'
  ) => {
    if (!token || !mapRef.current) return
    setIsLoading(true)

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${routeProfile}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&alternatives=true&access_token=${token}`
      const res = await fetch(url)
      const data = await res.json()

      if (!data.routes || data.routes.length === 0) {
        setGeoError('Không tìm thấy tuyến đường khả dụng.')
        setIsLoading(false)
        return
      }

      // Pick route with shortest distance
      const shortestRoute = data.routes.reduce((prev: any, curr: any) =>
        prev.distance < curr.distance ? prev : curr
      )

      const dist = (shortestRoute.distance / 1000).toFixed(1)
      const dur = Math.round(shortestRoute.duration / 60)
      setDistanceKm(`${dist} km`)
      setDurationMin(dur >= 60 ? `${Math.floor(dur / 60)}h ${dur % 60}p` : `${dur} phút`)

      const map = mapRef.current
      if (map.getSource('route')) {
        ; (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: shortestRoute.geometry
        })
      } else {
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: shortestRoute.geometry
            }
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#059669',
            'line-width': 6,
            'line-opacity': 0.85
          }
        })
      }

      // Fit map bounds to whole route
      const coordinates = shortestRoute.geometry.coordinates
      const bounds = coordinates.reduce(
        (b: mapboxgl.LngLatBounds, coord: [number, number]) => b.extend(coord),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
      )
      map.fitBounds(bounds, { padding: 80 })
    } catch {
      setGeoError('Lỗi kết nối khi tìm tuyến đường.')
    } finally {
      setIsLoading(false)
    }
  }

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ định vị GPS.')
      return
    }

    setIsLoading(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const uLoc: [number, number] = [position.coords.longitude, position.coords.latitude]
        setUserLocation(uLoc)

        if (mapRef.current) {
          if (!userMarkerRef.current) {
            userMarkerRef.current = new mapboxgl.Marker({ color: '#2563eb' })
              .setLngLat(uLoc)
              .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Vị trí của bạn'))
              .addTo(mapRef.current)
          } else {
            userMarkerRef.current.setLngLat(uLoc)
          }

          fetchShortestRoute(uLoc, destination, profile)
        }
      },
      (error) => {
        setIsLoading(false)
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Bạn chưa cấp quyền truy cập vị trí. Hãy bật GPS trên trình duyệt.')
        } else {
          setGeoError('Không thể xác định vị trí hiện tại.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || !token) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: destination,
      zoom: 13
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

    map.on('load', () => {
      mapRef.current = map

      // Add Destination Marker (Red)
      destMarkerRef.current = new mapboxgl.Marker({ color: '#e11d48' })
        .setLngLat(destination)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b>${placeName}</b><br/>${placeAddress}`))
        .addTo(map)

      // Request location on load
      requestUserLocation()
    })

    return () => {
      map.remove()
    }
  }, [token])

  // Refetch route when profile changes
  const handleProfileChange = (newProfile: 'driving' | 'cycling' | 'walking') => {
    setProfile(newProfile)
    if (userLocation) {
      fetchShortestRoute(userLocation, destination, newProfile)
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 font-sans">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />


      <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-96 z-20 flex flex-col gap-3">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-4 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Navigation className="w-3.5 h-3.5 fill-emerald-700 text-emerald-700" />
              <span>Chỉ đường trực tiếp</span>
            </div>
            <Link
              to="/"
              className="text-xs font-extrabold text-slate-800 hover:text-emerald-700 transition-colors"
            >
              LangThang<span className="text-emerald-700">.</span>
            </Link>
          </div>

          {/* Place info */}
          <div className="mt-3 flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 truncate">{placeName}</h2>
              {placeAddress && (
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{placeAddress}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-3.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleProfileChange('driving')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${profile === 'driving'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Ô tô</span>
            </button>
            <button
              type="button"
              onClick={() => handleProfileChange('cycling')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${profile === 'cycling'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Xe máy</span>
            </button>
            <button
              type="button"
              onClick={() => handleProfileChange('walking')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${profile === 'walking'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Đi bộ</span>
            </button>
          </div>

          <div className="mt-3.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Lộ trình ngắn nhất
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-emerald-950">
                  {durationMin || '--'}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  ({distanceKm || '--'})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={requestUserLocation}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 shadow-2xs border border-slate-200/80 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Định vị lại vị trí của bạn"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>

          {geoError && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 leading-relaxed">
                {geoError}
                <button
                  type="button"
                  onClick={requestUserLocation}
                  className="block mt-1 font-bold underline text-rose-800 cursor-pointer"
                >
                  Thử lại định vị GPS
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Tùy chọn khác:</span>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${destination[1]},${destination[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-semibold transition-colors"
            >
              <span>Mở Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DirectionsPage

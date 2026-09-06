import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { PlaceDetailDto } from '@/types/models/place.model'

export const PlaceDetailMap = ({ place }: { place: PlaceDetailDto }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    const token = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim()
    if (!token) return

    mapboxgl.accessToken = token

    const rawLng = Number(place.longitude)
    const rawLat = Number(place.latitude)
    const hasCoordinates = !isNaN(rawLng) && !isNaN(rawLat) && rawLng !== 0 && rawLat !== 0
    const lng = hasCoordinates ? rawLng : 108.2022
    const lat = hasCoordinates ? rawLat : 16.0544

    let map: mapboxgl.Map | null = null
    let marker: mapboxgl.Marker | null = null

    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: hasCoordinates ? 14.5 : 6
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      if (hasCoordinates) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family: sans-serif; padding: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #111; margin-bottom: 2px;">${place.name}</div>
            <div style="font-size: 11px; color: #666;">${place.address}</div>
          </div>
        `)

        marker = new mapboxgl.Marker({ color: '#059669' })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map)
      }

      map.on('load', () => {
        map?.resize()
      })

      const t1 = setTimeout(() => map?.resize(), 100)
      const t2 = setTimeout(() => map?.resize(), 300)
      const t3 = setTimeout(() => map?.resize(), 600)

      mapInstanceRef.current = map

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        marker?.remove()
        map?.remove()
      }
    } catch {
    }
  }, [place])

  return (
    <div className="h-44 sm:h-52 w-full rounded-lg border border-gray-200 overflow-hidden relative shadow-xs bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}

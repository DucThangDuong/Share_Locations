export interface MapboxContext {
  id: string
  text: string
  wikidata?: string
  short_code?: string
}

export interface MapboxFeature {
  id: string
  type: string
  place_type: string[]
  relevance: number
  properties: Record<string, any>
  text: string
  place_name: string
  address?: string // House number in Mapbox
  center: [number, number] // [lng, lat]
  geometry: {
    type: string
    coordinates: [number, number]
  }
  context?: MapboxContext[]
}

export interface MapboxGeocodeResponse {
  type: string
  query: (string | number)[]
  features: MapboxFeature[]
  attribution: string
}

export interface AddressSuggestion {
  id: string
  title: string // Số nhà & Tên đường hoặc Tên địa danh
  fullAddress: string // Địa chỉ đầy đủ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành)
  center: [number, number] // [lng, lat]
  source?: 'mapbox' | 'nominatim'
}

const normalizeForMatch = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/^(tỉnh|thành phố|tp\.|tp)\s+/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Format Nominatim address object into standard Vietnamese address format
 */
const formatNominatimAddress = (item: any): { title: string; fullAddress: string } => {
  const addr = item.address || {}
  const houseNumber = addr.house_number || ''
  const road = addr.road || addr.street || addr.pedestrian || addr.footway || ''
  const amenity = addr.amenity || addr.shop || addr.tourism || addr.building || ''

  // Sub-district / Ward
  const ward = addr.suburb || addr.quarter || addr.neighbourhood || addr.village || addr.commune || ''
  // District
  const district = addr.city_district || addr.district || addr.county || addr.town || ''
  // City / Province
  const province = addr.city || addr.state || addr.province || ''

  let title = ''
  if (houseNumber && road) {
    title = `${houseNumber} ${road}`
  } else if (amenity) {
    title = amenity + (road ? `, ${road}` : '')
  } else if (road) {
    title = road
  } else {
    title = item.name || item.display_name?.split(',')[0] || ''
  }

  // Construct structured full address
  const parts: string[] = []
  if (houseNumber && road) {
    parts.push(`${houseNumber} ${road}`)
  } else if (amenity) {
    parts.push(amenity)
    if (road) parts.push(road)
  } else if (road) {
    parts.push(road)
  }

  if (ward && !parts.includes(ward)) parts.push(ward)
  if (district && !parts.includes(district)) parts.push(district)
  if (province && !parts.includes(province)) parts.push(province)
  if (addr.country && !parts.includes(addr.country)) parts.push(addr.country)

  const fullAddress = parts.length > 0 ? parts.join(', ') : item.display_name

  return {
    title: title || fullAddress.split(',')[0],
    fullAddress: fullAddress || item.display_name
  }
}

/**
 * Format Mapbox feature into standard title and fullAddress with house number
 */
const formatMapboxFeature = (
  feature: MapboxFeature,
  userTypedHouseNum?: string
): { title: string; fullAddress: string } => {
  const houseNumber = feature.address || userTypedHouseNum || ''
  let title = feature.text || ''
  let fullAddress = feature.place_name || ''

  if (houseNumber) {
    // If place_name doesn't already start with the house number
    if (!fullAddress.startsWith(houseNumber)) {
      title = `${houseNumber} ${feature.text}`
      fullAddress = `${houseNumber} ${feature.place_name}`
    } else {
      title = `${houseNumber} ${feature.text}`
    }
  }

  return { title, fullAddress }
}

export const mapboxService = {
  /**
   * Search address / POI suggestions from Mapbox + OSM Nominatim combined
   */
  async searchAddress(
    query: string,
    token: string,
    options?: {
      country?: string
      limit?: number
      proximity?: [number, number] // [lng, lat]
      signal?: AbortSignal
    }
  ): Promise<AddressSuggestion[]> {
    const trimmed = query.trim()
    if (!trimmed) return []

    // Detect if user typed a leading house number (e.g. "120 Nguyễn Thị Minh Khai", "Số 5 Hai Bà Trưng")
    const houseNumMatch = trimmed.match(/^(?:số\s+)?(\d+[a-zA-Z0-9/-]*)\s+(.+)$/i)
    const userHouseNum = houseNumMatch ? houseNumMatch[1] : undefined
    const searchQuery = trimmed

    const country = options?.country || 'vn'
    const limit = options?.limit || 8
    const lang = 'vi'

    const suggestions: AddressSuggestion[] = []
    const seenAddresses = new Set<string>()

    // 1. Fetch Mapbox Geocoding API
    const mapboxPromise = (async () => {
      if (!token || token.includes('placeholder')) return []
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${token}&country=${country}&language=${lang}&autocomplete=true&limit=${limit}`

      if (options?.proximity) {
        url += `&proximity=${options.proximity[0]},${options.proximity[1]}`
      }

      try {
        const res = await fetch(url, { signal: options?.signal })
        if (!res.ok) return []
        const data: MapboxGeocodeResponse = await res.json()
        return data.features || []
      } catch {
        return []
      }
    })()

    // 2. Fetch OpenStreetMap Nominatim for highly accurate Vietnam house numbers and streets
    const nominatimPromise = (async () => {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchQuery
      )}&format=json&addressdetails=1&limit=${limit}&countrycodes=vn&accept-language=vi`

      try {
        const res = await fetch(url, {
          signal: options?.signal,
          headers: {
            'Accept-Language': 'vi,en;q=0.9'
          }
        })
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    })()

    const [mapboxResult, nominatimResult] = await Promise.allSettled([
      mapboxPromise,
      nominatimPromise
    ])

    // Process Nominatim results first if they contain house numbers
    if (nominatimResult.status === 'fulfilled' && nominatimResult.value.length > 0) {
      for (const item of nominatimResult.value) {
        const parsed = formatNominatimAddress(item)
        const lat = parseFloat(item.lat)
        const lon = parseFloat(item.lon)
        if (isNaN(lat) || isNaN(lon)) continue

        const normKey = normalizeForMatch(parsed.fullAddress)
        if (!seenAddresses.has(normKey)) {
          seenAddresses.add(normKey)
          suggestions.push({
            id: `osm-${item.place_id || Math.random()}`,
            title: parsed.title,
            fullAddress: parsed.fullAddress,
            center: [lon, lat],
            source: 'nominatim'
          })
        }
      }
    }

    // Process Mapbox results
    if (mapboxResult.status === 'fulfilled' && mapboxResult.value.length > 0) {
      for (const feat of mapboxResult.value) {
        const parsed = formatMapboxFeature(feat, userHouseNum)
        const normKey = normalizeForMatch(parsed.fullAddress)

        // Avoid adding duplicate addresses
        if (!seenAddresses.has(normKey)) {
          seenAddresses.add(normKey)
          suggestions.push({
            id: feat.id || `mb-${Math.random()}`,
            title: parsed.title,
            fullAddress: parsed.fullAddress,
            center: feat.center,
            source: 'mapbox'
          })
        }
      }
    }

    return suggestions.slice(0, 10)
  },

  /**
   * Reverse geocode coordinates [lng, lat] to full human-readable address with house number, street, ward, district
   */
  async reverseGeocode(
    lng: number,
    lat: number,
    token: string,
    options?: {
      signal?: AbortSignal
    }
  ): Promise<{ fullAddress: string; title?: string; center: [number, number] } | null> {
    if (isNaN(lng) || isNaN(lat)) {
      return null
    }

    // 1. Query OSM Nominatim reverse geocoding (zoom 18 for building & house number level)
    const nominatimPromise = (async () => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18&accept-language=vi`
      try {
        const res = await fetch(url, {
          signal: options?.signal,
          headers: {
            'Accept-Language': 'vi,en;q=0.9'
          }
        })
        if (!res.ok) return null
        const data = await res.json()
        if (data && data.address) {
          return formatNominatimAddress(data)
        }
        return null
      } catch {
        return null
      }
    })()

    // 2. Query Mapbox reverse geocoding
    const mapboxPromise = (async () => {
      if (!token || token.includes('placeholder')) return null
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=vi&limit=5`
      try {
        const res = await fetch(url, { signal: options?.signal })
        if (!res.ok) return null
        const data: MapboxGeocodeResponse = await res.json()
        const features = data.features || []
        if (features.length === 0) return null

        // Prioritize address or poi feature that has street/house number
        const addressFeature =
          features.find(
            (f) =>
              f.place_type?.includes('address') ||
              f.place_type?.includes('poi') ||
              f.address
          ) || features[0]

        return formatMapboxFeature(addressFeature)
      } catch {
        return null
      }
    })()

    const [nominatimRes, mapboxRes] = await Promise.allSettled([
      nominatimPromise,
      mapboxPromise
    ])

    const nomResult = nominatimRes.status === 'fulfilled' ? nominatimRes.value : null
    const mbResult = mapboxRes.status === 'fulfilled' ? mapboxRes.value : null

    // If Nominatim gave a detailed address with house number or road, prioritize it
    if (nomResult && nomResult.fullAddress && nomResult.fullAddress.length > 5) {
      return {
        fullAddress: nomResult.fullAddress,
        title: nomResult.title,
        center: [lng, lat]
      }
    }

    // Otherwise use Mapbox result
    if (mbResult && mbResult.fullAddress) {
      return {
        fullAddress: mbResult.fullAddress,
        title: mbResult.title,
        center: [lng, lat]
      }
    }

    return null
  },

  /**
   * Match an address text to a province ID from the provinces list
   */
  findMatchingProvinceId(
    addressText: string,
    provinces: { id: number; name: string }[]
  ): number | null {
    if (!addressText || !provinces || provinces.length === 0) return null

    const normText = normalizeForMatch(addressText)

    for (const prov of provinces) {
      const normProv = normalizeForMatch(prov.name)
      if (!normProv) continue

      // Direct equal or substring match
      if (
        normText === normProv ||
        normText.includes(normProv) ||
        (normProv.length > 3 && normText.includes(normProv))
      ) {
        return prov.id
      }
    }

    return null
  }
}

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Navigation,
  Check,
  ShieldCheck,
  Eye,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Lock,
  LogIn,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
} from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAuth } from '@/context/AuthContext'
import { catalogService } from '@/services/catalogService'
import { geographyService } from '@/services/geographyService'
import { userService } from '@/services/userService'
import { mapboxService, type AddressSuggestion } from '@/services/mapboxService'
import type { PlaceTypeDto } from '@/types/models/place.model'
import type { ProvinceDto } from '@/types/models/geography.model'
import type { ProposalItem, PagedResultDto } from '@/types/models/userProfile.model'

export const ProposePlacePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()

  const viewId = searchParams.get('view') || searchParams.get('id')
  const passedProposal = (location.state as any)?.proposal as ProposalItem | undefined
  const isViewMode = Boolean(viewId || passedProposal)

  const [proposalData, setProposalData] = useState<ProposalItem | null>(passedProposal || null)
  const [isLoadingProposal, setIsLoadingProposal] = useState(Boolean(viewId && !passedProposal))

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [categories, setCategories] = useState<PlaceTypeDto[]>([])
  const [provinces, setProvinces] = useState<ProvinceDto[]>([])

  const [name, setName] = useState(passedProposal?.name || '')
  const [categoryId, setCategoryId] = useState<number>(passedProposal?.categoryId || 1)
  const [provinceId, setProvinceId] = useState<number>(passedProposal?.provinceId || 1)
  const [address, setAddress] = useState(passedProposal?.address || '')
  const [phone, setPhone] = useState(passedProposal?.phone || '')
  const [website, setWebsite] = useState(passedProposal?.website || '')

  // Mapbox & OSM address autocomplete & reverse geocoding states
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)

  const [lat, setLat] = useState(passedProposal?.latitude ? String(passedProposal.latitude) : '21.028500')
  const [lng, setLng] = useState(passedProposal?.longitude ? String(passedProposal.longitude) : '105.854200')
  const [isLocating, setIsLocating] = useState(false)

  const [openTime, setOpenTime] = useState('07:30')
  const [closeTime, setCloseTime] = useState('22:00')
  const [is24Hours, setIs24Hours] = useState(false)
  const [isFree, setIsFree] = useState(false)
  const [minPrice, setMinPrice] = useState('35000')
  const [maxPrice, setMaxPrice] = useState('120000')
  const [description, setDescription] = useState(passedProposal?.description || '')

  const [images, setImages] = useState<string[]>(() => {
    if (passedProposal?.mediaUrls && passedProposal.mediaUrls.length > 0) return passedProposal.mediaUrls
    if (passedProposal?.coverImg) return [passedProposal.coverImg]
    return []
  })
  const [activePreviewImgIndex, setActivePreviewImgIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const addressContainerRef = useRef<HTMLDivElement>(null)
  const searchDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchAbortControllerRef = useRef<AbortController | null>(null)
  const reverseAbortControllerRef = useRef<AbortController | null>(null)

  const mapboxToken = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() ||
    'pk.eyJ1IjoibGFuZ3RoYW5nLXZuIiwiYSI6ImNtODFhYmNkZTAxMzAya3B0eGZjcHB0ZmoifQ.placeholder'

  const applyProposalToState = (p: ProposalItem, catList: PlaceTypeDto[], provList: ProvinceDto[]) => {
    setProposalData(p)
    setName(p.name || '')
    setAddress(p.address || '')
    setPhone(p.phone || '')
    setWebsite(p.website || '')
    setDescription(p.description || '')

    if (p.categoryId) {
      setCategoryId(p.categoryId)
    } else if (p.category || p.categoryName) {
      const matchCat = catList.find((c) => c.name === p.category || c.name === p.categoryName)
      if (matchCat) setCategoryId(matchCat.id)
    }

    if (p.provinceId) {
      setProvinceId(p.provinceId)
    } else if (p.province || p.provinceName) {
      const matchProv = provList.find((pr) => pr.name === p.province || pr.name === p.provinceName)
      if (matchProv) setProvinceId(matchProv.id)
    }

    if (p.latitude) setLat(String(p.latitude))
    if (p.longitude) setLng(String(p.longitude))

    if (p.openingHours) {
      const is24 = p.openingHours.includes('24/7') || p.openingHours.includes('24h') || p.openingHours.includes('cả ngày')
      setIs24Hours(is24)
      const times = p.openingHours.match(/(\d{1,2}:\d{2})/g)
      if (times && times.length > 0) setOpenTime(times[0])
      if (times && times.length > 1) setCloseTime(times[1])
    }

    if (p.minPrice === 0 && p.maxPrice === 0) {
      setIsFree(true)
    } else {
      setIsFree(false)
      if (p.minPrice !== null && p.minPrice !== undefined) setMinPrice(String(p.minPrice))
      if (p.maxPrice !== null && p.maxPrice !== undefined) setMaxPrice(String(p.maxPrice))
    }

    const imgs = (p.mediaUrls && p.mediaUrls.length > 0) ? p.mediaUrls : p.coverImg ? [p.coverImg] : []
    setImages(imgs)
  }

  // Close address suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressContainerRef.current &&
        !addressContainerRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          catalogService.getPlaceTypes(),
          geographyService.getProvinces()
        ])
        const catList = (catRes.success && catRes.data) ? catRes.data : []
        const provList = (provRes.success && provRes.data) ? provRes.data : []

        if (catList.length > 0) {
          setCategories(catList)
          if (!passedProposal) setCategoryId(catList[0].id)
        }
        if (provList.length > 0) {
          setProvinces(provList)
          if (!passedProposal) setProvinceId(provList[0].id)
        }

        if (passedProposal) {
          applyProposalToState(passedProposal, catList, provList)
        } else if (viewId) {
          setIsLoadingProposal(true)
          try {
            const res = await userService.getMyProposals({ pageSize: 100 })
            if (res.success && res.data) {
              const items = Array.isArray(res.data)
                ? res.data
                : (res.data as PagedResultDto<ProposalItem>).items || []
              const found = items.find((item) => String(item.id) === String(viewId))
              if (found) {
                applyProposalToState(found, catList, provList)
              }
            }
          } catch {
          } finally {
            setIsLoadingProposal(false)
          }
        }
      } catch {
      }
    }

    loadMetadata()
  }, [viewId])

  // Reverse geocoding when clicking on map or dragging marker
  const handleReverseGeocode = async (targetLng: number, targetLat: number) => {
    if (reverseAbortControllerRef.current) {
      reverseAbortControllerRef.current.abort()
    }
    const controller = new AbortController()
    reverseAbortControllerRef.current = controller

    setIsReverseGeocoding(true)
    try {
      const result = await mapboxService.reverseGeocode(targetLng, targetLat, mapboxToken, {
        signal: controller.signal
      })
      if (result && result.fullAddress) {
        setAddress(result.fullAddress)
        const matchedProvId = mapboxService.findMatchingProvinceId(result.fullAddress, provinces)
        if (matchedProvId) {
          setProvinceId(matchedProvId)
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsReverseGeocoding(false)
    }
  }

  // Initialize Mapbox map instance
  useEffect(() => {
    if (!isAuthenticated || !mapContainerRef.current) return

    try {
      mapboxgl.accessToken = mapboxToken

      const parsedLat = parseFloat(lat) || 21.0285
      const parsedLng = parseFloat(lng) || 105.8542

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [parsedLng, parsedLat],
        zoom: 13
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      const marker = new mapboxgl.Marker({ draggable: !isViewMode, color: '#047857' })
        .setLngLat([parsedLng, parsedLat])
        .addTo(map)

      if (!isViewMode) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          const newLng = lngLat.lng.toFixed(6)
          const newLat = lngLat.lat.toFixed(6)
          setLng(newLng)
          setLat(newLat)
          handleReverseGeocode(lngLat.lng, lngLat.lat)
        })

        map.on('click', (e) => {
          const newLng = e.lngLat.lng.toFixed(6)
          const newLat = e.lngLat.lat.toFixed(6)
          setLng(newLng)
          setLat(newLat)
          marker.setLngLat([e.lngLat.lng, e.lngLat.lat])
          handleReverseGeocode(e.lngLat.lng, e.lngLat.lat)
        })
      }

      mapInstanceRef.current = map
      markerRef.current = marker

      return () => {
        marker.remove()
        map.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    } catch {
    }
  }, [isAuthenticated, isViewMode])

  const updateMapPosition = (newLatStr: string, newLngStr: string, zoomLevel?: number) => {
    const pLat = parseFloat(newLatStr)
    const pLng = parseFloat(newLngStr)
    if (isNaN(pLat) || isNaN(pLng)) return

    if (markerRef.current) {
      markerRef.current.setLngLat([pLng, pLat])
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [pLng, pLat],
        zoom: zoomLevel ?? mapInstanceRef.current.getZoom(),
        duration: 800
      })
    }
  }

  // Handle typing address with Mapbox Geocoding Autocomplete
  const handleAddressChange = (newVal: string) => {
    setAddress(newVal)
    if (isViewMode) return

    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current)
    }

    const query = newVal.trim()
    if (query.length < 2) {
      setAddressSuggestions([])
      setIsSuggestionsOpen(false)
      setIsSearchingAddress(false)
      return
    }

    searchDebounceTimerRef.current = setTimeout(async () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort()
      }
      const controller = new AbortController()
      searchAbortControllerRef.current = controller

      setIsSearchingAddress(true)
      try {
        const parsedLat = parseFloat(lat)
        const parsedLng = parseFloat(lng)
        const proximity = !isNaN(parsedLng) && !isNaN(parsedLat) ? [parsedLng, parsedLat] as [number, number] : undefined

        const results = await mapboxService.searchAddress(query, mapboxToken, {
          proximity,
          signal: controller.signal
        })
        setAddressSuggestions(results)
        setIsSuggestionsOpen(results.length > 0)
      } catch {
        setAddressSuggestions([])
      } finally {
        setIsSearchingAddress(false)
      }
    }, 300)
  }

  // Handle selecting an address suggestion from dropdown
  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.fullAddress)
    setIsSuggestionsOpen(false)
    setAddressSuggestions([])

    if (suggestion.center && suggestion.center.length >= 2) {
      const newLng = suggestion.center[0].toFixed(6)
      const newLat = suggestion.center[1].toFixed(6)
      setLng(newLng)
      setLat(newLat)
      updateMapPosition(newLat, newLng, 14)
    }

    const matchedProvId = mapboxService.findMatchingProvinceId(suggestion.fullAddress, provinces)
    if (matchedProvId) {
      setProvinceId(matchedProvId)
    }
  }

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Trình duyệt của bạn không hỗ trợ định vị GPS.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = pos.coords.latitude.toFixed(6)
        const currentLng = pos.coords.longitude.toFixed(6)
        setLat(currentLat)
        setLng(currentLng)
        updateMapPosition(currentLat, currentLng, 14)
        handleReverseGeocode(pos.coords.longitude, pos.coords.latitude)
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
        setErrorMsg('Không thể lấy vị trí GPS. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!e.dataTransfer.files) return
    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setImages((prev) => [...prev, reader.result as string])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index)
      if (activePreviewImgIndex >= next.length) {
        setActivePreviewImgIndex(Math.max(0, next.length - 1))
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên địa điểm bạn muốn đề xuất.')
      window.scrollTo({ top: 120, behavior: 'smooth' })
      return
    }
    if (!address.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ cụ thể của địa điểm.')
      window.scrollTo({ top: 180, behavior: 'smooth' })
      return
    }
    if (!description.trim()) {
      setErrorMsg('Vui lòng viết một vài dòng chia sẻ về điểm đặc sắc của nơi này.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await userService.createProposal({
        name: name.trim(),
        categoryId,
        provinceId,
        address: address.trim(),
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        openingHours: is24Hours ? 'Mở cửa cả ngày (24/7)' : `${openTime} – ${closeTime}`,
        minPrice: isFree ? 0 : parseInt(minPrice, 10) || 0,
        maxPrice: isFree ? 0 : parseInt(maxPrice, 10) || 0,
        latitude: parseFloat(lat) || undefined,
        longitude: parseFloat(lng) || undefined,
        description: description.trim(),
        coverImg: images[0] || undefined,
        mediaUrls: images.length > 0 ? images : undefined
      })

      if (res.success) {
        setIsSubmittedSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setErrorMsg('Không thể gửi đề xuất lúc này. Vui lòng kiểm tra lại thông tin.')
      }
    } catch {
      setErrorMsg('Có lỗi xảy ra khi gửi đề xuất. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStatusBadge = (status?: number) => {
    if (status === 1) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shrink-0 shadow-2xs">
          <CheckCircle2 size={13} className="text-emerald-700" />
          <span>Đã duyệt</span>
        </span>
      )
    }
    if (status === 2) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shrink-0 shadow-2xs">
          <AlertCircle size={13} className="text-rose-600" />
          <span>Từ chối</span>
        </span>
      )
    }
    if (status === 3) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shrink-0 shadow-2xs">
          <Clock size={13} className="text-amber-700" />
          <span>Cần bổ sung</span>
        </span>
      )
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shrink-0 shadow-2xs">
        <Clock size={13} className="text-amber-700" />
        <span>Chờ duyệt</span>
      </span>
    )
  }

  if (isLoading || isLoadingProposal) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center bg-slate-50 gap-2 font-sans">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        {isLoadingProposal && <span className="text-xs text-slate-500">Đang tải thông tin đề xuất địa điểm...</span>}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50/70 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner border border-amber-100">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Yêu cầu đăng nhập tài khoản
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn cần đăng nhập vào tài khoản LangThang để có thể gửi đề xuất địa điểm và nhận điểm cống hiến uy tín.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-left flex items-start gap-2.5 text-xs text-emerald-900">
            <div>
              <span className="font-bold">+100 điểm uy tín</span> sẽ được tự động cộng vào tài khoản khi địa điểm của bạn được duyệt.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập ngay</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Đăng ký tài khoản
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-50/70 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Gửi đề xuất thành công!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cảm ơn bạn đã đóng góp địa điểm <strong>"{name}"</strong> cho cộng đồng LangThang. Ban kiểm duyệt sẽ xem xét và công khai địa điểm trong vòng 24 giờ.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-left flex items-start gap-2.5 text-xs text-amber-900">
            <div>
              <span className="font-bold">+100 điểm cống hiến</span> sẽ được cộng vào hồ sơ cá nhân ngay khi đề xuất được duyệt.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Về trang chủ
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSubmittedSuccess(false)
                setName('')
                setAddress('')
                setDescription('')
                setImages([])
              }}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Đề xuất địa điểm khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentCategoryName = categories.find((c) => c.id === categoryId)?.name || 'Danh mục'
  const currentProvinceName = provinces.find((p) => p.id === provinceId)?.name || 'Tỉnh thành'

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Bar for View Mode */}
        {isViewMode && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Quay lại"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900">
                    Chi tiết địa điểm đề xuất
                  </h1>
                  {renderStatusBadge(proposalData?.status ?? 0)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mã đề xuất #{proposalData?.id || viewId} • Ngày gửi: {new Date(proposalData?.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Quay lại danh sách</span>
              </button>
            </div>
          </div>
        )}

        {/* Rejection / Note Callouts */}
        {isViewMode && proposalData?.status === 2 && proposalData?.rejectReason && (
          <div className="p-4.5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 shadow-2xs animate-in fade-in">
            <p className="font-bold flex items-center gap-2 text-rose-900 text-sm">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>Lý do từ chối từ Ban Quản trị:</span>
            </p>
            <p className="pl-6 text-slate-700 leading-relaxed">{proposalData.rejectReason}</p>
          </div>
        )}

        {isViewMode && proposalData?.adminNote && (
          <div className="p-4.5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 shadow-2xs animate-in fade-in">
            <p className="font-bold flex items-center gap-2 text-amber-900 text-sm">
              <Clock size={16} className="text-amber-700 shrink-0" />
              <span>Ghi chú từ Quản trị viên:</span>
            </p>
            <p className="pl-6 text-slate-700 leading-relaxed">{proposalData.adminNote}</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>1. Thông tin cơ bản & Thể loại</span>
                </h3>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tên địa điểm {!isViewMode && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      disabled={isViewMode}
                      placeholder="Ví dụ: Đồi Chè Cầu Đất, Cà phê Mây Lang Thang, Bánh Mì Phượng..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 transition-all font-medium disabled:bg-slate-100/80 disabled:cursor-default disabled:text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Danh mục {!isViewMode && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        value={categoryId}
                        disabled={isViewMode}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer disabled:bg-slate-100/80 disabled:cursor-default disabled:text-slate-800"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Tỉnh / Thành phố {!isViewMode && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        value={provinceId}
                        disabled={isViewMode}
                        onChange={(e) => setProvinceId(Number(e.target.value))}
                        className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer disabled:bg-slate-100/80 disabled:cursor-default disabled:text-slate-800"
                      >
                        {provinces.map((prov) => (
                          <option key={prov.id} value={prov.id}>
                            {prov.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative" ref={addressContainerRef}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Địa chỉ chi tiết {!isViewMode && <span className="text-rose-500">*</span>}
                      </label>
                      {isReverseGeocoding && (
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 animate-pulse bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Đang lấy địa chỉ từ bản đồ...</span>
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        disabled={isViewMode}
                        placeholder="Nhập tên đường, địa danh để tìm kiếm gợi ý Mapbox..."
                        value={address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        onFocus={() => {
                          if (addressSuggestions.length > 0 && !isViewMode) {
                            setIsSuggestionsOpen(true)
                          }
                        }}
                        className="w-full pl-9 pr-10 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-100/80 disabled:cursor-default disabled:text-slate-800 transition-all font-medium"
                      />
                      <MapPin className="w-4 h-4 text-emerald-700 absolute left-3 top-3.5 pointer-events-none" />

                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        {isSearchingAddress ? (
                          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        ) : address && !isViewMode ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAddress('')
                              setAddressSuggestions([])
                              setIsSuggestionsOpen(false)
                            }}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200/70 transition-colors cursor-pointer"
                            title="Xóa địa chỉ"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Mapbox Autocomplete Suggestions Dropdown */}
                    {isSuggestionsOpen && addressSuggestions.length > 0 && !isViewMode && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        {addressSuggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectAddressSuggestion(item)}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-500 group-hover:text-emerald-800/80 line-clamp-1">
                                {item.fullAddress}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Số điện thoại liên hệ
                      </label>
                      <input
                        type="text"
                        disabled={isViewMode}
                        placeholder="Ví dụ: 0263 3838 123"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 disabled:bg-slate-100/80 disabled:cursor-default disabled:text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Website / Fanpage
                      </label>
                      <input
                        type="text"
                        disabled={isViewMode}
                        placeholder="https://facebook.com/..."
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 disabled:bg-slate-100/80 disabled:cursor-default disabled:text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>2. Vị trí trên bản đồ</span>
                  </h3>

                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={handleGetGPSLocation}
                      disabled={isLocating}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/70"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{isLocating ? 'Đang lấy tọa độ GPS...' : 'Lấy vị trí GPS hiện tại của tôi'}</span>
                    </button>
                  )}
                </div>

                {!isViewMode && (
                  <p className="text-xs text-slate-500">
                    Click chuột vào bất kỳ điểm nào trên bản đồ hoặc kéo thả ghim màu xanh lá để tự động cập nhật tọa độ và địa chỉ chi tiết.
                  </p>
                )}

                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-72 sm:h-80 w-full shadow-inner">
                  <div ref={mapContainerRef} className="w-full h-full" />

                  {isReverseGeocoding && (
                    <div className="absolute top-3 left-3 bg-emerald-950/85 backdrop-blur-md text-emerald-200 text-[11px] font-medium px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-emerald-800 animate-in fade-in">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Đang xác định địa chỉ từ điểm chọn trên bản đồ...</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Lat: {lat} | Lng: {lng}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-medium">Vĩ độ (Latitude)</label>
                    <input
                      type="text"
                      disabled={isViewMode}
                      value={lat}
                      onChange={(e) => {
                        setLat(e.target.value)
                        updateMapPosition(e.target.value, lng)
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700 disabled:bg-slate-100/80 disabled:cursor-default"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-medium">Kinh độ (Longitude)</label>
                    <input
                      type="text"
                      disabled={isViewMode}
                      value={lng}
                      onChange={(e) => {
                        setLng(e.target.value)
                        updateMapPosition(lat, e.target.value)
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700 disabled:bg-slate-100/80 disabled:cursor-default"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>3. Thời gian hoạt động & Chi phí tham quan</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        Giờ mở cửa
                      </span>
                      <label className={`flex items-center gap-1.5 ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={isViewMode}
                          checked={is24Hours}
                          onChange={(e) => setIs24Hours(e.target.checked)}
                          className="rounded text-emerald-700 focus:ring-emerald-700 disabled:opacity-60"
                        />
                        <span className="text-xs text-slate-700 font-semibold">Mở 24/7</span>
                      </label>
                    </div>

                    {!is24Hours ? (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium">Mở cửa</span>
                          <input
                            type="time"
                            disabled={isViewMode}
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                            className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 disabled:bg-slate-100/80 disabled:cursor-default"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium">Đóng cửa</span>
                          <input
                            type="time"
                            disabled={isViewMode}
                            value={closeTime}
                            onChange={(e) => setCloseTime(e.target.value)}
                            className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 disabled:bg-slate-100/80 disabled:cursor-default"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium">
                        Địa điểm đón khách liên tục cả ngày lẫn đêm.
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                        Giá vé / Chi phí (VNĐ)
                      </span>
                      <label className={`flex items-center gap-1.5 ${isViewMode ? 'cursor-default' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={isViewMode}
                          checked={isFree}
                          onChange={(e) => setIsFree(e.target.checked)}
                          className="rounded text-emerald-700 focus:ring-emerald-700 disabled:opacity-60"
                        />
                        <span className="text-xs text-slate-700 font-semibold">Miễn phí vé</span>
                      </label>
                    </div>

                    {!isFree ? (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium">Giá tối thiểu</span>
                          <input
                            type="number"
                            disabled={isViewMode}
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder="35000"
                            className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 disabled:bg-slate-100/80 disabled:cursor-default"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium">Giá tối đa</span>
                          <input
                            type="number"
                            disabled={isViewMode}
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="120000"
                            className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 disabled:bg-slate-100/80 disabled:cursor-default"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-medium">
                        Địa điểm không thu phí vé vào cửa.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Mô tả {!isViewMode && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    rows={4}
                    disabled={isViewMode}
                    placeholder="Chia sẻ lý do nơi này đặc biệt, món ăn nên thử, góc chụp ảnh đẹp hoặc thời điểm lý tưởng để ghé thăm..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 leading-relaxed disabled:bg-slate-100/80 disabled:cursor-default disabled:text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>4. Hình ảnh địa điểm thực tế</span>
                </h3>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!isViewMode && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDropFiles}
                    className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${isDragging
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/30'
                      : 'border-slate-300 hover:border-emerald-600 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">
                        Tải ảnh từ thiết bị (Click hoặc kéo thả ảnh vào đây)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Hỗ trợ định dạng JPG, PNG, WEBP, JPEG
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <div>
                    <span className="text-xs font-bold text-slate-700 mb-2 block">
                      Danh sách ảnh ({images.length})
                    </span>
                    {images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group"
                          >
                            <img
                              src={img}
                              alt={`Ảnh ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-800/90 text-white text-[10px] font-bold">
                                Ảnh bìa chính
                              </span>
                            )}
                            {!isViewMode && (
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Xóa ảnh này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Chưa có ảnh nào được thêm.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isViewMode ? (
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Đề xuất này đang ở chế độ xem thông tin và không thể chỉnh sửa.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shrink-0"
                  >
                    <span>Quay lại</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Bằng việc gửi đề xuất, bạn xác nhận thông tin địa điểm là chính xác và tuân thủ tiêu chuẩn cộng đồng LangThang.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active-press disabled:opacity-50 shrink-0"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang gửi đề xuất...</span>
                      </>
                    ) : (
                      <>
                        <span>Gửi đề xuất địa điểm mới</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6 sticky top-20">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>Bản xem trước trực tiếp</span>
                </h3>

                <div className="group flex flex-col select-none bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs space-y-3">
                  {images.length > 0 ? (
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={images[activePreviewImgIndex] || images[0]}
                        alt={name || 'Bản xem trước'}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />

                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActivePreviewImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                            }}
                            aria-label="Ảnh trước"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 hover:opacity-100 z-10 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActivePreviewImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                            }}
                            aria-label="Ảnh sau"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white flex items-center justify-center transition-all opacity-85 hover:opacity-100 z-10 cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-xs text-[10px] font-bold text-white z-10">
                            {activePreviewImgIndex + 1}/{images.length}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-200 animate-pulse flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200/80">
                      <div className="w-12 h-12 rounded-2xl bg-slate-300/80 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium text-slate-500">Chưa có ảnh địa điểm</span>
                      <span className="text-[10px] text-slate-400">Tải ảnh lên để xem trước</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <h4 className="font-bold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug tracking-tight">
                      {name.trim() || 'Tên địa điểm đề xuất'}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span>5.0</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-slate-500 font-normal">{currentCategoryName}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{address.trim() ? `${address.trim()}, ${currentProvinceName}` : currentProvinceName}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 font-normal leading-relaxed">
                      {description.trim() || 'Mô tả về địa điểm sẽ cập nhật trực tiếp tại đây...'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{is24Hours ? 'Mở cửa 24/7' : `${openTime} - ${closeTime}`}</span>
                      <span className="font-bold text-emerald-800">
                        {isFree ? 'Miễn phí' : `${parseInt(minPrice || '0', 10).toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Quy chuẩn đóng góp địa điểm</span>
                </h3>

                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Địa điểm có thật, có vị trí chính xác trên bản đồ.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Hình ảnh chụp thực tế rõ ràng, không chứa hình mờ quảng cáo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Cung cấp mức giá và khung giờ mở cửa chính xác.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

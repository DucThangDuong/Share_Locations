import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Navigation,
  Sparkles,
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
  ChevronRight
} from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAuth } from '@/context/AuthContext'
import { catalogService } from '@/services/catalogService'
import { geographyService } from '@/services/geographyService'
import { userService } from '@/services/userService'
import type { PlaceTypeDto } from '@/types/models/place.model'
import type { ProvinceDto } from '@/types/models/geography.model'
import { provinceOptions, categoryOptions } from '@/types/models/userProfile.model'

export const ProposePlacePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [categories, setCategories] = useState<PlaceTypeDto[]>([])
  const [provinces, setProvinces] = useState<ProvinceDto[]>([])

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number>(1)
  const [provinceId, setProvinceId] = useState<number>(1)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')

  const [lat, setLat] = useState('21.028500')
  const [lng, setLng] = useState('105.854200')
  const [isLocating, setIsLocating] = useState(false)

  const [openTime, setOpenTime] = useState('07:30')
  const [closeTime, setCloseTime] = useState('22:00')
  const [is24Hours, setIs24Hours] = useState(false)
  const [isFree, setIsFree] = useState(false)
  const [minPrice, setMinPrice] = useState('35000')
  const [maxPrice, setMaxPrice] = useState('120000')
  const [description, setDescription] = useState('')

  const [images, setImages] = useState<string[]>([])
  const [activePreviewImgIndex, setActivePreviewImgIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const mapboxToken = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() ||
    'pk.eyJ1IjoibGFuZ3RoYW5nLXZuIiwiYSI6ImNtODFhYmNkZTAxMzAya3B0eGZjcHB0ZmoifQ.placeholder'

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          catalogService.getPlaceTypes(),
          geographyService.getProvinces()
        ])
        if (catRes.success && catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data)
          setCategoryId(catRes.data[0].id)
        }
        if (provRes.success && provRes.data && provRes.data.length > 0) {
          setProvinces(provRes.data)
          setProvinceId(provRes.data[0].id)
        }
      } catch {
      }
    }

    loadMetadata()
  }, [])

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
        zoom: 12
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      const marker = new mapboxgl.Marker({ draggable: true, color: '#047857' })
        .setLngLat([parsedLng, parsedLat])
        .addTo(map)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        setLng(lngLat.lng.toFixed(6))
        setLat(lngLat.lat.toFixed(6))
      })

      map.on('click', (e) => {
        const newLng = e.lngLat.lng.toFixed(6)
        const newLat = e.lngLat.lat.toFixed(6)
        setLng(newLng)
        setLat(newLat)
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat])
      })

      mapInstanceRef.current = map
      markerRef.current = marker

      return () => {
        marker.remove()
        map.remove()
      }
    } catch {
    }
  }, [isAuthenticated])

  const updateMapPosition = (newLatStr: string, newLngStr: string) => {
    const pLat = parseFloat(newLatStr)
    const pLng = parseFloat(newLngStr)
    if (isNaN(pLat) || isNaN(pLng)) return

    if (markerRef.current) {
      markerRef.current.setLngLat([pLng, pLat])
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [pLng, pLat], zoom: 13, duration: 1000 })
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
        updateMapPosition(currentLat, currentLng)
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

  if (isLoading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
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
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
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
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">+100 điểm cống hiến</span> sẽ được cộng vào hồ sơ cá nhân ngay khi đề xuất được duyệt.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/profile?tab=proposals')}
              className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Xem trong Hồ sơ
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

  const currentCategoryName = categories.find((c) => c.id === categoryId)?.name || categoryOptions[0].name
  const currentProvinceName = provinces.find((p) => p.id === provinceId)?.name || provinceOptions[0]

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
                      Tên địa điểm / Quán ăn / Thắng cảnh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đồi Chè Cầu Đất, Cà phê Mây Lang Thang, Bánh Mì Phượng..."
                      value={name}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Danh mục chính <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                      >
                        {categories.length > 0
                          ? categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))
                          : categoryOptions.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.type})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Tỉnh / Thành phố <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={provinceId}
                        onChange={(e) => setProvinceId(Number(e.target.value))}
                        className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 cursor-pointer"
                      >
                        {provinces.length > 0
                          ? provinces.map((prov) => (
                            <option key={prov.id} value={prov.id}>
                              {prov.name}
                            </option>
                          ))
                          : provinceOptions.map((prov, pIdx) => (
                            <option key={pIdx + 1} value={pIdx + 1}>
                              {prov}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Địa chỉ chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Số điện thoại liên hệ (tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 0263 3838 123"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Website / Fanpage (tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="https://facebook.com/..."
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>2. Chọn vị trí chính xác trên Bản đồ tương tác</span>
                  </h3>

                  <button
                    type="button"
                    onClick={handleGetGPSLocation}
                    disabled={isLocating}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/70"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isLocating ? 'Đang lấy tọa độ GPS...' : 'Lấy vị trí GPS hiện tại của tôi'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Click chuột vào bất kỳ điểm nào trên bản đồ hoặc kéo thả ghim màu xanh lá để cập nhật tọa độ chính xác.
                </p>

                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-72 sm:h-80 w-full shadow-inner">
                  <div ref={mapContainerRef} className="w-full h-full" />

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
                      value={lat}
                      onChange={(e) => {
                        setLat(e.target.value)
                        updateMapPosition(e.target.value, lng)
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-medium">Kinh độ (Longitude)</label>
                    <input
                      type="text"
                      value={lng}
                      onChange={(e) => {
                        setLng(e.target.value)
                        updateMapPosition(lat, e.target.value)
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-700"
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
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={is24Hours}
                          onChange={(e) => setIs24Hours(e.target.checked)}
                          className="rounded text-emerald-700 focus:ring-emerald-700"
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
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                            className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium">Đóng cửa</span>
                          <input
                            type="time"
                            value={closeTime}
                            onChange={(e) => setCloseTime(e.target.value)}
                            className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
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
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFree}
                          onChange={(e) => setIsFree(e.target.checked)}
                          className="rounded text-emerald-700 focus:ring-emerald-700"
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
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder="35000"
                            className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium">Giá tối đa</span>
                          <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="120000"
                            className="w-full p-2 mt-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-700"
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
                    Mô tả đặc sắc & Kinh nghiệm tham quan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Chia sẻ lý do nơi này đặc biệt, món ăn nên thử, góc chụp ảnh đẹp hoặc thời điểm lý tưởng để ghé thăm..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-700 leading-relaxed"
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

                <div className="space-y-4 pt-2">
                  <div>
                    <span className="text-xs font-bold text-slate-700 mb-2 block">
                      Danh sách ảnh đã thêm ({images.length})
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
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Xóa ảnh này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Chưa có ảnh nào được thêm. Hãy chọn hoặc kéo thả ảnh vào khung phía trên.
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                      <Sparkles className="w-4 h-4" />
                      <span>Gửi đề xuất địa điểm mới</span>
                    </>
                  )}
                </button>
              </div>
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

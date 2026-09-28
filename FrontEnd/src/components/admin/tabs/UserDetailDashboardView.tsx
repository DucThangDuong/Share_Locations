import React, { useState, useEffect } from 'react'
import type { AdminUserItem, AdminUserDetail, AdminUserActivities, AdminUserAccessHistoryItem } from '@/types/admin.types'
import { isUserSystemAdmin } from '@/utils/authUtils'
import { adminService, extractList } from '@/services/adminService'
import { catalogService } from '@/services/catalogService'
import { geographyService } from '@/services/geographyService'
import type { PlaceTypeDto } from '@/types/models/place.model'
import type { ProvinceDto } from '@/types/models/geography.model'
import {
  ArrowLeft,
  Calendar,
  FileText,
  Edit3,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Shield,
  ShieldCheck,
  Users,
  Check,
  MapPin,
  Tag,
  Star,
  BookOpen,
  Navigation,
  Sparkles,
  Activity,
  CheckCircle2,
  Lock,
  Save,
  Loader2,
  Power
} from 'lucide-react'

interface UserDetailDashboardViewProps {
  user: AdminUserItem
  onBack: () => void
  showToast?: (msg: string) => void
}

type DetailTab = 'scopes' | 'places' | 'logs' | 'reviews' | 'blogs' | 'trips' | 'proposals'

export const UserDetailDashboardView: React.FC<UserDetailDashboardViewProps> = ({
  user,
  onBack,
  showToast
}) => {
  const viewerIsSystemAdmin = isUserSystemAdmin()

  // Dynamic Data States from API
  const [categoriesList, setCategoriesList] = useState<PlaceTypeDto[]>([])
  const [provincesList, setProvincesList] = useState<ProvinceDto[]>([])
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null)
  const [userActivities, setUserActivities] = useState<AdminUserActivities | null>(null)
  const [accessHistory, setAccessHistory] = useState<AdminUserAccessHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingScopes, setIsSavingScopes] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Roles determination
  const rolesUpper = (userDetail?.roles || user.roles || []).map((r) => String(r).toUpperCase())
  const isCategoryAdmin = rolesUpper.includes('CATEGORY_ADMIN') || rolesUpper.includes('ADMIN_LEVEL_1')
  const isSystemAdmin = rolesUpper.includes('SYSTEM_ADMIN') || rolesUpper.includes('ADMIN') || rolesUpper.includes('SUPERADMIN')
  const isTargetAdmin = isCategoryAdmin || isSystemAdmin

  const roleName = isSystemAdmin
    ? 'System Administrator'
    : isCategoryAdmin
      ? 'Admin Cấp 1'
      : 'Thành viên cộng đồng'

  // Selected scopes state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    user.categoryScopes?.map((c) => c.categoryId) || []
  )

  const [selectedProvinceIds, setSelectedProvinceIds] = useState<number[]>(
    user.provinceScopes?.map((p) => p.provinceId) || []
  )

  // Dropdown open states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isProvinceDropdownOpen, setIsProvinceDropdownOpen] = useState(false)

  // Unified Tab State
  const [activeTab, setActiveTab] = useState<DetailTab>(isTargetAdmin ? 'scopes' : 'reviews')
  const [searchQuery, setSearchQuery] = useState('')

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return '--'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return isoString
    }
  }

  // Load All Data from API
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      try {
        // 1. Fetch master lists for categories & provinces
        const [catRes, provRes] = await Promise.allSettled([
          catalogService.getPlaceTypes(),
          geographyService.getProvinces()
        ])

        if (isMounted) {
          if (catRes.status === 'fulfilled' && catRes.value?.data) {
            setCategoriesList(catRes.value.data)
          }
          if (provRes.status === 'fulfilled' && provRes.value?.data) {
            setProvincesList(provRes.value.data)
          }
        }

        // 2. Fetch User Detail from BE: GET /api/admin/users/{userId}
        try {
          const detailRes = await adminService.getUserDetail(user.userId)
          const detailData = (detailRes as any)?.data || detailRes
          if (isMounted && detailData) {
            setUserDetail(detailData)
            if (Array.isArray(detailData.categoryScopes)) {
              setSelectedCategoryIds(detailData.categoryScopes.map((c: any) => c.categoryId))
            }
            if (Array.isArray(detailData.provinceScopes)) {
              setSelectedProvinceIds(detailData.provinceScopes.map((p: any) => p.provinceId))
            }
          }
        } catch {
          // Fallback to initial prop if API call fails
          if (isMounted) {
            setUserDetail({
              userId: user.userId,
              email: user.email,
              fullName: user.fullName,
              phoneNumber: user.phoneNumber,
              avatarUrl: user.avatarUrl,
              status: user.status,
              createdAt: user.createdAt,
              roles: user.roles || [],
              categoryScopes: user.categoryScopes,
              provinceScopes: user.provinceScopes,
              regionScopes: user.regionScopes
            })
          }
        }

        // 3. Fetch User Activities: GET /api/admin/users/{userId}/activities
        try {
          const actRes = await adminService.getUserActivities(user.userId)
          const actData = (actRes as any)?.data || actRes
          if (isMounted && actData) {
            setUserActivities(actData)
          }
        } catch {
          // Empty activities on error
          if (isMounted) setUserActivities({ reviews: [], blogs: [], trips: [], proposals: [] })
        }

        // 4. Fetch Admin Access History (if Admin): GET /api/admin/users/{userId}/access-history
        if (isTargetAdmin) {
          try {
            const histRes = await adminService.getUserAccessHistory(user.userId)
            const histData = extractList<AdminUserAccessHistoryItem>(histRes)
            if (isMounted) {
              setAccessHistory(histData)
            }
          } catch {
            if (isMounted) setAccessHistory([])
          }
        }
      } catch (err: any) {
        showToast?.(err?.message || 'Lỗi khi tải dữ liệu tài khoản từ hệ thống.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user.userId, isTargetAdmin])

  // Toggle Category Checkbox
  const toggleCategory = (catId: number) => {
    if (!viewerIsSystemAdmin) {
      showToast?.('Chỉ System Admin mới có quyền điều chỉnh phân quyền danh mục.')
      return
    }
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  // Toggle Province Checkbox
  const toggleProvince = (provId: number) => {
    if (!viewerIsSystemAdmin) {
      showToast?.('Chỉ System Admin mới có quyền điều chỉnh phân quyền tỉnh thành.')
      return
    }
    setSelectedProvinceIds((prev) =>
      prev.includes(provId) ? prev.filter((id) => id !== provId) : [...prev, provId]
    )
  }

  // Handle Save Scopes via API: PUT /api/admin/users/{userId}/scopes
  const handleSaveScopes = async () => {
    if (!viewerIsSystemAdmin) {
      showToast?.('Chỉ System Admin mới có quyền cập nhật phân quyền.')
      return
    }

    setIsSavingScopes(true)
    try {
      await adminService.updateUserScopes(user.userId, {
        categoryIds: selectedCategoryIds,
        provinceIds: selectedProvinceIds,
        note: `Cập nhật phân quyền bởi ${viewerIsSystemAdmin ? 'System Admin' : 'Quản trị viên'}`
      })
      showToast?.(
        `Đã lưu phân quyền cho ${userDetail?.fullName || user.fullName}: ${selectedCategoryIds.length} danh mục, ${selectedProvinceIds.length} tỉnh thành.`
      )
    } catch (err: any) {
      showToast?.(err?.response?.data?.message || err?.message || 'Cập nhật phân quyền thất bại.')
    } finally {
      setIsSavingScopes(false)
    }
  }

  // Handle Update Status via API: PATCH /api/admin/users/{userId}/status
  const handleToggleStatus = async () => {
    const currentStatus = String(userDetail?.status ?? user.status)
    const newStatus = currentStatus === '1' || currentStatus.toUpperCase() === 'ACTIVE' ? '0' : '1'
    const statusText = newStatus === '1' ? 'Mở khóa hoạt động' : 'Tạm khóa'

    setIsUpdatingStatus(true)
    try {
      await adminService.updateUserStatus(user.userId, newStatus, `${statusText} tài khoản người dùng`)
      setUserDetail((prev) => (prev ? { ...prev, status: newStatus } : null))
      showToast?.(`Đã ${statusText.toLowerCase()} tài khoản thành công.`)
    } catch (err: any) {
      showToast?.(err?.response?.data?.message || err?.message || 'Cập nhật trạng thái thất bại.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Scopes Table Rows
  const adminScopeRows = [
    ...selectedCategoryIds.map((catId) => {
      const cat = categoriesList.find((c) => c.id === catId)
      return {
        id: `CAT-${1000 + catId}`,
        name: cat?.name || `Danh mục #${catId}`,
        type: 'Danh mục quản lý',
        location: 'Áp dụng toàn bộ tỉnh phụ trách',
        status: 'Đã kích hoạt',
        assignedDate: formatDate(userDetail?.createdAt || user.createdAt),
        expiry: 'Vô thời hạn',
        isCategory: true
      }
    }),
    ...selectedProvinceIds.map((provId) => {
      const prov = provincesList.find((p) => p.id === provId)
      return {
        id: `PROV-${4000 + provId}`,
        name: prov?.name || `Tỉnh #${provId}`,
        type: 'Địa bàn phụ trách',
        location: prov?.regionName || 'Toàn quốc',
        status: 'Đã kích hoạt',
        assignedDate: formatDate(userDetail?.createdAt || user.createdAt),
        expiry: 'Vô thời hạn',
        isCategory: false
      }
    })
  ]

  // Assigned Provinces Cards Data
  const assignedProvincesData = selectedProvinceIds.map((provId) => {
    const prov = provincesList.find((p) => p.id === provId)
    return {
      provinceId: provId,
      name: prov?.name || `Tỉnh #${provId}`,
      region: prov?.regionName || 'Toàn quốc',
      managedCategories: selectedCategoryIds
        .map((cId) => categoriesList.find((c) => c.id === cId)?.name)
        .filter(Boolean)
        .join(', '),
      status: 'Đang quản trị'
    }
  })

  // Real activities data from API
  const reviewsList = userActivities?.reviews || []
  const blogsList = userActivities?.blogs || []
  const tripsList = userActivities?.trips || []
  const proposalsList = userActivities?.proposals || []

  return (
    <div className="space-y-6 font-sans antialiased text-slate-800 animate-in fade-in duration-200">
      {/* ── TOP HEADER / BREADCRUMB ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Quay lại danh sách tài khoản"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Chi tiết tài khoản
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold border ${isSystemAdmin
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : isCategoryAdmin
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
              >
                {roleName}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mã người dùng: #{userDetail?.userId || user.userId} • Đăng ký ngày{' '}
              {formatDate(userDetail?.createdAt || user.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
            <Calendar size={14} className="text-slate-400" />
            <span>01/01/2026 - {formatDate(new Date().toISOString())}</span>
          </div>

          <a
            href={`/user/${user.userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-teal-700 hover:text-teal-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <FileText size={14} />
            <span>XEM TRANG CÁ NHÂN</span>
          </a>

          {viewerIsSystemAdmin && isTargetAdmin && (
            <button
              type="button"
              disabled={isSavingScopes}
              onClick={handleSaveScopes}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isSavingScopes ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>LƯU PHÂN QUYỀN</span>
            </button>
          )}

          {/* Quick Lock / Unlock Status button */}
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${String(userDetail?.status ?? user.status) === '1' ||
              String(userDetail?.status ?? user.status).toUpperCase() === 'ACTIVE'
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            title="Đổi trạng thái khóa / hoạt động"
          >
            <Power size={13} />
            <span>
              {String(userDetail?.status ?? user.status) === '1' ||
                String(userDetail?.status ?? user.status).toUpperCase() === 'ACTIVE'
                ? 'Khóa tài khoản'
                : 'Mở khóa'}
            </span>
          </button>
        </div>
      </div>

      {/* ── USER PROFILE BANNER CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          {userDetail?.avatarUrl || user.avatarUrl ? (
            <img
              src={userDetail?.avatarUrl || user.avatarUrl || ''}
              alt={userDetail?.fullName || user.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-700 font-extrabold text-2xl flex items-center justify-center border-2 border-slate-200 shrink-0 shadow-sm">
              {(userDetail?.fullName || user.fullName || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                {userDetail?.fullName || user.fullName || 'Chưa đặt tên'}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${String(userDetail?.status ?? user.status) === '1' ||
                  String(userDetail?.status ?? user.status).toUpperCase() === 'ACTIVE'
                  ? 'bg-teal-50 text-teal-700 border-teal-200/80'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
              >
                {String(userDetail?.status ?? user.status) === '1' ||
                  String(userDetail?.status ?? user.status).toUpperCase() === 'ACTIVE'
                  ? 'Đang hoạt động'
                  : 'Đã bị khóa'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-xs text-slate-500 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Email address:</span>
                <span className="font-bold text-slate-900 truncate block">
                  {userDetail?.email || user.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone number:</span>
                <span className="font-bold text-slate-900 truncate block">
                  {userDetail?.phoneNumber || user.phoneNumber || '(Chưa cập nhật)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role & Privileges Mini Card on right */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 min-w-[260px] shrink-0 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Cấp bậc
          </span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
              {isSystemAdmin ? <ShieldCheck size={20} /> : isCategoryAdmin ? <Shield size={20} /> : <Users size={20} />}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{roleName}</h4>
              <p className="text-[11px] text-teal-700 font-semibold truncate">
                {isSystemAdmin
                  ? 'Toàn quyền quản trị'
                  : isCategoryAdmin
                    ? `${selectedCategoryIds.length} danh mục • ${selectedProvinceIds.length} tỉnh`
                    : 'Đóng góp nội dung'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONDITIONAL SECTION: ADMIN SCOPE ASSIGNMENT CONTROL ── */}
      {isTargetAdmin && (
        <div className="bg-white rounded-2xl border border-teal-200/80 bg-gradient-to-b from-teal-50/30 to-white p-6 shadow-2xs space-y-5">
          {/* Header & Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-teal-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-teal-700" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Phạm vi phân quyền quản trị (Admin Scope Configuration)
                </h3>
              </div>
              <p className="text-xs text-teal-800 font-medium">
                Thêm quyền này cho người dùng, áp dụng vô luôn tỉnh (Hệ thống sẽ đồng bộ quyền phê duyệt danh mục tại tất cả các tỉnh thành được chọn bên dưới).
              </p>
            </div>

            {viewerIsSystemAdmin ? (
              <button
                type="button"
                disabled={isSavingScopes}
                onClick={handleSaveScopes}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 self-start md:self-auto"
              >
                {isSavingScopes ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Áp dụng phân quyền</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium border border-amber-200 shrink-0">
                <Lock size={13} />
                <span>Chỉ System Admin có quyền sửa</span>
              </div>
            )}
          </div>

          {/* 2 Select / Dropdown Columns: Category & Province */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. SELECT LỰA CHỌN DANH MỤC */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag size={14} className="text-teal-600" />
                  <span>1. Lựa chọn Danh mục phân quyền:</span>
                </label>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Đã chọn {selectedCategoryIds.length}/{categoriesList.length || 0} danh mục
                </span>
              </div>

              {/* Dropdown Box Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-teal-500 rounded-xl text-xs text-slate-700 font-medium shadow-2xs transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {selectedCategoryIds.length > 0 ? (
                      selectedCategoryIds.map((id) => (
                        <span
                          key={id}
                          className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md font-bold text-2xs"
                        >
                          {categoriesList.find((c) => c.id === id)?.name || `ID #${id}`}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Chưa cấp quyền danh mục nào...</span>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180 text-teal-600' : ''
                      }`}
                  />
                </button>

                {/* Dropdown Options List */}
                {isCategoryDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-lg space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="text-[11px] font-bold text-slate-400 px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                      <span>Tích chọn để cấp quyền danh mục:</span>
                      {viewerIsSystemAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCategoryIds(
                              selectedCategoryIds.length === categoriesList.length
                                ? []
                                : categoriesList.map((c) => c.id)
                            )
                          }
                          className="text-teal-700 hover:underline cursor-pointer text-2xs"
                        >
                          {selectedCategoryIds.length === categoriesList.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </button>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1 pt-1">
                      {categoriesList.map((cat) => {
                        const isChecked = selectedCategoryIds.includes(cat.id)
                        return (
                          <div
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg text-xs transition-colors cursor-pointer ${isChecked
                              ? 'bg-teal-50/80 text-teal-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                              }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isChecked
                                ? 'bg-teal-600 border-teal-600 text-white'
                                : 'border-slate-300 bg-white'
                                }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="flex-1">{cat.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">ID #{cat.id}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. SELECT LỰA CHỌN TỈNH THÀNH */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-teal-600" />
                  <span>2. Lựa chọn Tỉnh / Thành phố phụ trách:</span>
                </label>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Đã phân công {selectedProvinceIds.length}/{provincesList.length || 0} tỉnh
                </span>
              </div>

              {/* Dropdown Box Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProvinceDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-teal-500 rounded-xl text-xs text-slate-700 font-medium shadow-2xs transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {selectedProvinceIds.length > 0 ? (
                      selectedProvinceIds.slice(0, 4).map((id) => (
                        <span
                          key={id}
                          className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-2xs"
                        >
                          {provincesList.find((p) => p.id === id)?.name || `ID #${id}`}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Chưa gán tỉnh thành nào...</span>
                    )}
                    {selectedProvinceIds.length > 4 && (
                      <span className="text-2xs font-bold text-teal-700">
                        +{selectedProvinceIds.length - 4} tỉnh khác
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isProvinceDropdownOpen ? 'rotate-180 text-teal-600' : ''
                      }`}
                  />
                </button>

                {/* Dropdown Options List */}
                {isProvinceDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-lg space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="text-[11px] font-bold text-slate-400 px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                      <span>Tích chọn để gán địa bàn quản lý:</span>
                      {viewerIsSystemAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProvinceIds(
                              selectedProvinceIds.length === provincesList.length
                                ? []
                                : provincesList.map((p) => p.id)
                            )
                          }
                          className="text-teal-700 hover:underline cursor-pointer text-2xs"
                        >
                          {selectedProvinceIds.length === provincesList.length ? 'Bỏ chọn hết' : 'Chọn toàn quốc'}
                        </button>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                      {provincesList.map((prov) => {
                        const isChecked = selectedProvinceIds.includes(prov.id)
                        return (
                          <div
                            key={prov.id}
                            onClick={() => toggleProvince(prov.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors cursor-pointer ${isChecked
                              ? 'bg-amber-50/80 text-amber-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                              }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${isChecked
                                ? 'bg-teal-600 border-teal-600 text-white'
                                : 'border-slate-300 bg-white'
                                }`}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="truncate block">{prov.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{prov.regionName}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOWER CONTENT TABS CONTAINER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-6 space-y-5">
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto text-xs font-bold">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* TABS FOR ADMIN MANAGEMENT */}
            {isTargetAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('scopes')}
                  className={`pb-3 -mb-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'scopes'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Tag size={14} />
                  <span>Phạm vi phân quyền ({adminScopeRows.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('places')}
                  className={`pb-3 -mb-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'places'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <MapPin size={14} />
                  <span>Địa điểm phụ trách ({selectedProvinceIds.length} tỉnh)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className={`pb-3 -mb-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'logs'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Activity size={14} />
                  <span>Lịch sử hoạt động ({accessHistory.length})</span>
                </button>

                {/* Visual Divider between Admin Management & User Contributions */}
                <div className="h-4 w-px bg-slate-200 self-center hidden sm:block" />
              </>
            )}

            {/* TABS FOR USER CONTRIBUTIONS (Accessible to both regular users and admins) */}
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 -mb-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'reviews'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <Star size={14} />
              <span>Đánh giá ({reviewsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('blogs')}
              className={`pb-3 -mb-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'blogs'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <BookOpen size={14} />
              <span>Bài viết &amp; Cẩm nang ({blogsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trips')}
              className={`pb-3 -mb-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'trips'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <Navigation size={14} />
              <span>Chuyến đi ({tripsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('proposals')}
              className={`pb-3 -mb-3 transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'proposals'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <Sparkles size={14} />
              <span>Đề xuất ({proposalsList.length})</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung / hồ sơ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-teal-600 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={13} />
              <span>Sort by</span>
            </button>

            {isTargetAdmin && viewerIsSystemAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsCategoryDropdownOpen(true)
                  showToast?.('Đã mở bộ chọn để gán phân quyền mới.')
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Gán phân quyền mới</span>
                <ChevronDown size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-teal-600" />
            <span className="text-xs">Đang tải dữ liệu tài khoản từ hệ thống...</span>
          </div>
        )}

        {/* ── TAB CONTENT RENDERING ── */}

        {/* 1. ADMIN TAB: PHẠM VI PHÂN QUYỀN */}
        {!isLoading && activeTab === 'scopes' && (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-xl border border-slate-100 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-white z-10 shadow-2xs border-b border-slate-200">
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center bg-slate-50/90 backdrop-blur-xs">
                    <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-0" />
                  </th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Mã hồ sơ</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Đối tượng / Danh mục</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Loại hình</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Khu vực / Tỉnh</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Trạng thái</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Ngày giao</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Hạn quyền</th>
                  <th className="py-3 px-4 text-right bg-slate-50/90 backdrop-blur-xs">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                {adminScopeRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Chưa có phân quyền nào được thiết lập
                    </td>
                  </tr>
                ) : (
                  adminScopeRows
                    .filter((row) =>
                      !searchQuery.trim()
                        ? true
                        : row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        row.id.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3 text-center">
                          <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-0" />
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">{row.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${row.isCategory ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
                                }`}
                            >
                              {row.isCategory ? <Tag size={13} /> : <MapPin size={13} />}
                            </div>
                            <span className="font-bold text-slate-900">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{row.type}</td>
                        <td className="py-3.5 px-4 text-slate-600">{row.location}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{row.assignedDate}</td>
                        <td className="py-3.5 px-4 text-slate-500">{row.expiry}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => showToast?.(`Đang quản lý phạm vi ${row.name}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-2xs transition-colors cursor-pointer"
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. ADMIN TAB: ĐỊA ĐIỂM PHỤ TRÁCH */}
        {!isLoading && activeTab === 'places' && (
          <div className="space-y-4">
            {assignedProvincesData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có tỉnh thành phụ trách nào được phân công.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedProvincesData
                  .filter((prov) =>
                    !searchQuery.trim()
                      ? true
                      : prov.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      prov.region.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((prov) => (
                    <div
                      key={prov.provinceId}
                      className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{prov.name}</h4>
                            <span className="text-[11px] text-slate-400">{prov.region}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {prov.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
                        <div className="pt-1 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-600">Danh mục quản lý: </span>
                          <span className="text-teal-800">{prov.managedCategories || 'Tất cả danh mục'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 3. ADMIN TAB: LỊCH SỬ HOẠT ĐỘNG (ACCESS HISTORY) */}
        {!isLoading && activeTab === 'logs' && (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-xl border border-slate-100 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-white z-10 shadow-2xs border-b border-slate-200">
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Mã nhật ký</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Hành động kiểm duyệt</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Đối tượng tác động</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Danh mục &amp; Tỉnh</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Thời gian</th>
                  <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Kết quả</th>
                  <th className="py-3 px-4 text-right bg-slate-50/90 backdrop-blur-xs">IP Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                {accessHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chưa ghi nhận lịch sử hoạt động nào của quản trị viên này
                    </td>
                  </tr>
                ) : (
                  accessHistory
                    .filter((log) =>
                      !searchQuery.trim()
                        ? true
                        : (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (log.targetName || log.target || '').toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((log, idx) => (
                      <tr key={log.id || log.logId || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{log.logId || `#LOG-${idx + 1}`}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{log.action}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">{log.targetName || log.target || '--'}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {log.category || 'Hệ thống'} • <strong className="text-slate-700">{log.province || 'Toàn quốc'}</strong>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(log.timestamp || log.time)}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            <span>{log.result || 'Thành công'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                          {log.ipAddress || log.ip || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. USER TAB: HÌNH ẢNH & ĐÁNH GIÁ */}
        {!isLoading && activeTab === 'reviews' && (
          <div className="space-y-3">
            {reviewsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có đánh giá nào được gửi từ tài khoản này.
              </div>
            ) : (
              reviewsList
                .filter((r) =>
                  !searchQuery.trim()
                    ? true
                    : (r.placeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (r.content || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-200 bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{rev.placeName}</h4>
                        <span className="text-[11px] text-slate-400">
                          {rev.category ? `• ${rev.category}` : ''} {rev.province ? `• ${rev.province}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Star size={12} fill="currentColor" />
                        <span>{rev.rating}.0 / 5.0</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">{rev.content}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Ngày đăng: {formatDate(rev.createdAt)} • {rev.likes || 0} lượt thích</span>
                      <span className="font-bold text-emerald-600">{String(rev.status) === '1' ? 'Công khai' : rev.status || 'Active'}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* 5. USER TAB: BÀI VIẾT & CẨM NANG */}
        {!isLoading && activeTab === 'blogs' && (
          <div className="space-y-3">
            {blogsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có bài viết hay cẩm nang du lịch nào được tạo.
              </div>
            ) : (
              blogsList
                .filter((b) =>
                  !searchQuery.trim()
                    ? true
                    : (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (b.category || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((blog) => (
                  <div
                    key={blog.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-200 bg-white shadow-2xs flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-2xs font-bold">
                          {blog.category || 'Cẩm nang'}
                        </span>
                        <span className="text-2xs text-slate-400">{blog.readTime || '5 phút đọc'}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">{blog.title}</h4>
                      <p className="text-xs text-slate-400">
                        Xuất bản ngày: {formatDate(blog.publishedAt)} • {blog.views || 0} lượt xem • {blog.likes || 0} lượt yêu thích
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold shrink-0">
                      {String(blog.status) === '1' ? 'Đã xuất bản' : blog.status || 'Published'}
                    </span>
                  </div>
                ))
            )}
          </div>
        )}

        {/* 6. USER TAB: CHUYẾN ĐI CÔNG KHAI */}
        {!isLoading && activeTab === 'trips' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tripsList.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                Chưa có chuyến đi công khai nào được chia sẻ.
              </div>
            ) : (
              tripsList
                .filter((t) =>
                  !searchQuery.trim() ? true : (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((trip) => (
                  <div
                    key={trip.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50/50 hover:bg-white shadow-2xs transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-2xs font-bold">
                        {trip.duration || 'Lịch trình du lịch'}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        {String(trip.status) === '1' ? 'Công khai' : trip.status || 'Public'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{trip.title}</h4>
                    <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>{trip.placesCount || 0} địa điểm tham quan</span>
                      <span>{trip.likes || 0} lượt lưu</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* 7. USER TAB: ĐỀ XUẤT ĐỊA ĐIỂM */}
        {!isLoading && activeTab === 'proposals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã đề xuất</th>
                  <th className="py-3 px-4">Tên địa điểm đề xuất</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Tỉnh thành</th>
                  <th className="py-3 px-4">Ngày gửi</th>
                  <th className="py-3 px-4 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {proposalsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Chưa có đề xuất địa điểm nào từ tài khoản này
                    </td>
                  </tr>
                ) : (
                  proposalsList
                    .filter((p) =>
                      !searchQuery.trim()
                        ? true
                        : (p.placeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.province || '').toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((prop) => (
                      <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">#PROP-{prop.id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{prop.placeName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{prop.category || 'Địa điểm'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{prop.province || 'Toàn quốc'}</td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(prop.submittedAt)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border ${String(prop.status) === '1' || prop.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : String(prop.status) === '0' || prop.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                          >
                            {String(prop.status) === '1'
                              ? 'Đã duyệt'
                              : String(prop.status) === '0'
                                ? 'Chờ duyệt'
                                : 'Từ chối'}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDetailDashboardView

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AdminUserItem, AdminUserDetail, AdminUserActivities, AdminUserAccessHistoryItem } from '@/types/admin.types'
import { isUserSystemAdmin } from '@/utils/authUtils'
import { adminService, extractList } from '@/services/adminService'
import { geographyService } from '@/services/geographyService'
import type { ProvinceDto } from '@/types/models/geography.model'
import {
  ArrowLeft,
  FileText,
  Search,
  ChevronDown,
  Shield,
  ShieldCheck,
  Users,
  Check,
  Star,
  CheckCircle2,
  Save,
  Loader2,
  Power,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react'

export interface AdminCategoryDto {
  id: number
  name: string
  slug?: string | null
  iconUrl?: string | null
  displayOrder?: number
}

interface UserDetailDashboardViewProps {
  user: AdminUserItem
  onBack: () => void
  showToast?: (msg: string) => void
}

type DetailTab = 'scopes' | 'logs' | 'reviews' | 'blogs' | 'trips' | 'proposals'

const VALID_TABS: DetailTab[] = ['scopes', 'logs', 'reviews', 'blogs', 'trips', 'proposals']

export const UserDetailDashboardView: React.FC<UserDetailDashboardViewProps> = ({
  user,
  onBack,
  showToast
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const viewerIsSystemAdmin = isUserSystemAdmin()

  // Dynamic Data States from API
  const [categoriesList, setCategoriesList] = useState<AdminCategoryDto[]>([])
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
    ? 'System Admin'
    : isCategoryAdmin
      ? 'Admin Cấp 1'
      : 'Người dùng'

  // Selected scopes & initial baseline states for dirty checking
  const [initialCategoryIds, setInitialCategoryIds] = useState<number[]>(
    user.categoryScopes?.map((c) => c.categoryId) || []
  )
  const [initialProvinceIds, setInitialProvinceIds] = useState<number[]>(
    user.provinceScopes?.map((p) => p.provinceId) || []
  )

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    user.categoryScopes?.map((c) => c.categoryId) || []
  )
  const [selectedProvinceIds, setSelectedProvinceIds] = useState<number[]>(
    user.provinceScopes?.map((p) => p.provinceId) || []
  )

  // In-dropdown search states
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [provinceSearchQuery, setProvinceSearchQuery] = useState('')

  // Dropdown open states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isProvinceDropdownOpen, setIsProvinceDropdownOpen] = useState(false)

  // Dirty check: whether selected scopes differ from baseline
  const hasScopeChanges = useMemo(() => {
    if (selectedCategoryIds.length !== initialCategoryIds.length) return true
    if (selectedProvinceIds.length !== initialProvinceIds.length) return true
    const catSet = new Set(initialCategoryIds)
    if (selectedCategoryIds.some((id) => !catSet.has(id))) return true
    const provSet = new Set(initialProvinceIds)
    if (selectedProvinceIds.some((id) => !provSet.has(id))) return true
    return false
  }, [selectedCategoryIds, selectedProvinceIds, initialCategoryIds, initialProvinceIds])

  // Unified Tab State with URL query sync
  const getInitialTab = (): DetailTab => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab') as DetailTab | null
    if (tabParam && VALID_TABS.includes(tabParam)) {
      return tabParam
    }
    return isTargetAdmin ? 'scopes' : 'reviews'
  }

  const [activeTab, setActiveTabState] = useState<DetailTab>(getInitialTab)
  const [searchQuery, setSearchQuery] = useState('')

  // Keep state synced when user clicks back/forward in browser history
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab') as DetailTab | null
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTabState(tabParam)
    }
  }, [location.search])

  const setActiveTab = (tab: DetailTab) => {
    setActiveTabState(tab)
    const currentPath = location.pathname.startsWith('/admin/users')
      ? location.pathname
      : `/admin/users/${user.userId}`
    navigate(`${currentPath}?tab=${tab}`, { replace: true })
  }

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

  // Category Name Helper
  const getCategoryName = (id: number) => {
    const found = categoriesList.find((c) => c.id === id)
    if (found) return found.name
    const inUserScopes =
      userDetail?.categoryScopes?.find((c) => c.categoryId === id)?.categoryName ||
      user.categoryScopes?.find((c) => c.categoryId === id)?.categoryName
    return inUserScopes || `ID #${id}`
  }

  // Load All Data from API
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      try {
        // 1. Fetch master lists for categories (/api/admin/categories) & provinces
        const [catRes, provRes] = await Promise.allSettled([
          adminService.getCategories(),
          geographyService.getProvinces()
        ])

        if (isMounted) {
          if (catRes.status === 'fulfilled' && catRes.value) {
            const rawList = extractList<AdminCategoryDto>((catRes.value as any)?.data || catRes.value)
            setCategoriesList(rawList)
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
            const catIds = Array.isArray(detailData.categoryScopes)
              ? detailData.categoryScopes.map((c: any) => c.categoryId)
              : []
            const provIds = Array.isArray(detailData.provinceScopes)
              ? detailData.provinceScopes.map((p: any) => p.provinceId)
              : []
            setSelectedCategoryIds(catIds)
            setSelectedProvinceIds(provIds)
            setInitialCategoryIds(catIds)
            setInitialProvinceIds(provIds)
          }
        } catch {
          // Fallback to initial prop if API call fails
          if (isMounted) {
            const catIds = user.categoryScopes?.map((c) => c.categoryId) || []
            const provIds = user.provinceScopes?.map((p) => p.provinceId) || []
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
            setSelectedCategoryIds(catIds)
            setSelectedProvinceIds(provIds)
            setInitialCategoryIds(catIds)
            setInitialProvinceIds(provIds)
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
      setInitialCategoryIds([...selectedCategoryIds])
      setInitialProvinceIds([...selectedProvinceIds])
      showToast?.(
        `Đã lưu phân quyền cho ${userDetail?.fullName || user.fullName}: ${selectedCategoryIds.length} danh mục, ${selectedProvinceIds.length} tỉnh thành.`
      )
    } catch (err: any) {
      showToast?.(err?.response?.data?.message || err?.message || 'Cập nhật phân quyền thất bại.')
    } finally {
      setIsSavingScopes(false)
    }
  }

  // Handle Cancel Scopes changes
  const handleCancelScopes = () => {
    setSelectedCategoryIds([...initialCategoryIds])
    setSelectedProvinceIds([...initialProvinceIds])
    showToast?.('Đã khôi phục phân quyền ban đầu.')
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

  // Toggle Review Status
  const handleToggleReviewStatus = async (e: React.MouseEvent, reviewId: number, currentStatus?: string | number) => {
    e.stopPropagation()
    const isAct = String(currentStatus) === '1' || String(currentStatus).toLowerCase() === 'active' || String(currentStatus).toLowerCase() === 'công khai'
    const nextStatus = isAct ? '0' : '1'
    try {
      await adminService.updateReviewStatus(reviewId, nextStatus)
      setUserActivities((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          reviews: (prev.reviews || []).map((r) =>
            r.id === reviewId ? { ...r, status: nextStatus } : r
          ),
        }
      })
      showToast?.(nextStatus === '1' ? 'Đã công khai đánh giá' : 'Đã ẩn đánh giá')
    } catch (err: any) {
      showToast?.(err?.message || 'Không thể đổi trạng thái đánh giá')
    }
  }

  // Toggle Blog Status
  const handleToggleBlogStatus = async (e: React.MouseEvent, blogId: number, currentStatus?: string | number) => {
    e.stopPropagation()
    const isPub = String(currentStatus) === '1' || String(currentStatus).toLowerCase() === 'published' || String(currentStatus).toLowerCase() === 'active' || String(currentStatus) === 'Đã xuất bản'
    const nextStatus = isPub ? '0' : '1'
    try {
      await adminService.updateBlogStatus(blogId, nextStatus)
      setUserActivities((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          blogs: (prev.blogs || []).map((b) =>
            b.id === blogId ? { ...b, status: nextStatus } : b
          ),
        }
      })
      showToast?.(nextStatus === '1' ? 'Đã xuất bản bài viết' : 'Đã ẩn bài viết')
    } catch (err: any) {
      showToast?.(err?.message || 'Không thể đổi trạng thái bài viết')
    }
  }

  // Toggle Trip Status
  const handleToggleTripStatus = async (e: React.MouseEvent, tripId: number, currentStatus?: string | number) => {
    e.stopPropagation()
    const isPub = String(currentStatus) === '1' || String(currentStatus).toLowerCase() === 'public' || String(currentStatus).toLowerCase() === 'active' || String(currentStatus) === 'Công khai'
    const nextStatus = isPub ? '0' : '1'
    setUserActivities((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        trips: (prev.trips || []).map((t) =>
          t.id === tripId ? { ...t, status: nextStatus } : t
        ),
      }
    })
    showToast?.(nextStatus === '1' ? 'Đã công khai chuyến đi' : 'Đã ẩn chuyến đi')
  }



  const reviewsList = userActivities?.reviews || []
  const blogsList = userActivities?.blogs || []
  const tripsList = userActivities?.trips || []
  const proposalsList = userActivities?.proposals || []

  return (
    <div className="space-y-6 font-sans antialiased text-slate-800 animate-in fade-in duration-200">
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Chi tiết tài khoản
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${isSystemAdmin
                  ? 'bg-purple-50 text-purple-750 border-purple-200'
                  : isCategoryAdmin
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
              >
                {roleName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mã người dùng: #{userDetail?.userId || user.userId} • Đăng ký ngày{' '}
              {formatDate(userDetail?.createdAt || user.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={`/user/${user.userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-teal-700 hover:text-teal-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <FileText size={14} />
            <span>XEM TRANG CÁ NHÂN</span>
          </a>

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
            Vai trò
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
                    : 'Tài khoản người dùng'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-6 space-y-5">
        <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto overflow-y-hidden text-xs font-bold scrollbar-none">
          <div className="flex items-center gap-4 sm:gap-6">
            {isTargetAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('scopes')}
                  className={`pb-3.5 -mb-px transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'scopes'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <span>Phạm vi phân quyền ({selectedCategoryIds.length} DM, {selectedProvinceIds.length} Tỉnh)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('logs')}
                  className={`pb-3.5 -mb-px transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'logs'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <span>Lịch sử hoạt động ({accessHistory.length})</span>
                </button>

                <div className="h-4 w-px bg-slate-200 self-center hidden sm:block" />
              </>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3.5 -mb-px transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'reviews'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>Đánh giá ({reviewsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('blogs')}
              className={`pb-3.5 -mb-px transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'blogs'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>Bài viết ({blogsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trips')}
              className={`pb-3.5 -mb-px transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'trips'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>Chuyến đi ({tripsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('proposals')}
              className={`pb-3.5 -mb-px transition-colors cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'proposals'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>Đề xuất ({proposalsList.length})</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Search Bar */}
        {activeTab !== 'scopes' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nội dung..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-emerald-600" />
            <span className="text-xs">Đang tải dữ liệu tài khoản từ hệ thống...</span>
          </div>
        )}

        {!isLoading && activeTab === 'scopes' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-50/50 rounded-2xl border border-slate-200/90 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        1. Danh mục phân quyền
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Chọn các danh mục địa điểm tài khoản được giao quyền
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    {selectedCategoryIds.length}/{categoriesList.length} danh mục
                  </span>
                </div>

                {/* Dropdown Container */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Lựa chọn danh mục:</span>
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
                        className="text-teal-700 hover:text-teal-800 font-bold cursor-pointer text-2xs hover:underline"
                      >
                        {selectedCategoryIds.length === categoriesList.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                      </button>
                    )}
                  </div>

                  {/* Dropdown Selector Button */}
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-teal-500 rounded-xl text-xs text-slate-700 font-medium shadow-2xs transition-all cursor-pointer min-h-[46px]"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {selectedCategoryIds.length > 0 ? (
                        selectedCategoryIds.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md font-bold text-2xs"
                          >
                            <span>{getCategoryName(id)}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">Nhấn vào đây để chọn danh mục...</span>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform ml-2 ${isCategoryDropdownOpen ? 'rotate-180 text-teal-600' : ''
                        }`}
                    />
                  </button>

                  {/* Dropdown List with Checkboxes */}
                  {isCategoryDropdownOpen && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-lg space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          placeholder="Tìm nhanh danh mục..."
                          className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-teal-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                        {categoriesList
                          .filter((cat) =>
                            !categorySearchQuery.trim()
                              ? true
                              : cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                          )
                          .map((cat) => {
                            const isChecked = selectedCategoryIds.includes(cat.id)
                            return (
                              <div
                                key={cat.id}
                                onClick={() => toggleCategory(cat.id)}
                                className={`flex items-center gap-2.5 p-2 rounded-lg text-xs transition-colors cursor-pointer ${isChecked
                                  ? 'bg-teal-50/80 text-teal-950 font-bold border border-teal-200/60'
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
                                <span className="flex-1 truncate">{cat.name}</span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-200/90 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        2. Tỉnh thành phụ trách
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Chọn các địa bàn tỉnh/thành phố mà tài khoản được giao
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    {selectedProvinceIds.length}/{provincesList.length} tỉnh
                  </span>
                </div>

                {/* Dropdown Container */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">Lựa chọn tỉnh thành:</span>
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
                        className="text-amber-700 hover:text-amber-800 font-bold cursor-pointer text-2xs hover:underline"
                      >
                        {selectedProvinceIds.length === provincesList.length ? 'Bỏ chọn hết' : 'Chọn toàn quốc'}
                      </button>
                    )}
                  </div>

                  {/* Dropdown Selector Button */}
                  <button
                    type="button"
                    onClick={() => setIsProvinceDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-amber-500 rounded-xl text-xs text-slate-700 font-medium shadow-2xs transition-all cursor-pointer min-h-[46px]"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {selectedProvinceIds.length > 0 ? (
                        <>
                          {selectedProvinceIds.slice(0, 6).map((id) => (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-2xs"
                            >
                              <span>{provincesList.find((p) => p.id === id)?.name || `ID #${id}`}</span>
                            </span>
                          ))}
                          {selectedProvinceIds.length > 6 && (
                            <span className="px-2 py-0.5 bg-amber-100/70 text-amber-900 rounded-md font-bold text-2xs">
                              +{selectedProvinceIds.length - 6} tỉnh khác
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">Nhấn vào đây để chọn tỉnh thành...</span>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform ml-2 ${isProvinceDropdownOpen ? 'rotate-180 text-amber-600' : ''
                        }`}
                    />
                  </button>

                  {/* Dropdown List with Checkboxes */}
                  {isProvinceDropdownOpen && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-lg space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={provinceSearchQuery}
                          onChange={(e) => setProvinceSearchQuery(e.target.value)}
                          placeholder="Tìm nhanh tỉnh thành..."
                          className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1 pr-1">
                        {provincesList
                          .filter((prov) =>
                            !provinceSearchQuery.trim()
                              ? true
                              : prov.name.toLowerCase().includes(provinceSearchQuery.toLowerCase()) ||
                              (prov.regionName || '').toLowerCase().includes(provinceSearchQuery.toLowerCase())
                          )
                          .map((prov) => {
                            const isChecked = selectedProvinceIds.includes(prov.id)
                            return (
                              <div
                                key={prov.id}
                                onClick={() => toggleProvince(prov.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors cursor-pointer ${isChecked
                                  ? 'bg-amber-50/80 text-amber-950 font-bold border border-amber-200/60'
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
                                  <span className="text-[10px] text-slate-400 font-normal block">{prov.regionName}</span>
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div className="text-xs">
                {hasScopeChanges ? (
                  <div className="flex items-center gap-2 text-amber-800 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span>Thay đổi phân quyền ({selectedCategoryIds.length} danh mục, {selectedProvinceIds.length} tỉnh thành)</span>
                  </div>
                ) : (
                  <span className="text-slate-500 font-medium">
                    Phân quyền hiện tại: {selectedCategoryIds.length} danh mục • {selectedProvinceIds.length} tỉnh thành
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* NÚT HỦY */}
                <button
                  type="button"
                  disabled={!hasScopeChanges || isSavingScopes}
                  onClick={handleCancelScopes}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${hasScopeChanges && !isSavingScopes
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs cursor-pointer'
                    : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  title={hasScopeChanges ? 'Hủy bỏ các thay đổi phân quyền' : 'Không có thay đổi để hủy'}
                >
                  Hủy
                </button>

                {/* NÚT LƯU */}
                <button
                  type="button"
                  disabled={!hasScopeChanges || isSavingScopes || !viewerIsSystemAdmin}
                  onClick={handleSaveScopes}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${hasScopeChanges && !isSavingScopes && viewerIsSystemAdmin
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-emerald-100 text-emerald-300 border border-emerald-200 cursor-not-allowed'
                    }`}
                  title={
                    !viewerIsSystemAdmin
                      ? 'Chỉ System Admin có quyền cập nhật phân quyền'
                      : hasScopeChanges
                        ? 'Lưu thay đổi phân quyền vào hệ thống'
                        : 'Không có thay đổi để lưu'
                  }
                >
                  {isSavingScopes ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </div>
          </div>
        )}


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

        {!isLoading && activeTab === 'reviews' && (
          <div className="space-y-3">
            {reviewsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
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
                .map((rev) => {
                  const isRevActive = String(rev.status) === '1' || String(rev.status).toLowerCase() === 'active' || String(rev.status).toLowerCase() === 'công khai'
                  return (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/30 transition-all space-y-2.5 shadow-2xs"
                    >
                      {/* Top row: Title + Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => {
                                if (rev.placeId) navigate(`/admin/places/${rev.placeId}`)
                                else navigate('/admin/places')
                              }}
                              className="font-bold text-slate-900 hover:text-emerald-700 text-xs sm:text-sm cursor-pointer transition-colors"
                              title="Nhấn để xem địa điểm"
                            >
                              {rev.placeName}
                            </h4>
                            <div className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>{rev.rating}.0 / 5.0</span>
                            </div>
                          </div>

                          {/* Subline: Clearly labeled metadata placed beneath the title */}
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-1">
                            <span>Danh mục: <strong className="text-slate-700 font-medium">{rev.category || 'Chưa phân loại'}</strong></span>
                            <span className="text-slate-300">•</span>
                            <span>Tỉnh/Thành: <strong className="text-slate-700 font-medium">{rev.province || 'Toàn quốc'}</strong></span>
                            <span className="text-slate-300">•</span>
                            <span>Ngày đăng: <span className="text-slate-600 font-medium">{formatDate(rev.createdAt)}</span></span>
                            <span className="text-slate-300">•</span>
                            <span>Lượt thích: <span className="text-slate-600 font-medium">{rev.likes || 0}</span></span>
                          </div>
                        </div>

                        {/* Right side compact status & action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${isRevActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                          >
                            {isRevActive ? 'Công khai' : 'Đang ẩn'}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleToggleReviewStatus(e, rev.id, rev.status)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border ${isRevActive
                              ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            title={isRevActive ? 'Ẩn bài đánh giá này' : 'Hiện bài đánh giá này'}
                          >
                            {isRevActive ? <EyeOff size={11} /> : <Eye size={11} />}
                            <span>{isRevActive ? 'Ẩn' : 'Hiện'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (rev.placeId) navigate(`/admin/places/${rev.placeId}`)
                              else navigate('/admin/places')
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                          >
                            <span>Xem địa điểm</span>
                            <ExternalLink size={10} className="text-slate-400" />
                          </button>
                        </div>
                      </div>

                      {/* Review Comment Content */}
                      <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100/90 font-normal">
                        {rev.content}
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )}

        {!isLoading && activeTab === 'blogs' && (
          <div className="space-y-3">
            {blogsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
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
                .map((blog) => {
                  const isBlogPub = String(blog.status) === '1' || String(blog.status).toLowerCase() === 'published' || String(blog.status).toLowerCase() === 'active' || String(blog.status) === 'Đã xuất bản'
                  return (
                    <div
                      key={blog.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <h4
                          onClick={() => window.open(`/blog/${blog.id}`, '_blank')}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-xs sm:text-sm truncate cursor-pointer transition-colors"
                          title={blog.title}
                        >
                          {blog.title}
                        </h4>

                        {/* Subline: Clearly labeled metadata placed beneath the title */}
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-1">
                          <span>Danh mục: <strong className="text-slate-700 font-medium">{blog.category || 'Cẩm nang du lịch'}</strong></span>

                          <span className="text-slate-300">•</span>
                          <span>Ngày xuất bản: <span className="text-slate-600 font-medium">{formatDate(blog.publishedAt)}</span></span>
                          <span className="text-slate-300">•</span>
                          <span>Lượt xem: <span className="text-slate-600 font-medium">{blog.views || 0}</span></span>
                          <span className="text-slate-300">•</span>
                          <span>Lượt thích: <span className="text-slate-600 font-medium">{blog.likes || 0}</span></span>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${isBlogPub
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        >
                          {isBlogPub ? 'Đã xuất bản' : 'Đang ẩn'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleBlogStatus(e, blog.id, blog.status)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border ${isBlogPub
                            ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          title={isBlogPub ? 'Ẩn bài viết này' : 'Công khai bài viết này'}
                        >
                          {isBlogPub ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>{isBlogPub ? 'Ẩn' : 'Hiện'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.open(`/blog/${blog.id}`, '_blank')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                        >
                          <span>Xem bài viết</span>
                          <ExternalLink size={10} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )}

        {!isLoading && activeTab === 'trips' && (
          <div className="space-y-3">
            {tripsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Chưa có chuyến đi công khai nào được chia sẻ.
              </div>
            ) : (
              tripsList
                .filter((t) =>
                  !searchQuery.trim() ? true : (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((trip) => {
                  const isTripPub = String(trip.status) === '1' || String(trip.status).toLowerCase() === 'public' || String(trip.status).toLowerCase() === 'active' || String(trip.status) === 'Công khai'
                  return (
                    <div
                      key={trip.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <h4
                          onClick={() => window.open(`/itinerary/${trip.id}`, '_blank')}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-xs sm:text-sm truncate cursor-pointer transition-colors"
                          title={trip.title}
                        >
                          {trip.title}
                        </h4>

                        {/* Subline: Clearly labeled metadata placed beneath the title */}
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-1">
                          <span>Loại lịch trình: <strong className="text-slate-700 font-medium">{trip.duration || 'Chưa đặt lịch'}</strong></span>
                          <span className="text-slate-300">•</span>
                          <span>Số địa điểm: <span className="text-slate-600 font-medium">{trip.placesCount || 0} địa điểm</span></span>
                          <span className="text-slate-300">•</span>
                          <span>Ngày tạo: <span className="text-slate-600 font-medium">{formatDate(trip.createdAt)}</span></span>
                          <span className="text-slate-300">•</span>
                          <span>Lượt lưu: <span className="text-slate-600 font-medium">{trip.likes || 0}</span></span>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${isTripPub
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        >
                          {isTripPub ? 'Công khai' : 'Đang ẩn'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleTripStatus(e, trip.id, trip.status)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border ${isTripPub
                            ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          title={isTripPub ? 'Ẩn chuyến đi này' : 'Công khai chuyến đi này'}
                        >
                          {isTripPub ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>{isTripPub ? 'Ẩn' : 'Hiện'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.open(`/itinerary/${trip.id}`, '_blank')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                        >
                          <span>Xem chuyến đi</span>
                          <ExternalLink size={10} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )}

        {!isLoading && activeTab === 'proposals' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Mã đề xuất</th>
                  <th className="py-2.5 px-4">Tên địa điểm đề xuất</th>
                  <th className="py-2.5 px-4">Danh mục</th>
                  <th className="py-2.5 px-4">Tỉnh thành</th>
                  <th className="py-2.5 px-4">Ngày gửi</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-4 text-right pr-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                {proposalsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
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
                      <tr
                        key={prop.id}
                        onClick={() => navigate(`/admin/proposals/${prop.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono text-[11px]">#PROP-{prop.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {prop.placeName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{prop.category || 'Địa điểm'}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{prop.province || 'Toàn quốc'}</td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(prop.submittedAt)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${String(prop.status) === '1' || prop.status === 'Approved'
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
                        <td className="py-3 px-4 text-right pr-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/admin/proposals/${prop.id}`)
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                          >
                            Xem đề xuất →
                          </button>
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

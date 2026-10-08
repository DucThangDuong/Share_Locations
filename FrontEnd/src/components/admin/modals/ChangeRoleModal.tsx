import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Shield,
  ShieldCheck,
  Users,
  AlertTriangle,
  Check,
  Search,
  Loader2,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { adminService, extractList } from '@/services/adminService'
import { geographyService } from '@/services/geographyService'
import type { ProvinceDto } from '@/types/models/geography.model'
import { useAuth } from '@/context/AuthContext'
import type { AdminUserItem, AdminUserDetail } from '@/types/admin.types'

interface CategoryItem {
  id: number
  name: string
  slug?: string | null
  iconUrl?: string | null
}

interface ChangeRoleModalProps {
  isOpen: boolean
  onClose: () => void
  user: AdminUserItem | AdminUserDetail | null
  onSuccess?: (updatedData?: any) => void
  showToast?: (msg: string) => void
}

type RoleType = 'USER' | 'CATEGORY_ADMIN' | 'SYSTEM_ADMIN'

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  showToast,
}) => {
  const { user: currentUser } = useAuth()
  const currentLoggedInUserId = currentUser?.id ? Number(currentUser.id) : null

  // Target user data
  const targetUserId = user ? (user.userId || (user as any).id) : null
  const currentRoles = (user?.roles || []).map((r) => String(r).toUpperCase().trim())
  
  const currentRoleType: RoleType = useMemo(() => {
    if (currentRoles.some((r) => r === 'SYSTEM_ADMIN' || r === 'ADMIN' || r === 'SUPERADMIN')) {
      return 'SYSTEM_ADMIN'
    }
    if (currentRoles.some((r) => r === 'CATEGORY_ADMIN' || r === 'ADMIN_LEVEL_1')) {
      return 'CATEGORY_ADMIN'
    }
    return 'USER'
  }, [currentRoles])

  // Form states
  const [selectedRole, setSelectedRole] = useState<RoleType>(currentRoleType)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedProvinceIds, setSelectedProvinceIds] = useState<number[]>([])
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Master lists
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([])
  const [provincesList, setProvincesList] = useState<ProvinceDto[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)

  // Search filters
  const [catSearch, setCatSearch] = useState('')
  const [provSearch, setProvSearch] = useState('')

  // Sync state on open
  useEffect(() => {
    if (isOpen && user) {
      setSelectedRole(currentRoleType)
      setReason('')
      setErrorMessage(null)
      setCatSearch('')
      setProvSearch('')

      // Initialize scopes from user
      const catIds = user.categoryScopes?.map((c: any) => c.categoryId) || []
      const provIds = user.provinceScopes?.map((p: any) => p.provinceId) || []
      setSelectedCategoryIds(catIds)
      setSelectedProvinceIds(provIds)

      // Fetch master categories & provinces
      const loadMasterData = async () => {
        setIsLoadingLists(true)
        try {
          const [catRes, provRes] = await Promise.allSettled([
            adminService.getCategories(),
            geographyService.getProvinces(),
          ])

          if (catRes.status === 'fulfilled' && catRes.value) {
            const list = extractList<CategoryItem>((catRes.value as any)?.data || catRes.value)
            setCategoriesList(list)
          }

          if (provRes.status === 'fulfilled' && provRes.value?.data) {
            setProvincesList(provRes.value.data)
          }
        } catch {
          // Ignore
        } finally {
          setIsLoadingLists(false)
        }
      }

      loadMasterData()
    }
  }, [isOpen, user, currentRoleType])

  if (!isOpen || !user) return null

  // Filtered categories
  const filteredCategories = categoriesList.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase().trim())
  )

  // Filtered provinces
  const filteredProvinces = provincesList.filter((p) =>
    p.name.toLowerCase().includes(provSearch.toLowerCase().trim())
  )

  // Self-demotion check
  const isSelfDemotion =
    currentLoggedInUserId &&
    targetUserId &&
    Number(currentLoggedInUserId) === Number(targetUserId) &&
    currentRoleType === 'SYSTEM_ADMIN' &&
    selectedRole !== 'SYSTEM_ADMIN'

  // Toggle category selection
  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Toggle province selection
  const toggleProvince = (id: number) => {
    setSelectedProvinceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Select all categories
  const handleSelectAllCategories = () => {
    if (selectedCategoryIds.length === categoriesList.length) {
      setSelectedCategoryIds([])
    } else {
      setSelectedCategoryIds(categoriesList.map((c) => c.id))
    }
  }

  // Select all provinces
  const handleSelectAllProvinces = () => {
    if (selectedProvinceIds.length === provincesList.length) {
      setSelectedProvinceIds([])
    } else {
      setSelectedProvinceIds(provincesList.map((p) => p.id))
    }
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUserId) return

    if (isSelfDemotion) {
      setErrorMessage('Bạn không thể tự hạ quyền Quản trị viên hệ thống của chính mình.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        role: selectedRole,
        categoryIds: selectedRole === 'CATEGORY_ADMIN' ? selectedCategoryIds : undefined,
        provinceIds: selectedRole === 'CATEGORY_ADMIN' ? selectedProvinceIds : undefined,
        reason: reason.trim() || undefined,
      }

      const res = await adminService.updateUserRole(targetUserId, payload)
      const data = (res as any)?.data || res

      const roleDisplayNames: Record<RoleType, string> = {
        USER: 'Người dùng thông thường',
        CATEGORY_ADMIN: 'Admin Cấp 1',
        SYSTEM_ADMIN: 'Quản trị viên hệ thống (System Admin)',
      }

      showToast?.(
        data?.message ||
          `Đã cập nhật vai trò của ${user.fullName || 'tài khoản'} thành "${roleDisplayNames[selectedRole]}" thành công.`
      )

      onSuccess?.(data)
      onClose()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật vai trò người dùng. Vui lòng thử lại.'
      setErrorMessage(msg)
      showToast?.(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Phân quyền &amp; Đổi vai trò tài khoản
              </h3>
              <p className="text-xs text-slate-500">
                Gán hoặc thay đổi vai trò và phạm vi kiểm duyệt của thành viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target User Card */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-lg flex items-center justify-center border border-emerald-200 shrink-0">
                {(user.fullName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-slate-900 truncate">
                  {user.fullName || 'Chưa đặt tên'}
                </span>
                <span className="text-xs text-slate-400">ID #{targetUserId}</span>
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">{user.email}</div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Vai trò hiện tại
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold mt-0.5 ${
                  currentRoleType === 'SYSTEM_ADMIN'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : currentRoleType === 'CATEGORY_ADMIN'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentRoleType === 'SYSTEM_ADMIN' ? (
                  <ShieldCheck size={11} />
                ) : currentRoleType === 'CATEGORY_ADMIN' ? (
                  <Shield size={11} />
                ) : (
                  <Users size={11} />
                )}
                <span>
                  {currentRoleType === 'SYSTEM_ADMIN'
                    ? 'System Admin'
                    : currentRoleType === 'CATEGORY_ADMIN'
                    ? 'Admin Cấp 1'
                    : 'Người dùng'}
                </span>
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Self-Demotion Warning */}
          {isSelfDemotion && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-900 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Cảnh báo bảo mật:</strong> Bạn đang đăng nhập bằng tài khoản này. Hệ thống không cho phép tự hạ quyền Quản trị viên hệ thống của chính mình.
              </div>
            </div>
          )}

          {/* Choose Role Radio Cards */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn vai trò muốn gán <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: USER */}
              <button
                type="button"
                onClick={() => setSelectedRole('USER')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                  selectedRole === 'USER'
                    ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      selectedRole === 'USER'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Users size={16} />
                  </div>
                  {selectedRole === 'USER' && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Người dùng</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Thành viên bình thường, không có quyền quản trị.
                  </p>
                </div>
              </button>

              {/* Option 2: CATEGORY_ADMIN */}
              <button
                type="button"
                onClick={() => setSelectedRole('CATEGORY_ADMIN')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                  selectedRole === 'CATEGORY_ADMIN'
                    ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      selectedRole === 'CATEGORY_ADMIN'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Shield size={16} />
                  </div>
                  {selectedRole === 'CATEGORY_ADMIN' && (
                    <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Admin Cấp 1</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Kiểm duyệt theo danh mục và tỉnh thành phụ trách.
                  </p>
                </div>
              </button>

              {/* Option 3: SYSTEM_ADMIN */}
              <button
                type="button"
                onClick={() => setSelectedRole('SYSTEM_ADMIN')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                  selectedRole === 'SYSTEM_ADMIN'
                    ? 'bg-purple-50/60 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      selectedRole === 'SYSTEM_ADMIN'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    <ShieldCheck size={16} />
                  </div>
                  {selectedRole === 'SYSTEM_ADMIN' && (
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">System Admin</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Toàn quyền quản trị cao nhất trên toàn hệ thống.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Scopes Section for CATEGORY_ADMIN */}
          {selectedRole === 'CATEGORY_ADMIN' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-amber-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Phân công phạm vi kiểm duyệt (Scopes)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {selectedCategoryIds.length} danh mục • {selectedProvinceIds.length} tỉnh thành
                </span>
              </div>

              {isLoadingLists ? (
                <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-emerald-600" />
                  <span>Đang tải danh sách danh mục &amp; tỉnh thành...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Scopes */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col h-60">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800">
                        Danh mục ({selectedCategoryIds.length}/{categoriesList.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAllCategories}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                      >
                        {selectedCategoryIds.length === categoriesList.length
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả'}
                      </button>
                    </div>

                    <div className="pt-2 pb-1.5 relative">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Tìm danh mục..."
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                      {filteredCategories.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          Không tìm thấy danh mục
                        </div>
                      ) : (
                        filteredCategories.map((c) => {
                          const isChecked = selectedCategoryIds.includes(c.id)
                          return (
                            <label
                              key={c.id}
                              onClick={() => toggleCategory(c.id)}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-amber-50/70 text-amber-950 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                              />
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Province Scopes */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col h-60">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800">
                        Tỉnh / Thành phố ({selectedProvinceIds.length}/{provincesList.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAllProvinces}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                      >
                        {selectedProvinceIds.length === provincesList.length
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả'}
                      </button>
                    </div>

                    <div className="pt-2 pb-1.5 relative">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Tìm tỉnh thành..."
                        value={provSearch}
                        onChange={(e) => setProvSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                      {filteredProvinces.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          Không tìm thấy tỉnh thành
                        </div>
                      ) : (
                        filteredProvinces.map((p) => {
                          const isChecked = selectedProvinceIds.includes(p.id)
                          return (
                            <label
                              key={p.id}
                              onClick={() => toggleProvince(p.id)}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-amber-50/70 text-amber-950 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{p.name}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                              />
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Automatic cleanup notice when demoting to USER or promoting to SYSTEM_ADMIN */}
          {selectedRole === 'USER' && currentRoleType !== 'USER' && (
            <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-center gap-2">
              <Info size={16} className="text-blue-600 shrink-0" />
              <span>
                Khi hạ quyền về <strong>Người dùng thường</strong>, mọi phân quyền danh mục &amp; tỉnh thành cũ của tài khoản này sẽ tự động được thu hồi và dọn dẹp sạch sẽ.
              </span>
            </div>
          )}

          {selectedRole === 'SYSTEM_ADMIN' && currentRoleType !== 'SYSTEM_ADMIN' && (
            <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-2xl text-xs text-purple-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-purple-600 shrink-0" />
              <span>
                Tài khoản được gán <strong>System Admin</strong> sẽ có toàn quyền truy cập tất cả tài nguyên hệ thống (bao gồm quản lý người dùng, phân quyền, xem nhật ký kiểm toán).
              </span>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lý do thay đổi vai trò (Lưu vào nhật ký kiểm toán)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thay đổi vai trò (vd: Bổ nhiệm nhân sự mới, Hết hạn hợp đồng thử việc...)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition-colors resize-none"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isSelfDemotion}
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang cập nhật...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Xác nhận đổi vai trò</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangeRoleModal

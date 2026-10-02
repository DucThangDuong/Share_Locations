import React, { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AdminUserItem } from '@/types/admin.types'
import { isUserSystemAdmin } from '@/utils/authUtils'
import { UserDetailDashboardView } from './UserDetailDashboardView'
import {
  Users,
  Shield,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle
} from 'lucide-react'

interface UsersTabProps {
  usersList: AdminUserItem[]
  isLoading?: boolean
  pagination?: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    categoryAdminsCount?: number
    systemAdminsCount?: number
    regularUsersCount?: number
  }
  onPageChange?: (page: number) => void
  onFilterChange?: (filters: {
    role?: string
    status?: string
    keyword?: string
    categoryId?: number
    provinceId?: number
    regionId?: number
    pageSize?: number
    page?: number
  }) => void
  currentFilters?: {
    role?: string
    status?: string
    keyword?: string
    categoryId?: number
    provinceId?: number
    regionId?: number
    pageSize?: number
    page?: number
  }
  showToast?: (msg: string) => void
}

export const UsersTab: React.FC<UsersTabProps> = ({
  usersList = [],
  isLoading = false,
  pagination = {
    page: 1,
    pageSize: 20,
    totalCount: usersList.length,
    totalPages: 1,
    categoryAdminsCount: 0,
    systemAdminsCount: 0,
    regularUsersCount: 0
  },
  onPageChange,
  onFilterChange,
  currentFilters = {},
  showToast: _showToast
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isSystemAdmin = isUserSystemAdmin()
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'user' | 'admins'>(
    isSystemAdmin ? 'all' : 'user'
  )
  const [searchText, setSearchText] = useState(currentFilters.keyword || '')
  const [statusFilter, setStatusFilter] = useState(currentFilters.status || 'all')
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AdminUserItem | null>(null)

  // Match /admin/users/:userId from URL path
  const userPathMatch = location.pathname.match(/\/admin\/users\/(\d+)/i)
  const urlUserId = userPathMatch ? Number(userPathMatch[1]) : null

  // Find user in list or fallback to placeholder (UserDetailDashboardView will fetch full details via API)
  const activeDetailUser = useMemo(() => {
    if (!urlUserId) return null
    const found = usersList.find((u) => (u.userId || (u as any).id) === urlUserId)
    if (found) return found
    if (selectedUserForDetail && (selectedUserForDetail.userId || (selectedUserForDetail as any).id) === urlUserId) {
      return selectedUserForDetail
    }
    return {
      id: urlUserId,
      userId: urlUserId,
      email: '',
      fullName: '',
      roles: [],
      status: 1,
      createdAt: new Date().toISOString()
    } as AdminUserItem
  }, [urlUserId, usersList, selectedUserForDetail])

  // Subtab click handler with backend API call
  const handleSubTabClick = (tab: 'all' | 'user' | 'admins') => {
    setActiveSubTab(tab)
    if (tab === 'all') {
      onFilterChange?.({ ...currentFilters, role: undefined, page: 1 })
    } else if (tab === 'user') {
      onFilterChange?.({ ...currentFilters, role: 'USER', page: 1 })
    } else if (tab === 'admins') {
      onFilterChange?.({ ...currentFilters, role: 'CATEGORY_ADMIN', page: 1 })
    }
  }

  // Filtered users list (supporting server-side pagination and local fallback)
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const rolesUpper = (u.roles || []).map((r) => String(r).toUpperCase())
      const isUserOnly = rolesUpper.length === 0 || (rolesUpper.length === 1 && rolesUpper[0] === 'USER')

      // Category Admin is restricted: only allowed to see regular users
      if (!isSystemAdmin && !isUserOnly) return false

      return true
    })
  }, [usersList, isSystemAdmin])

  // Real summary counts from meta & API
  const firstUser = (usersList[0] || {}) as any
  const totalUsersCount = pagination.totalCount || usersList.length

  const categoryAdminsCount =
    pagination.categoryAdminsCount ??
    firstUser?.categoryAdminsCount ??
    usersList.filter((u) =>
      (u.roles || []).some((r) => String(r).toUpperCase() === 'CATEGORY_ADMIN')
    ).length

  const systemAdminsCount =
    pagination.systemAdminsCount ??
    firstUser?.systemAdminsCount ??
    usersList.filter((u) =>
      (u.roles || []).some((r) => String(r).toUpperCase() === 'SYSTEM_ADMIN' || String(r).toUpperCase() === 'ADMIN')
    ).length

  const regularUsersCount =
    pagination.regularUsersCount ??
    firstUser?.regularUsersCount ??
    (totalUsersCount - categoryAdminsCount - systemAdminsCount > 0
      ? totalUsersCount - categoryAdminsCount - systemAdminsCount
      : usersList.filter((u) => {
        const roles = (u.roles || []).map((r) => String(r).toUpperCase())
        return roles.length === 0 || (roles.length === 1 && roles[0] === 'USER')
      }).length)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange?.({
      ...currentFilters,
      keyword: searchText.trim() || undefined,
      page: 1
    })
  }

  const handleResetFilters = () => {
    setSearchText('')
    setStatusFilter('all')
    setActiveSubTab(isSystemAdmin ? 'all' : 'user')
    onFilterChange?.({ page: 1, role: isSystemAdmin ? undefined : 'USER' })
  }

  // Standard robust pagination items generator
  const paginationItems = useMemo((): (number | string)[] => {
    const total = Math.max(1, Number(pagination.totalPages || 1))
    const current = Math.max(1, Number(pagination.page || 1))

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-r', total]
    }
    if (current >= total - 3) {
      return [1, 'ellipsis-l', total - 4, total - 3, total - 2, total - 1, total]
    }
    return [1, 'ellipsis-l', current - 1, current, current + 1, 'ellipsis-r', total]
  }, [pagination.totalPages, pagination.page])

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

  const renderRoleBadge = (roles: string[] = []) => {
    const rolesUpper = roles.map((r) => String(r).toUpperCase())
    if (rolesUpper.includes('SYSTEM_ADMIN') || rolesUpper.includes('ADMIN') || rolesUpper.includes('SUPERADMIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
          <ShieldCheck size={11} className="text-purple-700" />
          <span>System Admin</span>
        </span>
      )
    }
    if (rolesUpper.includes('CATEGORY_ADMIN') || rolesUpper.includes('ADMIN_LEVEL_1')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
          <Shield size={11} className="text-amber-700" />
          <span>Admin Cấp 1</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Users size={11} className="text-slate-500" />
        <span>Người dùng</span>
      </span>
    )
  }

  const renderStatusBadge = (status?: string | number) => {
    const s = String(status ?? '').toUpperCase()
    if (s === '1' || s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Hoạt động</span>
        </span>
      )
    }
    if (s === '0' || s === 'BANNED' || s === 'LOCKED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800">
          <UserX size={11} />
          <span>Bị khóa</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-slate-100 text-slate-600">
        <span>Tạm ngưng</span>
      </span>
    )
  }

  if (activeDetailUser) {
    return (
      <UserDetailDashboardView
        user={activeDetailUser}
        onBack={() => {
          setSelectedUserForDetail(null)
          navigate('/admin/users')
        }}
        showToast={_showToast}
      />
    )
  }

  const handleSelectUser = (u: AdminUserItem) => {
    setSelectedUserForDetail(u)
    navigate(`/admin/users/${u.userId || (u as any).id}`)
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tổng tài khoản</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {totalUsersCount.toLocaleString('vi-VN')}
          </div>
          <span className="text-[11px] text-slate-400">Toàn hệ thống</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Người dùng</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-900 mt-2">
            {regularUsersCount.toLocaleString('vi-VN')}
          </div>
          <span className="text-[11px] text-blue-600">Thành viên cộng đồng</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Admin Cấp 1</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-2">
            {categoryAdminsCount.toLocaleString('vi-VN')}
          </div>
          <span className="text-[11px] text-amber-700">Quản trị viên</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">System Admin</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-900 mt-2">
            {systemAdminsCount.toLocaleString('vi-VN')}
          </div>
          <span className="text-[11px] text-purple-700">Toàn quyền hệ thống</span>
        </div>
      </div>

      {/* Main Tab Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Sub-tab Selection */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl font-medium text-xs">
            {isSystemAdmin && (
              <button
                type="button"
                onClick={() => handleSubTabClick('all')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${activeSubTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Tất cả tài khoản
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubTabClick('user')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${activeSubTab === 'user'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Người dùng thường
            </button>
            {isSystemAdmin && (
              <button
                type="button"
                onClick={() => handleSubTabClick('admins')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeSubTab === 'admins'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Shield size={13} className="text-emerald-700" />
                <span>Quản trị viên</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Trang <strong>{pagination.page}</strong> / {pagination.totalPages} • Tổng cộng{' '}
            <strong>{pagination.totalCount}</strong> tài khoản
          </div>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo Họ tên, Email hoặc SĐT... (Nhấn Enter để tìm)"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
            />
          </form>

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              onFilterChange?.({
                ...currentFilters,
                status: e.target.value === 'all' ? undefined : e.target.value,
                page: 1
              })
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Bị khóa</option>
          </select>

          {/* Page size selector */}
          <select
            value={pagination.pageSize || 20}
            onChange={(e) => {
              onFilterChange?.({
                ...currentFilters,
                pageSize: Number(e.target.value),
                page: 1
              })
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>

          {(searchText || statusFilter !== 'all' || activeSubTab !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Users Table Container with independent vertical scrolling & sticky headers */}
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto rounded-xl border border-slate-100 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-white z-10 shadow-2xs border-b border-slate-200">
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Tài khoản &amp; Liên hệ</th>
                <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Vai trò</th>
                <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Trạng thái</th>
                <th className="py-3 px-4 bg-slate-50/90 backdrop-blur-xs">Ngày tạo</th>
                <th className="py-3 px-4 text-right bg-slate-50/90 backdrop-blur-xs">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
                    Không tìm thấy tài khoản nào phù hợp
                    <p className="text-2xs text-slate-400 mt-0.5">Thử thay đổi từ khóa tìm kiếm hoặc điều kiện lọc</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.userId || (u as any).id}
                    onClick={() => handleSelectUser(u)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* User profile & contact */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200">
                            {(u.fullName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {u.fullName || 'Chưa cập nhật tên'}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <span className="truncate">{u.email}</span>
                            {u.phoneNumber && (
                              <>
                                <span>•</span>
                                <span>{u.phoneNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderRoleBadge(u.roles)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(u.status)}
                    </td>

                    {/* Created date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectUser(u)
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-2xs transition-colors cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <strong>{filteredUsers.length}</strong> / <strong>{pagination.totalCount || usersList.length}</strong> tài khoản
            {pagination.totalPages > 1 && (
              <span> (Trang {pagination.page} / {pagination.totalPages})</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Trang trước"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page Number Buttons */}
            {paginationItems.map((item, idx) => {
              if (typeof item === 'string') {
                return (
                  <span
                    key={`${item}-${idx}`}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 font-bold text-xs"
                  >
                    ...
                  </span>
                )
              }

              const isActive = Number(pagination.page) === item
              return (
                <button
                  key={`page-${item}`}
                  type="button"
                  onClick={() => onPageChange?.(item)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  {item}
                </button>
              )
            })}

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Trang sau"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersTab

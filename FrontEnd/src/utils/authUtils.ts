export function decodeJwtPayload(token?: string | null): Record<string, any> | null {
  const t = token || localStorage.getItem('access_token')
  if (!t || typeof t !== 'string') return null
  try {
    const parts = t.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}
export function getUserRoleId(token?: string | null): number {
  // Check user_info in localStorage first for explicit roleId
  try {
    const stored = JSON.parse(localStorage.getItem('user_info') || '{}')
    if (stored.roleId !== undefined && stored.roleId !== null) {
      const parsed = Number(stored.roleId)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    if (stored.role !== undefined && stored.role !== null) {
      const parsed = Number(stored.role)
      if (!isNaN(parsed) && parsed > 0) return parsed
      const s = String(stored.role).trim().toUpperCase()
      if (s === 'CATEGORY_ADMIN' || s === 'CATEGORYADMIN' || s === 'ADMIN_LEVEL_1') return 2
      if (s === 'SYSTEM_ADMIN' || s === 'SYSTEMADMIN' || s === 'SUPERADMIN') return 3
    }
  } catch {}

  // Check JWT Payload
  const payload = decodeJwtPayload(token)
  if (payload) {
    const rId = payload.roleId ?? payload['roleId'] ?? payload['RoleId']
    if (rId !== undefined && rId !== null) {
      const parsed = Number(rId)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    const r = payload.role ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    if (r) {
      const parsed = Number(r)
      if (!isNaN(parsed) && parsed > 0) return parsed
      const s = String(r).trim().toUpperCase()
      if (s === 'CATEGORY_ADMIN' || s === 'CATEGORYADMIN' || s === 'ADMIN_LEVEL_1' || s === '2') return 2
      if (s === 'SYSTEM_ADMIN' || s === 'SYSTEMADMIN' || s === 'SUPERADMIN' || s === '3') return 3
    }
  }

  return 1 // Default to regular user
}

export function getUserRoles(token?: string | null): string[] {
  const payload = decodeJwtPayload(token)
  let rawRoles: any = null
  if (payload) {
    rawRoles =
      payload.role ??
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      payload.roles
  }

  if (!rawRoles) {
    try {
      const stored = JSON.parse(localStorage.getItem('user_info') || '{}')
      rawRoles = stored.roleId ?? stored.role ?? stored.roles
    } catch {
    }
  }

  if (!rawRoles) return []
  if (Array.isArray(rawRoles)) {
    return rawRoles.map((r) => String(r).trim()).filter(Boolean)
  }
  return [String(rawRoles).trim()].filter(Boolean)
}

export function isUserCategoryAdmin(token?: string | null): boolean {
  const roleId = getUserRoleId(token)
  if (roleId === 2) return true
  const roles = getUserRoles(token).map((r) => r.toUpperCase().trim())
  return roles.some((r) => r === 'CATEGORY_ADMIN' || r === 'CATEGORYADMIN' || r === 'ADMIN_LEVEL_1' || r === '2')
}

export function isUserSystemAdmin(token?: string | null): boolean {
  const roleId = getUserRoleId(token)
  if (roleId === 3) return true
  if (roleId === 2) return false // Category admin is never system admin
  const roles = getUserRoles(token).map((r) => r.toUpperCase().trim())
  return roles.some((r) => r === 'SYSTEM_ADMIN' || r === 'SYSTEMADMIN' || r === 'SUPERADMIN' || r === '3')
}

export function isUserAdmin(token?: string | null): boolean {
  const roleId = getUserRoleId(token)
  if (roleId === 2 || roleId === 3) return true
  const roles = getUserRoles(token)
  if (roles.length === 0) return false
  return roles.some((r) => r.toLowerCase() !== 'user' && r !== '1')
}

export function getAdminRoleTitle(token?: string | null): string {
  if (isUserSystemAdmin(token)) return 'Admin tổng'
  if (isUserCategoryAdmin(token)) return 'Admin cấp 1'
  return 'Người dùng'
}

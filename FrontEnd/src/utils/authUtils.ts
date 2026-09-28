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
      rawRoles = stored.role ?? stored.roles
    } catch {
    }
  }

  if (!rawRoles) return []
  if (Array.isArray(rawRoles)) {
    return rawRoles.map((r) => String(r).trim()).filter(Boolean)
  }
  return [String(rawRoles).trim()].filter(Boolean)
}
export function isUserAdmin(token?: string | null): boolean {
  const roles = getUserRoles(token)
  if (roles.length === 0) return false
  return roles.some((r) => r.toLowerCase() !== 'user')
}

export function isUserSystemAdmin(token?: string | null): boolean {
  const roles = getUserRoles(token).map((r) => r.toUpperCase().trim())
  return roles.some((r) => r === 'SYSTEM_ADMIN' || r === 'SYSTEMADMIN' || r === 'ADMIN' || r === 'SUPERADMIN')
}

export function isUserCategoryAdmin(token?: string | null): boolean {
  const roles = getUserRoles(token).map((r) => r.toUpperCase().trim())
  return roles.some((r) => r === 'CATEGORY_ADMIN' || r === 'CATEGORYADMIN')
}

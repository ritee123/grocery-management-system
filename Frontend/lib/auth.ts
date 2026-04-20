export type UserRole = 'admin' | 'customer'

export function setAuthSession(session: { token: string; role: UserRole; user?: any }) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('auth_token', session.token)
  window.localStorage.setItem('auth_role', session.role)
  window.localStorage.setItem('auth_user', JSON.stringify(session.user ?? null))
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('auth_token')
  window.localStorage.removeItem('auth_role')
  window.localStorage.removeItem('auth_user')
}

export function getAuthRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  const role = window.localStorage.getItem('auth_role')
  return role === 'admin' || role === 'customer' ? role : null
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  return Boolean(window.localStorage.getItem('auth_token'))
}

export function getAuthUser(): any | null {
  if (typeof window === 'undefined') return null
  const user = window.localStorage.getItem('auth_user')
  return user ? JSON.parse(user) : null
}


// Simple admin auth via localStorage
// Trong production nên dùng proper auth (NextAuth, Supabase Auth...)

const ADMIN_PASSWORD_HASH = 'gmap_admin_2026' // Đổi password này

export function checkAdminAuth() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('gmap_admin_token') === btoa(ADMIN_PASSWORD_HASH)
}

export function adminLogin(password) {
  if (password === ADMIN_PASSWORD_HASH) {
    localStorage.setItem('gmap_admin_token', btoa(ADMIN_PASSWORD_HASH))
    return true
  }
  return false
}

export function adminLogout() {
  localStorage.removeItem('gmap_admin_token')
}

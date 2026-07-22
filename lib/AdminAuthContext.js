import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin]   = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/me')
      const d = await r.json()
      setAdmin(d.ok ? d.admin : null)
    } catch {
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  // Điều hướng về trang login khi hết phiên — chỉ chạy khi đã biết chắc (loading xong)
  useEffect(() => {
    if (loading) return
    const onAdminArea = router.pathname.startsWith('/admin') && router.pathname !== '/admin'
    if (!admin && onAdminArea) router.replace('/admin')
  }, [loading, admin, router.pathname])

  async function logout() {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    setAdmin(null)
    router.replace('/admin')
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, refresh: fetchMe, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth phải dùng trong AdminAuthProvider')
  return ctx
}

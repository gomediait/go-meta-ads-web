import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch('/api/auth?action=me')
      if (r.ok) {
        const d = await r.json()
        setUser(d.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()
    // Re-validate session every 5 minutes to kick shared accounts
    const interval = setInterval(fetchMe, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchMe])

  const login = async (email, password) => {
    const r = await fetch('/api/auth?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Đăng nhập thất bại')
    setUser(d.user)
    return d.user
  }

  const register = async (email, password, name, phone = '', referral_code = '', otp = '') => {
    const r = await fetch('/api/auth?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone, referral_code, otp })
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Đăng ký thất bại')
    setUser(d.user)
    return d.user
  }

  const logout = async () => {
    await fetch('/api/auth?action=logout')
    setUser(null)
    router.push('/login')
  }

  const refreshUser = fetchMe

  const planLabel = {
    trial: 'Dùng thử',
    personal: 'Personal',
    business: 'Business',
    agency: 'Agency'
  }

  const isExpired = user?.expire_at ? new Date(user.expire_at) < new Date() : false
  const planName = planLabel[user?.plan] || 'Dùng thử'
  const isPro = user?.plan === 'business' || user?.plan === 'agency'
  const isAgency = user?.plan === 'agency'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, planName, isExpired, isPro, isAgency }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider')
  return ctx
}

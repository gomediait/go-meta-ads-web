export async function adminLocalFetch(endpoint, body) {
  const adminToken = typeof window !== 'undefined' ? atob(localStorage.getItem('gmap_admin_token') || '') : ''
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
    body: JSON.stringify(body)
  })
  return res.json()
}

export async function apiPost(endpoint, body) {
  const API = 'https://go-meta-ads-backend.vercel.app'
  const res = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}


export const PLAN_OPTIONS = [
  { value: 'ca-nhan', label: 'Cá nhân' },
  { value: 'doanh-nghiep', label: 'Doanh nghiệp' },
  { value: 'agency', label: 'Agency' },
  { value: 'trial', label: 'Dùng thử 3 ngày' }
]

export const BILLING_OPTIONS = [
  { value: 'thang', label: '1 Tháng' },
  { value: 'nam', label: '1 Năm' },
  { value: 'vinh-vien', label: 'Vĩnh viễn' }
]

export const AI_CATEGORIES = [
  { value: 'faq',          label: '❓ Câu hỏi thường gặp' },
  { value: 'product',      label: '📦 Thông tin sản phẩm' },
  { value: 'policy',       label: '📜 Chính sách' },
  { value: 'promotion',    label: '🎁 Chương trình khuyến mãi' },
  { value: 'brand_voice',  label: '🗣️ Giọng điệu thương hiệu' },
  { value: 'competitor',   label: '⚔️ Phân tích đối thủ' },
  { value: 'target_audience', label: '🎯 Khách hàng mục tiêu' },
  { value: 'other',        label: '✨ Khác' }
]

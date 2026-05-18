// Affiliate referral tracking
// Cookie: gmap_ref = referral_code, thời hạn 30 ngày

const REF_KEY = 'gmap_ref'
const REF_DAYS = 30

// Lưu referral code vào localStorage (30 ngày)
export function saveReferralCode(code) {
  if (!code || typeof window === 'undefined') return
  try {
    const expires = Date.now() + REF_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(REF_KEY, JSON.stringify({ code, expires }))
  } catch (e) {}
}

// Đọc referral code (check hết hạn)
export function getReferralCode() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(REF_KEY)
    if (!raw) return null
    const { code, expires } = JSON.parse(raw)
    if (Date.now() > expires) { localStorage.removeItem(REF_KEY); return null }
    return code
  } catch (e) { return null }
}

// Gọi API track click
export async function trackReferralClick(code) {
  if (!code) return
  try {
    await fetch('https://go-meta-ads-backend.vercel.app/api/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'track', key: 'SYSTEM', referral_code: code })
    })
  } catch (e) {}
}

// Gọi khi đặt hàng thành công
export async function attributeConversion({ referral_code, order_id, plan_id, price }) {
  if (!referral_code || !order_id) return
  try {
    await fetch('https://go-meta-ads-backend.vercel.app/api/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'attribute', key: 'SYSTEM', referral_code, order_id, plan_id, price })
    })
  } catch (e) {}
}

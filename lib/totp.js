import crypto from 'crypto'

// TOTP theo RFC 6238 (HMAC-SHA1, 6 số, chu kỳ 30s) — tự implement để không thêm dependency mới.
// Tương thích Google Authenticator, Authy, 1Password...

const STEP = 30
const DIGITS = 6
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateBase32Secret(bytes = 20) {
  const buf = crypto.randomBytes(bytes)
  let bits = ''
  for (const b of buf) bits += b.toString(2).padStart(8, '0')
  let secret = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    secret += B32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)]
  }
  return secret
}

function base32Decode(base32) {
  const clean = (base32 || '').toUpperCase().replace(/=+$/, '')
  let bits = ''
  for (const char of clean) {
    const idx = B32_ALPHABET.indexOf(char)
    if (idx === -1) continue
    bits += idx.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function hotp(secretBuf, counter) {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', secretBuf).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return (code % 10 ** DIGITS).toString().padStart(DIGITS, '0')
}

// window=1 nghĩa là chấp nhận lệch ±30s (đồng hồ điện thoại không khớp tuyệt đối)
export function verifyTotp(base32Secret, token, window = 1) {
  if (!/^\d{6}$/.test(token || '')) return false
  const secretBuf = base32Decode(base32Secret)
  const counter = Math.floor(Date.now() / 1000 / STEP)
  for (let e = -window; e <= window; e++) {
    if (hotp(secretBuf, counter + e) === token) return true
  }
  return false
}

export function buildOtpauthUri(secret, email, issuer = 'Go Meta Ads Pro') {
  const label = encodeURIComponent(`${issuer}:${email}`)
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' })
  return `otpauth://totp/${label}?${params.toString()}`
}

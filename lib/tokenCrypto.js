import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const PREFIX = 'v1'

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY
  if (!hex) throw new Error('TOKEN_ENCRYPTION_KEY chưa được cấu hình trong biến môi trường')
  const key = Buffer.from(hex, 'hex')
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY phải là chuỗi hex 64 ký tự (32 byte)')
  return key
}

// Mã hoá 1 giá trị nhạy cảm (vd access_token Facebook) trước khi lưu DB.
export function encryptToken(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('hex'), tag.toString('hex'), enc.toString('hex')].join(':')
}

// Giải mã. Token cũ (tạo trước khi bật mã hoá) không có prefix "v1:" —
// trả về nguyên văn để không phá kết nối Facebook hiện có của user cũ.
export function decryptToken(value) {
  if (!value || !value.startsWith(`${PREFIX}:`)) return value

  const [, ivHex, tagHex, dataHex] = value.split(':')
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
  return dec.toString('utf8')
}

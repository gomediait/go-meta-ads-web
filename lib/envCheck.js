// Validate các biến môi trường bắt buộc TRƯỚC khi build thành công.
// Mục đích: nếu thiếu/sai định dạng, `next build` FAIL ngay trên Vercel —
// deployment production cũ vẫn tiếp tục phục vụ, bản build lỗi không bao giờ lên live.
// Tránh lặp lại kiểu lỗi TOKEN_ENCRYPTION_KEY sai định dạng chỉ bị phát hiện khi user thật gặp lỗi 500.

const isHex = (v, bytes) => typeof v === 'string' && new RegExp(`^[0-9a-fA-F]{${bytes * 2}}$`).test(v)
const nonEmpty = (v, minLen = 1) => typeof v === 'string' && v.trim().length >= minLen

const REQUIRED_ENV = [
  { key: 'TOKEN_ENCRYPTION_KEY', validate: v => isHex(v, 32),
    hint: 'chuỗi hex 64 ký tự (32 byte) — tạo bằng: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"' },
  { key: 'JWT_SECRET', validate: v => nonEmpty(v, 20) && v !== 'gmap-secret-change-in-prod',
    hint: 'chuỗi bí mật tối thiểu 20 ký tự, không được để giá trị mặc định trong code' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', validate: v => nonEmpty(v) && v.startsWith('https://'),
    hint: 'URL Supabase project, dạng https://xxx.supabase.co' },
  { key: 'SUPABASE_SERVICE_KEY', validate: v => nonEmpty(v, 20),
    hint: 'service_role key lấy từ Supabase Settings > API' },
  { key: 'FACEBOOK_APP_ID', validate: v => nonEmpty(v) },
  { key: 'FACEBOOK_APP_SECRET', validate: v => nonEmpty(v) },
  { key: 'CRON_SECRET', validate: v => nonEmpty(v, 16),
    hint: 'chuỗi bí mật tối thiểu 16 ký tự, dùng cho header Authorization: Bearer của cron routes' },
]

// Thiếu các biến này sẽ làm tính năng thanh toán PayOS lỗi khi có người mua gói thật,
// nhưng KHÔNG chặn build — chỉ cảnh báo, vì có thể tính năng thanh toán chưa bật ở project này.
const RECOMMENDED_ENV = [
  { key: 'PAYOS_CLIENT_ID', validate: v => nonEmpty(v) },
  { key: 'PAYOS_API_KEY', validate: v => nonEmpty(v) },
  { key: 'PAYOS_CHECKSUM_KEY', validate: v => nonEmpty(v) },
]

function checkEnv() {
  const missing = []
  for (const { key, validate, hint } of REQUIRED_ENV) {
    if (!validate(process.env[key])) missing.push(hint ? `${key} — ${hint}` : key)
  }
  if (missing.length) {
    throw new Error(
      `\n\n[ENV CONFIG ERROR] Thiếu hoặc sai định dạng ${missing.length} biến môi trường bắt buộc:\n` +
      missing.map(m => `  - ${m}`).join('\n') +
      `\n\nBuild bị dừng để tránh deploy production với cấu hình sai.\n`
    )
  }

  const missingRecommended = RECOMMENDED_ENV.filter(({ key, validate }) => !validate(process.env[key])).map(({ key }) => key)
  if (missingRecommended.length) {
    console.warn(
      `\n[ENV CONFIG WARNING] Thiếu ${missingRecommended.length} biến môi trường (tính năng thanh toán PayOS sẽ lỗi nếu dùng): ` +
      missingRecommended.join(', ') + '\n'
    )
  }
}

module.exports = { checkEnv }

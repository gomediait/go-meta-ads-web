# Skill: Security & Hardening

> Kích hoạt khi: xử lý user input, auth, data nhạy cảm, external API, webhooks, payment.

## Luôn làm (No Exceptions)

- ✅ Validate tất cả input tại API route boundary
- ✅ Không concatenate user input vào Supabase query
- ✅ Dùng `httpOnly: true, secure: true, sameSite: 'lax'` cho JWT cookie
- ✅ Secrets chỉ trong `.env.local` — không hardcode, không log
- ✅ Verify checksum/signature cho mọi webhook (PayOS, Meta)
- ✅ Mọi API route phải check auth trừ public endpoints

## Phải hỏi trước khi làm

- ⚠️ Thêm auth flow mới hoặc thay đổi logic auth
- ⚠️ Lưu category data nhạy cảm mới (PII, payment info)
- ⚠️ Thêm tích hợp external service mới
- ⚠️ Cấp quyền elevated cho user/role

## Tuyệt đối không làm

- ❌ Commit secrets vào git (API keys, JWT_SECRET, passwords)
- ❌ Log sensitive data (password, token, card number)
- ❌ Tin vào client-side validation như security boundary
- ❌ Expose stack trace hay internal error cho user
- ❌ Để `SUPABASE_SERVICE_ROLE_KEY` ra phía client

## Patterns cho dự án này

### API Route Auth Pattern

```javascript
// pages/api/[route].js — pattern chuẩn
export default async function handler(req, res) {
  // 1. Auth check
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // 2. Method check
  if (req.method !== 'POST') return res.status(405).end();

  // 3. Input validation
  const { campaignId } = req.body;
  if (!campaignId) return res.status(400).json({ error: 'Missing campaignId' });

  // 4. Authorization check (user owns resource?)
  const { data: campaign } = await supabase
    .from('campaigns').select('user_id').eq('id', campaignId).single();
  if (campaign.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // 5. Business logic
}
```

### Webhook Verification Pattern (PayOS)

```javascript
// Luôn verify trước khi xử lý
const isValid = payos.verifyPaymentWebhookData(req.body);
if (!isValid) return res.status(400).json({ error: 'Invalid signature' });
```

### Không expose sensitive fields

```javascript
// Khi trả về user data
const { password_hash, reset_token, ...safeUser } = userData;
return res.json(safeUser); // ✅ Không có sensitive fields
```

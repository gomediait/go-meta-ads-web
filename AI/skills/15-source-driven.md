# Skill: Source-Driven Development

> Kích hoạt khi: dùng API/SDK mà bạn không 100% chắc về cách dùng hiện tại.

## Nguyên tắc

**Đừng implement từ memory. Verify, rồi mới code.**

Training data stale. APIs bị deprecated. Best practices thay đổi. Luôn verify với official source.

## Stack của dự án và docs chính thức

| Thư viện | Docs chính thức |
|---|---|
| Next.js 14 (pages router) | https://nextjs.org/docs/pages |
| Supabase JS v2 | https://supabase.com/docs/reference/javascript |
| PayOS Node v2 | https://payos.vn/docs |
| Meta Graph API | https://developers.facebook.com/docs/graph-api |
| jsonwebtoken | https://github.com/auth0/node-jsonwebtoken |
| bcryptjs | https://github.com/dcodeIO/bcrypt.js |
| Nodemailer | https://nodemailer.com/about |
| GSAP | https://gsap.com/docs/v3 |

## Process

```
DETECT version → FETCH docs → IMPLEMENT → CITE source
```

### Step 1: Verify version trước

```javascript
// Đọc package.json để biết đúng version
// "next": "14.2.3"         → Next.js 14 docs
// "@supabase/supabase-js": "^2.106.1" → Supabase v2 docs
// "@payos/node": "^2.0.5"  → PayOS v2 docs
```

### Step 2: Fetch đúng trang, không phải homepage

```
BAD:  Fetch trang chủ supabase.com
GOOD: Fetch supabase.com/docs/reference/javascript/select

BAD:  Tìm "supabase authentication best practices"
GOOD: Fetch supabase.com/docs/guides/auth/server-side/nextjs
```

### Step 3: State rõ source khi implement

```
Dùng pattern từ: https://nextjs.org/docs/pages/building-your-application/routing/api-routes
Verified với Next.js 14.2.3
```

## Các API hay thay đổi trong project

### Supabase — Thường bị nhầm

```javascript
// ❌ Cũ (Supabase v1)
const { data, error } = await supabase
  .from('table').select().single();

// ✅ Đúng (Supabase v2)
const { data, error } = await supabase
  .from('table').select('*').eq('id', id).single();

// ❌ Auth methods cũ
supabase.auth.user()

// ✅ Không dùng Supabase Auth — dùng JWT tự quản lý qua lib/auth.js
```

### Meta Graph API — Hay thay đổi version

```javascript
// Luôn verify field names từ official docs
// Meta thường deprecate fields không báo trước
// Đọc: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group
```

### PayOS — Verify checksum method

```javascript
// Đọc PayOS v2 docs trước khi dùng
// payos.verifyPaymentWebhookData() vs createPaymentLink() có thể thay đổi signature
// Source: https://payos.vn/docs
```

## Khi không chắc chắn

1. Fetch official docs trực tiếp
2. Tìm ví dụ trong codebase hiện có (đã verified trước đó)
3. State rõ uncertainty: "Tôi không chắc về X, cần verify với docs"
4. Đừng implement từ memory và hy vọng đúng

## Source hierarchy

```
1. Official documentation (nextjs.org, supabase.com, ...)
2. Official changelog / blog
3. Existing working code trong codebase (đã test rồi)
4. ❌ Stack Overflow, blog posts, AI memory → KHÔNG phải primary source
```

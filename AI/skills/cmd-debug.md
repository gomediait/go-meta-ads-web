# /debug — Systematic Debugging

Khi có lỗi, theo quy trình này. Không đoán mò. Không fix symptom.

## Bước 1: DỪNG và thu thập evidence

```
Lỗi gì? [paste error message / log]
Khi nào xảy ra? [repro steps]
Trước đó có thay đổi gì? [recent commits/changes]
```

## Bước 2: Localize — Layer nào?

```
├── UI/JSX       → Check browser console, Network tab, React state
├── API Route    → Check terminal log khi dev, req.body, res.json
├── Supabase     → Check Supabase dashboard logs, RLS policy
├── Meta API     → Check token validity, error code, rate limit
├── PayOS        → Check webhook payload, checksum
├── Cron Job     → Check Vercel logs, Authorization header
└── Auth/JWT     → Check cookie tồn tại, JWT_SECRET match
```

## Bước 3: Reproduce minimal case

- Tạo repro case nhỏ nhất có thể trigger lỗi
- Strip bỏ mọi thứ không liên quan
- Nếu reproduce được → tiếp tục

## Bước 4: Fix ROOT CAUSE

```
Symptom → Root cause thực sự là gì?

Ví dụ:
❌ "Dữ liệu hiện sai" → fix UI display
✅ "Dữ liệu hiện sai" → API query thiếu filter → fix query
```

## Bước 5: Verify fix

```
□ Lỗi ban đầu không còn xảy ra?
□ Các case liên quan vẫn hoạt động đúng?
□ Không có regression mới?
```

## Common issues dự án này

| Symptom | Check đầu tiên |
|---|---|
| 401 từ Meta API | `OAuthException` → token hết hạn, cần reconnect |
| Supabase row not found | RLS policy, đúng `user_id` chưa? |
| Cron không execute | Vercel log, `Authorization: Bearer` header |
| PayOS webhook 400 | Checksum key có đúng trong `.env.local`? |
| JWT invalid/expired | Cookie `token`, `JWT_SECRET` trong env |
| NEXT_PUBLIC var undefined | Có prefix `NEXT_PUBLIC_` chưa? |

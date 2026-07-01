# Skill: Debugging & Error Recovery

> Kích hoạt khi: test fail, build break, behavior không đúng, có lỗi trong log.

## Quy tắc Stop-the-Line

Khi có gì unexpected xảy ra:

```
1. DỪNG — không thêm feature mới
2. LƯU EVIDENCE — error output, logs, repro steps
3. CHẨN ĐOÁN — theo triage checklist
4. SỬA root cause (không phải symptom)
5. GUARD — thêm check để không tái phát
6. TIẾP TỤC — chỉ sau khi verify pass
```

**Không push qua lỗi để "làm tiếp" feature khác. Lỗi ở bước 3 sẽ làm hỏng bước 4-10.**

## Triage Checklist

### Bước 1: Reproduce

```
Có reproduce được không?
├── CÓ → Bước 2
└── KHÔNG
    ├── Timing-dependent? → thêm log với timestamp
    ├── Env-dependent? → so sánh NODE_ENV, .env.local
    └── State-dependent? → thử reproduce sau khi reset DB/state
```

### Bước 2: Localize — Layer nào đang fail?

```
├── UI/JSX       → Check console, React DevTools, network tab
├── API Route    → Check server log, req/res body
├── Supabase     → Check query, RLS policy, data integrity
├── Meta API     → Check token validity, rate limit, OAuthException
├── PayOS        → Check checksum, webhook payload
└── Cron Job     → Check Authorization header, Vercel logs
```

### Bước 3: Sửa Root Cause (không phải symptom)

```
Symptom: "User list hiện trùng entries"

❌ Symptom fix: [...new Set(users)] trong UI
✅ Root cause fix: API query có JOIN bị duplicate → fix query
```

### Bước 4: Guard against recurrence

- Thêm check validation nếu input sai gây ra lỗi
- Thêm comment giải thích nếu logic tricky
- Thêm error handling nếu thiếu

## Common Issues trong dự án này

| Lỗi | Nguyên nhân thường gặp | Check |
|---|---|---|
| 401 từ Meta API | Token hết hạn | `OAuthException` trong response body |
| Supabase lỗi | RLS policy chặn | Thử với service role key |
| Cron không chạy | Missing/wrong Bearer token | Check `vercel.json` headers |
| PayOS webhook 400 | Sai checksum | Verify secret key trong `.env.local` |
| JWT invalid | Cookie bị expire hoặc sai `JWT_SECRET` | Check `lib/auth.js` → `verifyToken` |

# /ship — Pre-Deploy Checklist

Chạy checklist này trước khi push lên Vercel production.

## 🔴 Critical (phải pass hết)

### Auth & Security
- [ ] Không có secret/key hardcode trong code
- [ ] Tất cả `.env` vars cần thiết đã add vào Vercel Environment Variables
- [ ] API routes mới đã có auth check
- [ ] Webhook endpoints đã verify signature
- [ ] Không có `console.log` chứa sensitive data

### Functionality
- [ ] Happy path hoạt động trên local
- [ ] Error cases trả về đúng status code và message
- [ ] Supabase queries scope đúng theo `user_id`
- [ ] Meta token expiry được handle (trả 401 khi cần)

### Vercel Config
- [ ] Cron jobs mới đã được thêm vào `vercel.json`
- [ ] Cron routes có `Authorization: Bearer` check
- [ ] `next.config.js` không có config sai

## 🟡 Important (nên pass)

### Code Quality
- [ ] Không có unused imports, variables
- [ ] Không có dead code từ development
- [ ] Không có `TODO` / `FIXME` chưa giải quyết quan trọng
- [ ] Console logs debug đã xóa

### UX
- [ ] Loading states hiển thị khi fetch data
- [ ] Error messages thân thiện với user (không expose stack trace)
- [ ] i18n: text mới đã có translation `vi` lẫn `en`

### Performance
- [ ] Không có N+1 query mới
- [ ] List endpoints có limit (không fetch all)
- [ ] Meta API không bị gọi quá nhiều

## 🟢 Nice to have

- [ ] Commit message rõ ràng (imperative: "Add X", "Fix Y", "Remove Z")
- [ ] CLAUDE.md / skills cập nhật nếu có convention mới

## Deploy command

```bash
# Test build trước
npm run build

# Deploy (nếu dùng Vercel CLI)
vercel --prod
```

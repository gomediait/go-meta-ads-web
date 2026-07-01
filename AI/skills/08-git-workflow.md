# Skill: Git Workflow & Versioning

> Kích hoạt khi: bất kỳ thay đổi code nào — commit, branch, review.

## Nguyên tắc cốt lõi

Git là safety net. Commit = save point. Branch = sandbox. History = documentation.

## Commit Convention

### Format
```
<type>: <mô tả ngắn gọn, imperative>

<body tùy chọn: giải thích WHY, không phải WHAT>
```

### Types
| Type | Dùng khi |
|---|---|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa bug |
| `refactor` | Thay đổi code, không fix bug, không thêm feature |
| `chore` | Tooling, dependencies, config |
| `docs` | Chỉ thay đổi documentation |

### Ví dụ tốt
```bash
feat: add OTP email verification to registration flow

Sends 6-digit OTP via Nodemailer after user registers.
OTP expires in 10 minutes, stored in Supabase `otp_tokens` table.

fix: handle Meta OAuthException when token expired

Returns 401 with reconnect flag so client redirects to /settings/connect-facebook
```

### Ví dụ xấu
```bash
update auth.js       # ❌ Không rõ làm gì
fix bug              # ❌ Bug nào?
misc changes         # ❌ Vô nghĩa
```

## Branching

```
main ──●──●──●──●──  (luôn deployable lên Vercel)
        ╲      ╱
         ●──●──       ← feature branch (tồn tại 1-3 ngày)
```

### Đặt tên branch
```
feature/campaign-autoset-config
fix/meta-token-expiry-handling
chore/update-payos-sdk
refactor/auth-middleware
```

## Atomic Commits

Mỗi commit làm **một việc logic**:

```bash
# Tốt — mỗi commit độc lập
feat: add /api/fb/autoset-config endpoint
feat: add autoset config form UI component
fix: handle missing fb_access_token in autoset scan

# Xấu — mọi thứ lẫn lộn
git commit -m "add autoset, fix bugs, update deps"
```

## Trước khi commit

```bash
# 1. Xem mình sắp commit gì
git diff --staged

# 2. Kiểm tra không có secret lọt vào
git diff --staged | grep -i "secret\|password\|api_key\|token"

# 3. (optional) Build check
npm run build
```

## Sau mỗi thay đổi — Change Summary

```
CHANGES MADE:
- pages/api/fb/autoset-config.js: Added GET/POST handlers
- lib/planLimits.js: Added autoset plan check

KHÔNG CHẠM VÀO (intentionally):
- pages/api/fb/autoset.js: Similar but different flow, out of scope
- lib/metaApi.js: Could refactor but not part of this task

POTENTIAL CONCERNS:
- Plan limit check dùng hardcode string 'autoset' — confirm key name
```

## .gitignore cần có

```
node_modules/
.next/
.env
.env.local
*.pem
.vercel
```

## Red Flags

- ❌ Commit message: "fix", "update", "misc", "wip"
- ❌ Formatting changes lẫn với behavior changes trong 1 commit
- ❌ `.env.local` bị commit
- ❌ Branch tồn tại > 3 ngày mà chưa merge
- ❌ Force-push lên `main`

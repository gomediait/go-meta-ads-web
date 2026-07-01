# Skill: Documentation & ADRs

> Kích hoạt khi: quyết định kiến trúc quan trọng, thay đổi public API, hoặc onboard member mới.

## Nguyên tắc

**Document decisions, không phải code.**

Code nói lên *what* — documentation giải thích *why it was built this way*.

## Khi nào viết ADR (Architecture Decision Record)

Viết ADR khi quyết định:
- Chọn library/framework/service mới
- Thay đổi data model hoặc Supabase schema
- Thay đổi auth strategy
- Quyết định có thể expensive to reverse

**Không viết ADR cho:** implementation details, code style choices, one-off fixes.

## ADR Template

Lưu tại `docs/decisions/ADR-XXX-title.md`:

```markdown
# ADR-001: Dùng JWT tự quản lý thay vì Supabase Auth

## Status
Accepted

## Date
2025-06-01

## Context
Cần authentication cho web app quản lý Meta Ads.
Supabase Auth có sẵn nhưng team muốn control hoàn toàn flow,
bao gồm OTP email custom và login bằng Facebook OAuth riêng.

## Decision
Tự implement JWT auth với bcrypt + jsonwebtoken + cookie HTTP-only.
OTP email gửi qua Nodemailer. Session lưu trong cookie, không localStorage.

## Alternatives Considered

### Supabase Auth
- Pros: Built-in, ít code hơn
- Cons: Khó customize OTP flow, bị lock-in với Supabase provider
- Rejected: Cần control hoàn toàn auth flow

### NextAuth.js
- Pros: Multi-provider, well-maintained
- Cons: Thêm dependency, overkill cho use case hiện tại
- Rejected: Team muốn implementation đơn giản tự kiểm soát

## Consequences
- Phải tự handle token refresh, expiry
- Security hoàn toàn thuộc trách nhiệm team
- lib/auth.js là single source of truth cho auth logic
```

## Inline Comments — Comment WHY, không phải WHAT

```javascript
// ❌ Restate code (không cần)
// Lấy token từ cookie
const token = req.cookies?.token;

// ✅ Giải thích non-obvious intent
// Dùng HTTP-only cookie thay vì Authorization header để tránh XSS.
// Token không accessible từ JavaScript phía client.
const token = req.cookies?.token;

// ❌ Comment obvious
// Loop qua campaigns
for (const campaign of campaigns) { ... }

// ✅ Explain business rule
// Meta rate limit: tối đa 200 requests/hour per ad account.
// Batch theo 50 campaigns/request để tránh hit limit.
for (let i = 0; i < campaigns.length; i += 50) { ... }
```

## KHÔNG comment khi

```javascript
// Đừng comment self-explanatory code
function calculateCpa(spend, orders) {
  return spend / orders; // ❌ Quá obvious
}

// Đừng comment-out code cũ — dùng git history
// const oldFunction = () => { ... } // ❌ Xóa đi
```

## README updates

Khi thêm tính năng mới, update README nếu:
- Thêm env variable mới → update section `.env.local`
- Thêm npm dependency mới → update section Stack
- Thêm tính năng user-facing → update section Tính năng
- Thay đổi cấu trúc thư mục → update section Cấu trúc thư mục

## CLAUDE.md updates

Update [CLAUDE.md](../CLAUDE.md) khi:
- Convention mới được establish (không phải một lần, mà là pattern sẽ dùng lại)
- Project-specific gotcha quan trọng phát hiện ra
- Dependency mới với cách dùng đặc biệt

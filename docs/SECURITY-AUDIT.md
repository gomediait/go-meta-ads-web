# Báo cáo đánh giá bảo mật — Go Meta Ads Pro

**Ngày:** 10/07/2026
**Phạm vi:** `go-meta-ads-web` (Next.js 14 Pages Router, Supabase, PayOS)
**Phương pháp:** static code review (`pages/api`, `lib`, `next.config.js`, `middleware.js`) + `npm audit` + audit truy cập chéo giữa các route API
**Giới hạn:** không thay thế penetration test thực tế. Mục "Hạ tầng & Server" không kiểm chứng được từ mã nguồn, cần xác minh trực tiếp trên Vercel/Supabase dashboard.

> Đây là tài liệu theo dõi tiến độ khắc phục — tick `[x]` khi đã sửa và deploy.

---

## Ước tính thời gian tổng

Giả định: 1 dev đã quen codebase này, làm full-time, **không** tính thời gian QA/staging riêng hay thao tác thủ công ở mục 07 (Vercel/Supabase dashboard).

| Giai đoạn | Nội dung | Ước tính |
|---|---|---|
| Phase 1 — Critical | 8.1, 3.1, 2.1+4.1, 5.1+5.2 | **9.5–12h** (~1.5 ngày) |
| Phase 2 — High | 4.2+2.2 (security header/CSP), 1.1+6.1 (rate limit) | **6–8h** (~1 ngày) |
| Phase 3 — Medium | 1.2 (2FA), 1.3, 1.4, 4.3, 6.2, 9.1 | **11–16h** (~1.5–2 ngày) |
| Phase 4 — Low | 1.5, 1.6, 2.3, 9.2 | **~2.5h** |
| **Tổng** | | **~29–38.5h ≈ 4–5 ngày làm việc** |

Mục nặng nhất: **3.1 mã hoá FB token** (4–6h, phải sửa mọi chỗ đọc `access_token` + migrate token cũ) và **1.2 2FA admin** (4–6h, tính năng mới hoàn toàn chưa có sẵn hạ tầng). Phần còn lại đa số là sửa cục bộ 1–3 file.

---

## Việc cần làm trước (theo thứ tự ưu tiên)

- [x] **1. [Critical] Tính giá đơn hàng ở server, không nhận từ client** — `pages/api/payment/payos-create.js` — đã thêm `PRICE_TABLE` server-side, không nhận `amount` từ client nữa.
- [x] **2. [Critical] Mã hoá access token Facebook trước khi lưu DB** — thêm `lib/tokenCrypto.js` (AES-256-GCM), áp dụng ở `auth/callback.js` (mã hoá) và `lib/metaApi.js` (giải mã), tương thích ngược token cũ. **Cần bạn tự thêm biến `TOKEN_ENCRYPTION_KEY` vào Vercel Production trước khi deploy** — xem README.md.
- [x] **3. [Critical] Xoay key, bỏ hardcode, thêm auth cho upload ảnh** — `pages/api/upload-image.js` đã yêu cầu đăng nhập, giới hạn 5MB + mime whitelist, bỏ key hardcode. **Cần bạn tự xoay key mới trên upanhnhanh.com** (key cũ đã từng lộ trong git history, đổi sang key mới rồi set `UPANH_API_KEY` trong env).
- [ ] **4. [Critical] Nâng cấp Next.js (≥14.2.35) và Nodemailer (9.0.1+)** — *~2–2.5h*
- [x] **5. [High] Thêm security header** (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy) — thêm `headers()` trong `next.config.js`, đã build + curl xác nhận header xuất hiện đúng trên mọi route. CSP dùng `'unsafe-inline'` cho script-src/style-src (lý do ghi rõ trong comment file) — xem mục "Giới hạn còn lại" bên dưới.
- [x] **6. [High] Giới hạn số lần đăng nhập sai** — `lib/rateLimit.js` (dùng chung, bảng `rate_limit_attempts`), áp dụng cho cả `/api/auth` (user) và `/api/admin/login`: khoá 15 phút sau 8 lần sai trong 15 phút.
- [x] **7. [Medium] 2FA cho tài khoản admin + audit log hành động nhạy cảm** — TOTP tự implement (`lib/totp.js`, đã test khớp vector chuẩn RFC 4226), route `pages/api/admin/2fa.js` (setup/enable/disable) + `pages/api/admin/verify-2fa.js`, UI ở `pages/admin/security.jsx`. Audit log (`lib/auditLog.js`, bảng `audit_logs`) gắn vào: đăng nhập admin, bật/tắt 2FA, đổi quyền/thêm-xoá thành viên team, sửa user/reset FB/xoá user, lưu cấu hình SMTP, lưu site-settings.

**⚠️ Cần bạn chạy 1 lần:** `supabase/migrations/2026-07-10-security-hardening.sql` trong Supabase SQL Editor trước khi deploy — tạo bảng `rate_limit_attempts`, `audit_logs` và thêm cột TOTP vào `admin_users`.

### Giới hạn còn lại (biết trước, chấp nhận được cho v1)

- **CSP dùng `'unsafe-inline'`** cho `script-src`/`style-src` vì `pages/_app.jsx` tự inject script GTM/FB Pixel/TikTok Pixel bằng `document.createElement` và toàn bộ trang admin/dashboard dùng styled-jsx (inline `<style>`). CSP vẫn chặn được load script/style từ domain lạ và chặn nhúng iframe, nhưng không chặn triệt để XSS dạng inline-script. Muốn siết chặt hơn cần refactor sang CSP nonce — việc lớn hơn, để dịp khác nếu cần.
- **2FA chỉ nhập thủ công (không có QR code)** — cố tình không thêm thư viện `qrcode` mới và không gọi dịch vụ tạo QR bên thứ 3 (sẽ lộ secret TOTP ra ngoài). Admin nhập secret bằng tay vào Google Authenticator/Authy — vẫn an toàn, chỉ hơi bất tiện lúc thiết lập lần đầu.
- **Chưa có UI xem audit log** — dữ liệu đã được ghi đầy đủ vào bảng `audit_logs`, nhưng hiện chỉ xem được qua Supabase Dashboard → Table Editor. Có thể làm thêm trang `/admin/audit-logs` sau nếu cần.
- **Rate-limit khoá theo email, chưa theo IP** — đủ để chặn brute-force nhắm 1 tài khoản cụ thể; chưa chặn được 1 IP thử nhiều email khác nhau (mức độ rủi ro thấp hơn, để sau).

---

## 01 · Authentication & Access Control

| # | Mức | Vấn đề | File |
|---|---|---|---|
| 1.1 | High | Không giới hạn số lần đăng nhập sai (brute-force không giới hạn) | `pages/api/auth.js` (action `login`), `pages/api/admin/login.js` |
| 1.2 | Medium | Chưa có 2FA cho tài khoản admin — chỉ email + mật khẩu cho tài khoản quyền cao nhất | `pages/api/admin/login.js` |
| 1.3 | Medium | Yêu cầu mật khẩu quá yếu — chỉ check `length < 6`, không yêu cầu độ phức tạp | `pages/api/auth.js:78` |
| 1.4 | Medium | Client tự gửi `adset_id`/`campaign_id` gọi thẳng Meta API, không verify ID thuộc sở hữu của caller trước khi mutate (defense-in-depth, bị chặn bởi ACL của Meta nhưng vẫn nên siết) | `pages/api/fb/budget-update.js`, `campaign-toggle.js`, `campaign-adsets.js`, action `activate` trong `autoset.js` |
| 1.5 | Low | Logout chỉ xoá cookie client, JWT (hạn 30 ngày user / 12h admin) vẫn hợp lệ tới khi hết hạn tự nhiên hoặc user login lại | `lib/auth.js` (`clearSessionCookie`) |
| 1.6 | Low | Câu `UPDATE` cuối trong action `reply` thiếu `.eq('user_id', user.id)`, chỉ dựa vào check ở code phía trên | `pages/api/user/tickets.js` |

**Đã đạt:** hash mật khẩu bằng bcrypt đúng chuẩn; không bao giờ trả `password_hash`/`session_id` ra response; `lib/teamAccess.js` (`getEffectiveContext`) luôn suy ra chủ sở hữu từ JWT đã xác thực, không có đường impersonate; toàn bộ route còn lại trong `pages/api/fb/*`, `team.js`, `settings.js`, `dashboard/stats.js` scope đúng theo `ctx.ownerId`/`user.id`.

---

## 02 · Input Validation & Injection

| # | Mức | Vấn đề | File |
|---|---|---|---|
| 2.1 | Critical | Endpoint upload ảnh không xác thực, không giới hạn size/số lần gọi | `pages/api/upload-image.js` |
| 2.2 | Medium | Chưa có Content-Security-Policy — không có lớp chặn thứ 2 nếu có XSS bug trong tương lai | toàn site |
| 2.3 | Low | Chuỗi `search` nối trực tiếp vào filter `.or()` của Supabase (PostgREST filter injection, chỉ admin gọi được nên rủi ro thấp) | `pages/api/admin/web-users.js:19` |

**Đã đạt:** không có SQL injection cổ điển (toàn bộ dùng Supabase query builder); không có `dangerouslySetInnerHTML` nhận input người dùng; không gọi `exec/spawn/child_process` ở đâu — không có bề mặt command injection.

---

## 03 · Dữ liệu & Mã hoá

| # | Mức | Vấn đề | File |
|---|---|---|---|
| 3.1 | Critical | Access token Facebook (quyền `ads_management`, hạn 60 ngày) lưu **plaintext** trong Supabase | `pages/api/auth/callback.js:86` (cột `fb_connections.access_token`) |
| 3.2 | Low | Chưa cấu hình header HSTS tường minh (phụ thuộc mặc định của Vercel) | toàn site |

**Đã đạt:** không lưu số thẻ/CCCD (PayOS xử lý thanh toán riêng); không phát hiện token/mật khẩu bị log ra console.

---

## 04 · Secrets & Config

| # | Mức | Vấn đề | File |
|---|---|---|---|
| 4.1 | Critical | API key upanhnhanh.com hardcode thẳng trong source, đã lên git | `pages/api/upload-image.js:2` |
| 4.2 | High | Không có security header nào trên toàn site (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | `next.config.js`, `middleware.js` |
| 4.3 | Medium | Nhiều route trả nguyên `error.message` ra client — có thể lộ tên bảng/cấu trúc DB nội bộ | `dashboard-stats.js`, `smtp.js`, nhiều route `admin/*` khác |

**Đã đạt:** `.env`/`.env.local` đã gitignore, không commit; `SUPABASE_SERVICE_ROLE_KEY` không xuất hiện trong biến `NEXT_PUBLIC_*` nào.

---

## 05 · Dependencies & Supply Chain

| # | Mức | Vấn đề |
|---|---|---|
| 5.1 | Critical | `next@14.2.3` dính nhiều CVE đã công bố (authorization bypass ở Middleware, SSRF qua redirect, cache poisoning, HTTP request smuggling, DoS...). Bản vá: `14.2.35`. Rủi ro nâng cấp **thấp** — patch cùng minor `14.2.x`, dự án chỉ dùng Pages Router (không App Router/Server Actions/next-image), nên phần lớn CVE nghiêm trọng nhất không áp dụng cho cách dùng hiện tại. |
| 5.2 | High | `nodemailer ^8.0.8` dính CRLF injection + SSRF (`jsonTransport`/`raw` bypass `disableFileAccess`/`disableUrlAccess`). Bản vá đầu tiên là `9.0.1` — đây là **major version bump (8→9)**, cần test tay gửi mail sau khi nâng (dùng nút "Test gửi mail" ở `/admin/smtp`). |
| 5.3 | Low | `postcss <8.5.10` (transitive qua Next) — sẽ tự vá khi nâng Next lên bản khuyến nghị. |

**Không áp dụng:** dự án này là Next.js thuần, không dùng WordPress — mục WPScan/plugin/theme trong checklist gốc không áp dụng cho repo này.

---

## 06 · API Security

| # | Mức | Vấn đề | File |
|---|---|---|---|
| 6.1 | High | Không có rate limiting cho bất kỳ API endpoint nào (trừ khoảng cách 60s riêng cho gửi lại OTP) | toàn bộ `pages/api` |
| 6.2 | Medium | CORS `Access-Control-Allow-Origin: '*'` áp dụng cho toàn bộ action (login/register/otp/me/facebook) — không cần thiết vì frontend luôn same-origin | `pages/api/auth.js:7` |

**Đã đạt:** validate input hiện diện ở hầu hết boundary chính (format email/phone/password, giới hạn thành viên team, kiểm tra plan trước khi cho phép tính năng...).

---

## 07 · Hạ tầng & Server

*Không kiểm chứng được từ mã nguồn — chạy trên Vercel (serverless) + Supabase (managed Postgres).* Khuyến nghị kiểm tra thủ công:

- [ ] Bật WAF trước domain (Cloudflare hoặc Vercel Firewall) nếu chưa có.
- [ ] Xác nhận Supabase đã bật Point-in-Time Recovery, test khôi phục thử ít nhất 1 lần.
- [ ] Rà danh sách IP/thành viên có quyền truy cập Supabase Dashboard và Vercel project, gỡ tài khoản không còn dùng.

---

## 08 · Business Logic

| # | Mức | Vấn đề | File |
|---|---|---|---|
| 8.1 | **Critical** | **Giá gói có thể bị sửa trực tiếp qua request.** `amount` lấy thẳng từ `req.body.amount`, chỉ kiểm tra `>= 1000`. Không có bảng giá server-side tính lại theo `plan_id` + `billing_tab`. Sửa request (DevTools/Postman) gửi `plan_id: 'agency', billing_tab: 'nam5', amount: 1000` sẽ tạo được link thanh toán hợp lệ 1.000đ; webhook cấp đúng gói Agency 5 năm theo `order.plan`/`order.days` đã lưu, không đối chiếu lại giá. | `pages/api/payment/payos-create.js:26,31` |

**Đã đạt:** `payos-webhook.js` verify checksum bằng `payos.webhooks.verify()` trước khi xử lý — không giả mạo được callback thanh toán; mã giới thiệu (`referral_code`) chỉ dùng tính hoa hồng affiliate, không phải mã giảm giá cho người mua — không có vector lạm dụng coupon trực tiếp.

---

## 09 · Logging & Monitoring

| # | Mức | Vấn đề |
|---|---|---|
| 9.1 | Medium | Không có audit log cho đăng nhập / đổi quyền / hành động admin nhạy cảm (đổi gói tay, xoá user, sửa SMTP...) — khó truy vết khi có sự cố. |
| 9.2 | Medium | Chưa có cảnh báo khi có hoạt động bất thường (nhiều lần đăng nhập sai, traffic tăng đột biến vào 1 endpoint). |

**Đã đạt:** đã có kênh thông báo real-time (Lark webhook) cho thanh toán thành công và phản hồi ticket — hạ tầng sẵn sàng để mở rộng sang cảnh báo bảo mật.

---

## Ghi chú nâng cấp dependency (mục 5.1 / 5.2)

**Next.js 14.2.3 → 14.2.35 — rủi ro thấp**
- Patch version trong cùng `14.2.x`, semver đảm bảo không breaking change.
- Dự án dùng Pages Router thuần, không `next/image` (`images.unoptimized: true`), không cấu hình `i18n` → các CVE nghiêm trọng nhất (Server Actions, Server Components, Image Optimization, i18n Middleware bypass) không áp dụng cho cách dùng hiện tại.
- `getServerSideProps` chỉ dùng ở 2 trang (`ho-tro.jsx`, `tai-xuong.jsx`) để redirect — tối giản.
- Cách làm: `npm install next@14.2.35` → `npm run build` → click thử vài trang chính.

**Nodemailer ^8.0.8 → 9.0.1+ — rủi ro trung bình, cần test tay**
- Không có bản vá trên nhánh 8.x, bắt buộc nhảy major 8→9.
- Chỉ dùng 1 pattern (`createTransport` + `sendMail`) tại 3 chỗ: `lib/sendEmail.js`, `pages/api/admin/tickets.js`, `pages/api/admin/smtp.js` — API lõi ít đổi qua các major.
- Cách làm: `npm install nodemailer@latest` → bấm "Test gửi mail" ở `/admin/smtp` để xác nhận SMTP vẫn hoạt động trước khi coi là xong.

**Quy trình khuyến nghị chung:** làm trên branch riêng, không thẳng `main` → build → test tay (login, dashboard, `/admin/smtp` test mail, đăng ký nhận OTP) → merge → theo dõi log Vercel vài giờ đầu.

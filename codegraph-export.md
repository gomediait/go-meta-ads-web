# Codegraph Export — Go Meta Ads Pro
> Xuất ngày: 2026-06-17 | 86 files | 884 nodes | 1620 edges

---

## Tổng quan kiến trúc

| Layer | Chi tiết |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| Database | Supabase (PostgreSQL thuần — không dùng Auth/Realtime) |
| Auth | JWT tự quản lý (`lib/auth.js`) + bcrypt + OTP email |
| Meta API | Graph API v21.0 qua `lib/metaApi.js` |
| AI | shopaikey.com proxy (OpenAI-compatible), model `claude-haiku-4-5-20251001` |
| Payment | PayOS v2 |
| Email | Nodemailer SMTP |
| Deploy | Vercel + Cron Jobs |

---

## Gói dịch vụ & giới hạn (`lib/planLimits.js`)

| Tính năng | Trial | Personal | Business | Agency |
|---|:---:|:---:|:---:|:---:|
| Quản lý chiến dịch | ✅ | ✅ | ✅ | ✅ |
| Kiểm soát lãi lỗ | ✅ | ✅ | ✅ | ✅ |
| Report | ✅ | ✅ | ✅ | ✅ |
| Hỗ trợ kỹ thuật | ✅ | ✅ | ✅ | ✅ |
| Auto Care | ❌ | ✅ | ✅ | ✅ |
| Tự động Set QC | ❌ | ✅ (1 page) | ✅ (2 pages) | ✅ (10 pages) |
| Thông báo tự động | ❌ | ✅ | ✅ | ✅ |
| Kiểm tra vi phạm AI | ❌ | 5/ngày | 10/ngày | 30/ngày |
| Nhân viên | ❌ | ❌ | ✅ (5) | ✅ (∞) |
| Affiliate | ❌ | ✅ | ✅ | ✅ |
| Tài khoản quảng cáo | 1 | 3 | 5 | ∞ |

---

## Danh sách tất cả tính năng

### 1. Quản lý chiến dịch
- **Route:** `GET /api/fb/campaigns`
- **File:** `pages/api/fb/campaigns.js` (22 symbols)
- **UI:** `pages/dashboard/index.jsx` (49 symbols)
- **Mô tả:** Đọc danh sách Campaign/Adset từ tất cả tài khoản quảng cáo, hiển thị insights (spend, impressions, clicks, CPA, ROAS, CTR). Hỗ trợ so sánh hôm qua.
- **Meta API:** `/{account_id}/insights`, `/{account_id}/campaigns`, `/{account_id}/adsets`
- **Quyền cần:** `ads_read`

### 2. Bật/tắt campaign
- **Route:** `POST /api/fb/campaign-toggle`
- **File:** `pages/api/fb/campaign-toggle.js` (7 symbols)
- **Mô tả:** Đổi trạng thái ACTIVE ↔ PAUSED cho campaign hoặc adset.
- **Meta API:** `POST /{campaign_id}` với `status`
- **Quyền cần:** `ads_management`

### 3. Điều chỉnh ngân sách
- **Route:** `POST /api/fb/budget-update`
- **File:** `pages/api/fb/budget-update.js` (7 symbols)
- **Mô tả:** Cập nhật `daily_budget` hoặc `lifetime_budget` của adset.
- **Meta API:** `POST /{adset_id}` với budget field
- **Quyền cần:** `ads_management`
- **Bug đã biết:** Nhân `* 100` cho VND (zero-decimal) — sai đơn vị

### 4. Kiểm soát lãi lỗ (Profit)
- **File:** `pages/dashboard/profit.jsx` (27 symbols)
- **Mô tả:** Tính toán lợi nhuận thực tế = doanh thu - chi tiêu quảng cáo.
- **Quyền cần:** `ads_read`

### 5. Report
- **Route:** `GET /api/fb/report`
- **File:** `pages/api/fb/report.js` (6 symbols), `pages/dashboard/report.jsx` (10 symbols)
- **Mô tả:** Tổng hợp hiệu suất quảng cáo theo khoảng thời gian tùy chọn.
- **Quyền cần:** `ads_read`

### 6. Auto Care
- **Route:** `POST /api/fb/autocare`
- **File:** `pages/api/fb/autocare.js` (9 symbols), `pages/dashboard/autocare.jsx` (14 symbols)
- **Mô tả:** Tự động kiểm tra và chăm sóc chiến dịch theo lịch.
- **Quyền cần:** `ads_read`, `ads_management`

### 7. Tự động Set QC ⚠️ (đang có bug)
- **Routes:**
  - `POST /api/fb/autoset-scan` — quét bài viết + tạo ads
  - `GET/POST /api/fb/autoset-config` — cấu hình pages & tài khoản
- **Files:** `pages/api/fb/autoset-scan.js` (8 symbols), `pages/api/fb/autoset-config.js` (7 symbols), `pages/dashboard/autoset.jsx` (20 symbols)
- **Luồng:**
  1. `get_my_pages` → `/me/accounts` → danh sách Pages
  2. `scan` → `/{page_id}/posts` → bài viết mới
  3. `create_ad` → Campaign → Adset → Creative → Ad
- **Meta API dùng:**
  - `/{page_id}?fields=access_token` (lấy Page Access Token)
  - `/{page_id}/posts`
  - `/{account_id}/campaigns`
  - `/{account_id}/adsets`
  - `/{account_id}/adcreatives`
  - `/{account_id}/ads`
- **Quyền cần:** `pages_show_list`, `pages_read_engagement`, `ads_management`
- **Bug hiện tại:** Lỗi Bước 2 - Adset (đang debug)

### 8. Quy tắc tự động ⚠️ (cần kiểm tra)
- **Route:** `POST /api/fb/autoset-run`
- **Files:** `pages/api/fb/autoset-run.js` (13 symbols), `pages/dashboard/automated-rules.jsx` (21 symbols)
- **Mô tả:** Người dùng tạo quy tắc điều kiện (CPA/ROAS/spend) → hệ thống tự động tắt adset hoặc điều chỉnh ngân sách khi thỏa điều kiện.
- **Hành động:** `pause_adset`, `scale_budget`, `reduce_budget`
- **Meta API:** `/{account_id}/adsets` (đọc) + `POST /{adset_id}` (ghi)
- **Quyền cần:** `ads_read`, `ads_management`

### 9. Kiểm tra Vi phạm AI
- **Route:** `POST /api/policycheck`
- **File:** `pages/api/policycheck.js` (8 symbols), `pages/dashboard/policycheck.jsx` (11 symbols)
- **Mô tả:** Nhập nội dung quảng cáo → AI (Claude Haiku) phân tích vi phạm Meta Advertising Policies.
- **AI Model:** `claude-haiku-4-5-20251001` qua shopaikey.com
- **Không dùng Meta API**

### 10. Thông báo tự động
- **Route:** `GET/POST /api/fb/notifications`
- **Files:** `pages/api/fb/notifications.js` (8 symbols), `pages/dashboard/notifications.jsx` (17 symbols)
- **Cron:** `pages/api/cron/notify.js` (10 symbols)
- **Quyền cần:** `ads_read`

### 11. Trợ lý AI Meta Ads
- **Route:** `POST /api/ai/campaign-chat`
- **File:** `pages/api/ai/campaign-chat.js` (5 symbols)
- **Mô tả:** Chatbot AI hỗ trợ tư vấn chiến lược quảng cáo. Đọc dữ liệu campaigns hiện tại để trả lời.
- **AI Model:** `claude-haiku-4-5-20251001` qua shopaikey.com

### 12. Nhân viên (Team)
- **Route:** `GET/POST /api/team`
- **Files:** `pages/api/team.js` (5 symbols), `pages/dashboard/team.jsx` (10 symbols)
- **Mô tả:** Quản lý thành viên nhóm, phân quyền truy cập.

### 13. Affiliate
- **Routes:** `GET/POST /api/user/affiliate`, `/api/affiliate-lookup`
- **Files:** `pages/api/user/affiliate.js` (8 symbols), `pages/dashboard/affiliate.jsx` (14 symbols), `pages/affiliate.jsx` (14 symbols)
- **Mô tả:** Hệ thống giới thiệu — tracking ref code, hoa hồng.

### 14. Hỗ trợ kỹ thuật (Tickets)
- **Route:** `GET/POST /api/user/tickets`
- **Files:** `pages/api/user/tickets.js` (8 symbols), `pages/dashboard/support.jsx` (21 symbols)

### 15. Cron Jobs
| Cron | File | Mô tả |
|---|---|---|
| Offhours | `pages/api/cron/offhours.js` (14 symbols) | Tắt quảng cáo ngoài giờ |
| Notify | `pages/api/cron/notify.js` (10 symbols) | Gửi thông báo tự động |

---

## Các file thư viện lõi (`lib/`)

| File | Symbols | Mô tả |
|---|---|---|
| `auth.js` | 16 | JWT sign/verify, bcrypt, OTP, session cookie `gmap_session` |
| `metaApi.js` | 5 | `callMeta`, `callMetaAll` (pagination), `getUserFbData` |
| `AuthContext.js` | 7 | React context: `useAuth`, `login`, `logout`, `refreshUser` |
| `planLimits.js` | 13 | `PLAN_LIMITS`, `isPlanAllowed` — giới hạn theo gói |
| `supabase.js` | 6 | Singleton Supabase client (Service Role Key) |
| `sendEmail.js` | 4 | Nodemailer SMTP — gửi OTP/thông báo |
| `adminAuth.js` | 5 | Xác thực admin dashboard riêng biệt |
| `LangContext.js` | 7 | i18n context — vi/en |
| `affiliateTrack.js` | 7 | Tracking ref code affiliate |

---

## Auth flow

```
POST /api/auth?action=login
  → bcrypt verify
  → JWT sign (userId, email, plan, fb_connected)
  → Set cookie gmap_session (httpOnly, 30 ngày)

POST /api/auth?action=facebook
  → Tạo FB OAuth URL với scope:
    ads_read, ads_management, public_profile,
    pages_read_engagement, pages_show_list
  → Redirect đến facebook.com/dialog/oauth

GET /api/auth/callback
  → Exchange code → short-lived token
  → Exchange → long-lived token (60 ngày)
  → Lưu vào fb_connections + fb_ad_accounts
```

---

## Database tables (Supabase)

| Table | Mục đích |
|---|---|
| `users` | Tài khoản người dùng (plan, expire_at, facebook_id) |
| `fb_connections` | Token Facebook (access_token, token_expires_at) |
| `fb_ad_accounts` | Danh sách tài khoản quảng cáo (account_id, currency) |
| `user_autoset_pages` | Pages cấu hình trong Tự động Set QC |
| `user_autoset_config` | Config mặc định AutoSet (default_ad_account_id) |
| `autoset_created_ads` | Lịch sử ads đã tạo qua AutoSet |
| `policy_check_logs` | Log kiểm tra vi phạm (giới hạn theo ngày/gói) |
| `automated_rules` | Quy tắc tự động của người dùng |
| `team_members` | Thành viên nhóm |
| `affiliate_codes` | Mã giới thiệu |
| `support_tickets` | Ticket hỗ trợ kỹ thuật |

---

## API Routes tổng hợp (30 routes)

### Auth
| Method | Route | Mô tả |
|---|---|---|
| GET/POST | `/api/auth` | login, logout, me, facebook OAuth, register, OTP |
| GET | `/api/auth/callback` | Facebook OAuth callback |

### Facebook / Meta API
| Method | Route | Mô tả |
|---|---|---|
| GET | `/api/fb/campaigns` | Danh sách campaigns + insights |
| POST | `/api/fb/campaign-toggle` | Bật/tắt campaign |
| POST | `/api/fb/budget-update` | Cập nhật ngân sách adset |
| POST | `/api/fb/autoset-scan` | Quét bài viết + tạo ads (AutoSet) |
| GET/POST | `/api/fb/autoset-config` | Cấu hình AutoSet |
| POST | `/api/fb/autoset-run` | Chạy quy tắc tự động |
| GET/POST | `/api/fb/autoset` | AutoSet (legacy?) |
| POST | `/api/fb/autocare` | Auto Care |
| GET/POST | `/api/fb/notifications` | Thông báo |
| GET | `/api/fb/report` | Report |
| POST | `/api/fb/disconnect` | Ngắt kết nối Facebook |

### AI
| Method | Route | Mô tả |
|---|---|---|
| POST | `/api/ai/campaign-chat` | Trợ lý AI Meta Ads |
| POST | `/api/policycheck` | Kiểm tra vi phạm |

### Payment
| Method | Route | Mô tả |
|---|---|---|
| POST | `/api/payment/payos-create` | Tạo link thanh toán PayOS |
| POST | `/api/payment/payos-webhook` | Nhận webhook PayOS (verify checksum) |

### Cron
| Method | Route | Mô tả |
|---|---|---|
| GET/POST | `/api/cron/notify` | Cron gửi thông báo |
| GET/POST | `/api/cron/offhours` | Cron tắt ads ngoài giờ |

### User
| Method | Route | Mô tả |
|---|---|---|
| GET/POST | `/api/user/affiliate` | Affiliate |
| GET/POST | `/api/user/tickets` | Support tickets |
| GET/POST | `/api/settings` | Cài đặt tài khoản |
| GET/POST | `/api/team` | Quản lý nhân viên |
| POST | `/api/upload-image` | Upload ảnh |

### Admin
| Method | Route | Mô tả |
|---|---|---|
| GET/POST | `/api/admin/web-users` | Quản lý users |
| GET/POST | `/api/admin/tickets` | Quản lý tickets |
| GET/POST | `/api/admin/affiliates` | Quản lý affiliates |
| GET/POST | `/api/admin/site-settings` | Cài đặt site |

---

## Quyền Meta API cần thiết

| Quyền | Tính năng sử dụng |
|---|---|
| `public_profile` | Đăng nhập Facebook |
| `ads_read` | Quản lý chiến dịch, Report, Quy tắc tự động, Auto Care |
| `ads_management` | Bật/tắt camp, điều chỉnh ngân sách, Tự động Set QC, Quy tắc tự động |
| `pages_show_list` | Tự động Set QC (chọn page) |
| `pages_read_engagement` | Tự động Set QC (đọc bài viết) |
| `read_insights` | Report, số liệu insights |

---

## Bug đã biết

| Bug | File | Mô tả |
|---|---|---|
| Budget VND `* 100` | `budget-update.js:34` | VND là zero-decimal, không nhân 100 |
| Adset create lỗi bước 2 | `autoset-scan.js:155` | Đang debug — thiếu param hoặc sai billing_event |

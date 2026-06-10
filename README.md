# Go Meta Ads Pro

Web SaaS quản lý Facebook/Meta Ads thông minh — CPA realtime, cảnh báo tự động, báo cáo lãi/lỗ.

## Tính năng

- **CPA Realtime** — Theo dõi chi phí mỗi đơn hàng theo từng sản phẩm
- **Báo cáo Lãi/Lỗ** — So sánh doanh thu vs chi tiêu tự động
- **AutoCare** — Tự động chăm sóc và tối ưu chiến dịch
- **AutoSet** — Tự động đặt quy tắc theo điều kiện
- **AI Campaign Chat** — Phân tích chiến dịch bằng AI
- **Thông báo thông minh** — Cảnh báo khi CPA vượt ngưỡng
- **Affiliate System** — Hệ thống giới thiệu kiếm hoa hồng
- **Đa ngôn ngữ** — Hỗ trợ Tiếng Việt và English
- **Quản trị Admin** — Dashboard quản lý người dùng, gói dịch vụ, ticket

## Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 14, React 18 |
| Database | Supabase (PostgreSQL) |
| Auth | JWT, bcrypt, OTP email |
| Payment | PayOS v2 |
| Email | Nodemailer |
| Animation | GSAP |
| Deploy | Vercel |

## Cài đặt

```bash
npm install
```

Tạo file `.env.local` với các biến sau:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

JWT_SECRET=

PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

META_APP_ID=
META_APP_SECRET=
```

## Chạy local

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm run start
```

## Cấu trúc thư mục

```
pages/
├── api/
│   ├── auth.js          # Đăng nhập, đăng ký, OTP
│   ├── fb/              # Tích hợp Facebook Ads API
│   ├── payment/         # Thanh toán PayOS
│   ├── ai/              # AI campaign analysis
│   └── admin/           # API quản trị
├── dashboard/           # Dashboard người dùng
├── admin/               # Trang quản trị
├── settings/            # Cài đặt & kết nối Facebook
└── payment/             # Trang thanh toán

components/              # Navbar, Footer, DashboardLayout...
lib/                     # Auth, Supabase, Meta API, i18n...
```

## Deploy

Dự án được cấu hình sẵn cho **Vercel**. Import repo và thêm các biến môi trường trong Settings → Environment Variables.

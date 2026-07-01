# Go Meta Ads Web

Web SaaS quản lý Facebook/Meta Ads — Next.js 14 + Supabase + PayOS.

## Bắt đầu mỗi cuộc trò chuyện

Chạy `codegraph_explore` trước khi trả lời bất kỳ câu hỏi nào về code, kiến trúc hoặc tính năng. Dùng codegraph làm công cụ tìm kiếm chính.

## Stack

| Layer | Công nghệ |
|---|---|
| Frontend + Backend | Next.js 14 (pages router), API Routes tại `pages/api/` |
| Database | Supabase (PostgreSQL) — database thuần, không dùng Auth/Realtime/Edge |
| Auth | JWT tự quản lý (`lib/auth.js`) + bcrypt + OTP email |
| AI | shopaikey.com proxy (OpenAI-compatible), model `claude-haiku-4-5-20251001` |
| Payment | PayOS v2 (`pages/api/payment/`) |
| Email | Nodemailer SMTP |
| Deploy | Vercel + Cron Jobs (`pages/api/cron/`) |

## Kiến trúc

Toàn bộ logic nghiệp vụ trong `pages/api/`. Supabase chỉ lưu data. Không có WebSocket — mọi thứ là HTTP request-response.

## Rules nhanh

- Không expose `SUPABASE_SERVICE_ROLE_KEY` ra client
- Meta API calls phải đi qua `lib/metaApi.js`
- Cron routes phải verify `Authorization: Bearer` header
- PayOS webhook phải verify checksum trước khi xử lý
- Thêm UI mới → luôn thêm translation `vi` lẫn `en`

## Skills & Commands

Xem `.claude/skills/` để biết guidelines chi tiết.
Dùng slash commands: `/spec`, `/plan`, `/review`, `/debug`, `/ship`

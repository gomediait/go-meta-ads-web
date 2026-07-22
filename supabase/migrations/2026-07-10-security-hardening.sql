-- ============================================================
-- Security hardening — chạy 1 lần trong Supabase Dashboard → SQL Editor
-- Bổ sung: rate-limit đăng nhập, 2FA admin, audit log
-- An toàn để chạy lại nhiều lần (IF NOT EXISTS ở mọi nơi)
-- ============================================================

-- ── 1. Rate-limit đăng nhập (dùng chung cho user + admin, và mở rộng được cho API khác) ──

CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  identifier      text PRIMARY KEY,
  attempts        integer NOT NULL DEFAULT 0,
  first_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  locked_until    timestamp with time zone,
  updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

-- ── 2. 2FA (TOTP) cho admin_users ──
-- CREATE IF NOT EXISTS phòng trường hợp database chưa có bảng admin_users
-- (bảng này được dùng bởi /api/admin/login, /api/admin/2fa, /api/admin/verify-2fa
-- nhưng chưa từng được tạo bằng migration nào trong repo trước đây)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.admin_users (
  id            uuid NOT NULL DEFAULT uuid_generate_v4(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text DEFAULT 'superadmin'::text,
  created_at    timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS totp_secret text,
  ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_pending_secret text;

-- ── 3. Audit log cho hành động nhạy cảm (đăng nhập, đổi quyền, thao tác admin) ──

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_type  text NOT NULL,          -- 'admin' | 'user'
  actor_id    text,
  actor_email text,
  action      text NOT NULL,          -- vd 'admin_login', 'team_role_change', 'user_delete'...
  target      text,                   -- vd id/email của đối tượng bị tác động
  meta        jsonb,
  ip          text,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs (action);

-- ── 4. Cấp quyền cho service_role (bắt buộc — code chỉ truy cập 2 bảng này bằng service key) ──
-- Bảng tạo qua SQL Editor không tự động được Supabase cấp quyền như tạo qua Table Editor,
-- thiếu bước này khiến mọi query từ backend bị lỗi "permission denied for table" âm thầm
-- (lib/rateLimit.js và lib/auditLog.js không throw khi query lỗi, nên login vẫn chạy được
-- nhưng rate-limit/audit-log không hoạt động thật).

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO service_role;

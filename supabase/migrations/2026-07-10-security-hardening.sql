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

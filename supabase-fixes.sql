-- ============================================================
-- CHẠY FILE NÀY SAU KHI ĐÃ TẠO XONG CÁC BẢNG TỪ SCHEMA GỐC
-- Supabase Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- Fix 1: affiliates.license_key — bỏ NOT NULL và bỏ FK tới licenses
-- (web app không dùng license_key, chỉ extension mới dùng)
ALTER TABLE public.affiliates
  DROP CONSTRAINT IF EXISTS affiliates_license_key_fkey;

ALTER TABLE public.affiliates
  ALTER COLUMN license_key DROP NOT NULL;

-- Fix 2: affiliates — thêm cột pending_earned bị thiếu
-- (dùng để tách hoa hồng đang chờ xác nhận vs đã xác nhận)
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS pending_earned integer DEFAULT 0;

-- Fix 3: policy_check_logs.license_key — bỏ NOT NULL
-- (web app chỉ lưu user_id, không lưu license_key)
ALTER TABLE public.policy_check_logs
  ALTER COLUMN license_key DROP NOT NULL;

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text UNIQUE,
  password_hash text,
  name text,
  avatar text,
  facebook_id text UNIQUE,
  plan text NOT NULL DEFAULT 'trial'::text,
  status text NOT NULL DEFAULT 'active'::text,
  expire_at timestamp with time zone,
  shop_code text,
  affiliate_code text,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  session_id uuid,
  phone text,
  referred_by text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.licenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'trial'::text,
  status text NOT NULL DEFAULT 'active'::text,
  name text,
  phone text,
  email text,
  shop_code text,
  expire_at timestamp with time zone,
  device_id text,
  device_locked_at timestamp with time zone,
  device_reset_count integer DEFAULT 0,
  device_last_reset timestamp with time zone,
  affiliate_code text,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT licenses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.version_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version text NOT NULL,
  notes text,
  download_url text,
  is_current boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT version_info_pkey PRIMARY KEY (id)
);
CREATE TABLE public.download_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  contact text NOT NULL,
  email text NOT NULL,
  user_type text NOT NULL,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'new'::text,
  admin_note text,
  CONSTRAINT download_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_knowledge (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  file_url text,
  file_type text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_knowledge_pkey PRIMARY KEY (id)
);
CREATE TABLE public.smtp_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  host text,
  port integer DEFAULT 587,
  username text,
  password text,
  from_email text,
  from_name text DEFAULT 'Go Meta Ads Pro'::text,
  is_active boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT smtp_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.policy_docs (
  industry text NOT NULL,
  content text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text DEFAULT 'admin'::text,
  CONSTRAINT policy_docs_pkey PRIMARY KEY (industry)
);
CREATE TABLE public.ai_configs (
  key text NOT NULL,
  value text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_configs_pkey PRIMARY KEY (key)
);
CREATE TABLE public.site_settings (
  key text NOT NULL,
  value text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.email_otps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_otps_pkey PRIMARY KEY (id)
);
CREATE TABLE public.web_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open'::text,
  priority text DEFAULT 'normal'::text,
  replies jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_urls jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT web_tickets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  issue_type text,
  description text NOT NULL,
  status text DEFAULT 'open'::text,
  admin_note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_urls jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fb_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  fb_user_id text NOT NULL,
  access_token text NOT NULL,
  token_expires_at timestamp with time zone,
  scopes text,
  fb_name text,
  fb_email text,
  connected_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fb_connections_pkey PRIMARY KEY (id),
  CONSTRAINT fb_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.fb_ad_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id text NOT NULL,
  account_name text,
  currency text DEFAULT 'VND'::text,
  timezone text,
  account_status integer DEFAULT 1,
  is_selected boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fb_ad_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT fb_ad_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  user_agent text,
  ip text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid,
  email text NOT NULL,
  name text,
  role text DEFAULT 'member'::text,
  permissions jsonb DEFAULT '{"profit": true, "report": false, "autoset": false, "campaigns": true, "policycheck": false}'::jsonb,
  status text DEFAULT 'pending'::text,
  invite_token text UNIQUE,
  invite_expires timestamp with time zone,
  joined_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  CONSTRAINT team_members_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  data jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_products_pkey PRIMARY KEY (id),
  CONSTRAINT user_products_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_offhours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enabled boolean DEFAULT false,
  pause_at text,
  resume_at text,
  sp_filter text,
  last_pause_run text,
  last_resume_run text,
  updated_at timestamp with time zone DEFAULT now(),
  selected_campaigns jsonb DEFAULT '[]'::jsonb,
  selected_adsets jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT user_offhours_pkey PRIMARY KEY (id),
  CONSTRAINT user_offhours_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  master_enabled boolean DEFAULT false,
  tg_chat_id text,
  tg_enabled boolean DEFAULT false,
  lark_url text,
  lark_enabled boolean DEFAULT false,
  noti_audit boolean DEFAULT true,
  noti_critical boolean DEFAULT true,
  noti_report boolean DEFAULT true,
  schedule_type text DEFAULT 'daily'::text,
  schedule_value text DEFAULT '8,12,18'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_action_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  adset_id text,
  adset_name text,
  account_id text,
  account_name text,
  old_value text,
  new_value text,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_action_logs_pkey PRIMARY KEY (id),
  CONSTRAINT user_action_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_autoset_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Rule mới'::text,
  enabled boolean DEFAULT true,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  action text NOT NULL DEFAULT 'pause'::text,
  scale_factor numeric DEFAULT 1.2,
  account_id text DEFAULT 'all'::text,
  time_range text DEFAULT 'today'::text,
  last_run_at timestamp with time zone,
  last_run_summary text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  budget_cap_min numeric DEFAULT 0,
  budget_cap_max numeric DEFAULT 0,
  selected_campaigns jsonb DEFAULT '[]'::jsonb,
  selected_adsets jsonb DEFAULT '[]'::jsonb,
  level text DEFAULT 'adset'::text,
  CONSTRAINT user_autoset_rules_pkey PRIMARY KEY (id),
  CONSTRAINT user_autoset_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_autoset_config (
  user_id uuid NOT NULL,
  default_ad_account_id text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_autoset_config_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_autoset_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_autoset_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  ad_account_id text,
  page_id text NOT NULL,
  page_name text,
  hashtag text DEFAULT ''::text,
  daily_budget integer DEFAULT 100000,
  objective text DEFAULT 'OUTCOME_TRAFFIC'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_autoset_pages_pkey PRIMARY KEY (id),
  CONSTRAINT user_autoset_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.autoset_created_ads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  page_id text NOT NULL,
  post_id text NOT NULL,
  post_message text,
  campaign_id text,
  adset_id text,
  ad_id text,
  ad_account_id text,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'paused'::text,
  CONSTRAINT autoset_created_ads_pkey PRIMARY KEY (id),
  CONSTRAINT autoset_created_ads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.nv_licenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  parent_key text NOT NULL,
  name text,
  email text,
  permissions jsonb DEFAULT '{"profit": true, "report": false, "autoset": false, "campaigns": true}'::jsonb,
  status text NOT NULL DEFAULT 'active'::text,
  expire_at timestamp with time zone,
  device_id text,
  device_locked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nv_licenses_pkey PRIMARY KEY (id),
  CONSTRAINT nv_licenses_parent_key_fkey FOREIGN KEY (parent_key) REFERENCES public.licenses(key)
);
CREATE TABLE public.cpa_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cpa_data_pkey PRIMARY KEY (id),
  CONSTRAINT cpa_data_license_key_fkey FOREIGN KEY (license_key) REFERENCES public.licenses(key)
);
CREATE TABLE public.products_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  data jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_data_pkey PRIMARY KEY (id),
  CONSTRAINT products_data_license_key_fkey FOREIGN KEY (license_key) REFERENCES public.licenses(key)
);
CREATE TABLE public.offhours_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  enabled boolean DEFAULT false,
  pause_at text,
  resume_at text,
  sp_filter text,
  last_pause_run text,
  last_resume_run text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT offhours_config_pkey PRIMARY KEY (id),
  CONSTRAINT offhours_config_license_key_fkey FOREIGN KEY (license_key) REFERENCES public.licenses(key)
);
CREATE TABLE public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  master_enabled boolean DEFAULT false,
  tg_chat_id text,
  tg_enabled boolean DEFAULT false,
  lark_url text,
  lark_enabled boolean DEFAULT false,
  noti_audit boolean DEFAULT true,
  noti_critical boolean DEFAULT true,
  noti_report boolean DEFAULT true,
  schedule_type text DEFAULT 'daily'::text,
  schedule_value text DEFAULT '8,12,18'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT notification_settings_license_key_fkey FOREIGN KEY (license_key) REFERENCES public.licenses(key)
);
CREATE TABLE public.action_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text NOT NULL,
  action_type text NOT NULL,
  adset_id text,
  adset_name text,
  account_id text,
  account_name text,
  old_value text,
  new_value text,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT action_logs_pkey PRIMARY KEY (id),
  CONSTRAINT action_logs_license_key_fkey FOREIGN KEY (license_key) REFERENCES public.licenses(key)
);
CREATE TABLE public.affiliates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  bank_name text,
  bank_account text,
  bank_owner text,
  referral_code text NOT NULL UNIQUE,
  total_earned integer DEFAULT 0,
  pending_earned integer DEFAULT 0,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT affiliates_pkey PRIMARY KEY (id),
  CONSTRAINT affiliates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.policy_check_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  license_key text,
  plan text DEFAULT 'business'::text,
  industry text DEFAULT 'general'::text,
  overall text,
  violations_count integer DEFAULT 0,
  checked_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT policy_check_logs_pkey PRIMARY KEY (id),
  CONSTRAINT policy_check_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text,
  phone text,
  email text,
  shop_name text,
  plan_id text,
  plan_name text,
  billing_tab text NOT NULL,
  price_label text,
  ck_content text,
  referral_code text,
  status text DEFAULT 'pending'::text,
  license_key text,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_url text,
  amount integer,
  days integer,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  paid_at timestamp with time zone,
  order_code bigint,
  user_id uuid,
  plan text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ticket_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  message text NOT NULL,
  image_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ticket_replies_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_replies_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id)
);
CREATE TABLE public.affiliate_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  affiliate_id uuid,
  referred_user_id uuid,
  order_id uuid,
  plan text,
  amount integer,
  commission integer,
  rate numeric,
  type text DEFAULT 'new'::text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT affiliate_conversions_pkey PRIMARY KEY (id),
  CONSTRAINT affiliate_conversions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id),
  CONSTRAINT affiliate_conversions_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.users(id),
  CONSTRAINT affiliate_conversions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.autoset_rule_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  rule_name text,
  action text,
  affected_count integer DEFAULT 0,
  details jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT autoset_rule_logs_pkey PRIMARY KEY (id),
  CONSTRAINT autoset_rule_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_autocare_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text DEFAULT 'Rule mới'::text,
  enabled boolean DEFAULT true,
  pause_at text DEFAULT '22:00'::text,
  resume_at text DEFAULT '06:00'::text,
  selected_campaigns jsonb DEFAULT '[]'::jsonb,
  selected_adsets jsonb DEFAULT '[]'::jsonb,
  account_id text DEFAULT 'all'::text,
  last_pause_run text,
  last_resume_run text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_autocare_rules_pkey PRIMARY KEY (id),
  CONSTRAINT user_autocare_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
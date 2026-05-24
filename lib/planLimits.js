export const PLAN_ORDER = ['trial', 'personal', 'business', 'agency']

export const PLAN_LIMITS = {
  trial: {
    policycheck_daily: 0,
    max_team_members: 0,
    max_ad_accounts: 1,
    trial_days: 3,
    features: {
      campaigns: true,
      profit: true,
      report: true,
      support: true,
      autocare: false,
      autoset: false,
      notifications: false,
      policycheck: false,
      team: false,
      affiliate: false,
    },
  },
  personal: {
    policycheck_daily: 5,
    max_team_members: 0,
    max_ad_accounts: 3,
    features: {
      campaigns: true,
      profit: true,
      report: true,
      support: true,
      autocare: true,
      autoset: true,
      notifications: true,
      policycheck: true,
      team: false,
      affiliate: true,
    },
  },
  business: {
    policycheck_daily: 10,
    max_team_members: 5,
    max_ad_accounts: 5,
    features: {
      campaigns: true,
      profit: true,
      report: true,
      support: true,
      autocare: true,
      autoset: true,
      notifications: true,
      policycheck: true,
      team: true,
      affiliate: true,
    },
  },
  agency: {
    policycheck_daily: 30,
    max_team_members: Infinity,
    max_ad_accounts: Infinity,
    features: {
      campaigns: true,
      profit: true,
      report: true,
      support: true,
      autocare: true,
      autoset: true,
      notifications: true,
      policycheck: true,
      team: true,
      affiliate: true,
    },
  },
}

export function isPlanAllowed(plan, feature) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial
  return !!limits.features[feature]
}

export function getPolicyCheckLimit(plan) {
  return (PLAN_LIMITS[plan] || PLAN_LIMITS.trial).policycheck_daily
}

export function getMaxTeamMembers(plan) {
  return (PLAN_LIMITS[plan] || PLAN_LIMITS.trial).max_team_members
}

export function getMaxAdAccounts(plan) {
  return (PLAN_LIMITS[plan] || PLAN_LIMITS.trial).max_ad_accounts
}

// Commission rates for affiliate
export const AFFILIATE_COMMISSION = {
  personal: { new: 0.10, renewal: 0.03 },
  business: { new: 0.12, renewal: 0.03 },
  agency:   { new: 0.15, renewal: 0.03 },
}

// Whitelist of major consumer email providers (always allowed)
export const MAJOR_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.it', 'hotmail.de', 'hotmail.es',
  'live.com', 'live.co.uk', 'live.fr', 'live.it', 'live.nl', 'live.com.au', 'live.com.sg', 'live.com.vn',
  'msn.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'yahoo.com.au', 'yahoo.fr', 'yahoo.de', 'yahoo.it',
  'yahoo.es', 'yahoo.com.vn', 'ymail.com', 'rocketmail.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'protonmail.ch', 'proton.me',
  'zoho.com',
  'aol.com',
])

// Known disposable/temp email services — always blocked
const BLOCKED_EMAIL_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info',
  'guerrillamailblock.com', 'grr.la', 'sharklasers.com', 'spam4.me',
  'tempmail.com', 'temp-mail.org', 'tempmail.net', 'tempr.email', 'tempemail.net',
  'throwaway.email', 'throwam.com',
  'trashmail.com', 'trashmail.net', 'trashmail.org', 'trashmail.me', 'trashmail.at',
  'yopmail.com', 'yopmail.fr', 'dispostable.com', 'discard.email',
  'mailnesia.com', 'mailnull.com', 'maildrop.cc', 'mailboxy.fun', 'mailtemp.info',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org', 'spamspot.com', 'spam.la',
  'spamherelots.com', 'spamhereplease.com', 'spoofmail.de',
  'fakeinbox.com', 'inboxbear.com', 'deadaddress.com', 'nowaste.club',
  'safetypost.de', 'lol.ovpn.to',
  'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj',
  'speed.1s.fr', 'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  'tmailinator.com',
])

// Returns true if email domain is allowed for registration
export function isAllowedEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) return false
  // Always allow major providers
  if (MAJOR_EMAIL_PROVIDERS.has(domain)) return true
  // Allow company-style domains: must have at least one dot, each segment ≥ 2 chars
  const parts = domain.split('.')
  if (parts.length >= 2 && parts.every(p => p.length >= 2)) return true
  return false
}

// Kept for any existing references
export function isDisposableEmail(email) {
  return !isAllowedEmail(email)
}

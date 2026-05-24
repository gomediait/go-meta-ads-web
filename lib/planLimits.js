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

// Disposable email domains to block
export const BLOCKED_EMAIL_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.biz', 'guerrillamail.de',
  'tempmail.com', 'temp-mail.org', 'tempmail.net',
  'throwaway.email', 'trashmail.com', 'trashmail.net',
  'trashmail.org', 'trashmail.me', 'trashmail.at',
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf',
  'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx',
  'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
  'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'spam4.me', 'dispostable.com',
  'mailnesia.com', 'mailnull.com', 'spamgourmet.com',
  'spamgourmet.net', 'spamgourmet.org', 'spamspot.com',
  'spam.la', 'tempr.email', 'discard.email',
  'spamherelots.com', 'maildrop.cc', 'mailboxy.fun',
  'inboxbear.com', 'fakeinbox.com', 'tempemail.net',
  'tmailinator.com', 'throwam.com', 'safetypost.de',
  'lol.ovpn.to', 'spamhereplease.com', 'spoofmail.de',
  'deadaddress.com', 'nowaste.club', 'mailtemp.info',
])

export function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return true
  return BLOCKED_EMAIL_DOMAINS.has(domain)
}

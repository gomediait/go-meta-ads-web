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
  'zoho.com', 'zohomail.com',
  'aol.com',
  'tutanota.com', 'tuta.io',
  'fastmail.com', 'fastmail.fm',
  'pm.me',
])

// Known disposable/temp email services — always blocked
const BLOCKED_EMAIL_DOMAINS = new Set([
  // 10minutemail variants
  '10minutemail.com', '10minutemail.net', '10minutemail.org', '10minutemail.de',
  '10minutemail.co.uk', '10minutemail.io', '10minemail.com',
  // Mailinator family
  'mailinator.com', 'mailinator.net', 'mailinator.org', 'mailinator2.com',
  'suremail.info', 'inoutmail.com', 'inoutmail.de', 'inoutmail.eu', 'inoutmail.info',
  // Guerrilla
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info',
  'guerrillamailblock.com', 'grr.la', 'sharklasers.com',
  // Temp/Throwaway
  'tempmail.com', 'tempmail.net', 'tempmail.org', 'tempmail.co', 'tempmail.us',
  'temp-mail.org', 'temp-mail.com', 'temp-mail.io', 'temp-mail.ru',
  'tempr.email', 'tempemail.net', 'tempemail.com',
  'throwaway.email', 'throwam.com', 'throwam.net',
  'discard.email', 'discardmail.com', 'discardmail.de', 'disposablemail.com',
  // Trash mail
  'trashmail.com', 'trashmail.net', 'trashmail.org', 'trashmail.me',
  'trashmail.at', 'trashmail.io', 'trashmail.fr', 'trashmail.xyz',
  'trash-mail.at', 'trash-mail.com', 'trashinbox.com',
  // Yop
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx',
  // Mail drop
  'maildrop.cc', 'mailnull.com', 'mailnesia.com', 'mailboxy.fun',
  'mailtemp.info', 'mailtemp.org', 'mailtemp.net', 'mailtemp.co',
  'mail-temp.com', 'fakeinbox.com', 'fakemailgenerator.com',
  'fakemailgenerator.net', 'getairmail.com', 'getairmail.net',
  // Spam services
  'spam4.me', 'spam.la', 'spamspot.com',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  'spamherelots.com', 'spamhereplease.com', 'spoofmail.de',
  // Dispostable / other
  'dispostable.com', 'inboxbear.com', 'deadaddress.com', 'nowaste.club',
  'safetypost.de', 'lol.ovpn.to', 'tmailinator.com',
  'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  'speed.1s.fr', 'mega.zik.dj',
  // Other known disposable
  'mohmal.com', 'mytemp.email', 'mytrashmail.com',
  'nwytg.net', 'objectmail.com', 'obobbo.com',
  'oneoffemail.com', 'onewaymail.com', 'online.ms',
  'outlawspam.com', 'owlpic.com', 'pjjkp.com',
  'plexolan.de', 'politikerclub.de', 'poofy.org',
  'ppetw.com', 'prtnx.com', 'punkass.com',
  'put2.net', 'qisdo.com', 'qisoa.com',
  'qothmail.com', 'rklips.com', 'rkomo.com',
  'rppkn.com', 'rtrtr.com', 's0ny.net',
  'sandelf.de', 'sast.ro', 'senseless-entertainment.com',
  'sharedmailbox.org', 'sharklasers.com', 'shieldedmail.com',
  'shitmail.de', 'shitmail.me', 'shhmail.com',
  'shortmail.net', 'sibmail.com', 'sofimail.com',
  'spam.care', 'spam.su', 'spam.website',
  'spamail.de', 'spamavert.com', 'spambog.com',
  'spambog.de', 'spambog.ru', 'spamfree24.de',
  'spamfree24.eu', 'spamfree24.info', 'spamfree24.net',
  'spamfree24.org', 'spamgoes.in', 'spamhole.com',
  'spaminmotion.com', 'spamkill.info', 'spamoff.de',
  'spamobox.com', 'spamstack.net', 'spamthis.co.uk',
  'spamthisplease.com', 'spamtrail.com', 'super-auswahl.de',
  'tafmail.com', 'tagyourself.com', 'techemail.com',
  'telecomix.pl', 'teleworm.com', 'teleworm.us',
  'temp-mail.de', 'temp4.email', 'tempail.com',
  'tempalias.com', 'tempcloud.info', 'tempe.email',
  'tempinbox.com', 'tempinbox.net', 'tempsky.com',
  'temporary-mail.net', 'temporary-email.com', 'tempthe.net',
  'thisisnotmyrealemail.com', 'throwam.com', 'throwam.org',
  'throwm.me', 'tilien.com', 'tittbit.in',
  'tizi.com', 'tmail.com', 'tmailc.com',
  'tmails.net', 'toiea.com', 'tradermail.info',
  'trash2009.com', 'trashdevil.com', 'trashdevil.de',
  'trashemail.de', 'trashinbox.net', 'trbvm.com',
  'trollproject.com', 'trvlr.org', 'turual.com',
  'twinmail.de', 'tyldd.com', 'uggsrock.com',
  'umail.net', 'uroid.com', 'used.hu',
  'venompen.com', 'veryrealemail.com', 'viditag.com',
  'viewcastmedia.com', 'viewcastmedia.net', 'viewcastmedia.org',
  'vmani.com', 'vomoto.com', 'vpn.st',
  'vubby.com', 'wasteland.rfc822.org', 'webm4il.info',
  'wegwerfadresse.de', 'wegwerfemail.de', 'wegwerfemail.net',
  'wegwerfemail.org', 'wegwerfmail.de', 'wegwerfmail.net',
  'wegwerfmail.org', 'wetrainbayarea.com', 'wetrainbayarea.org',
  'wh4f.org', 'whatpaas.com', 'whyspam.me',
  'wickmail.net', 'wilemail.com', 'willhackforfood.biz',
  'wmail.cf', 'writeme.us', 'wronghead.com',
  'wuzupmail.net', 'www.e4ward.com', 'www.mailinator.com',
  'xagloo.com', 'xemaps.com', 'xents.com',
  'xmaily.com', 'xoxy.net', 'xyzfree.net',
  'yapped.net', 'yeah.net', 'yep.it',
  'zetmail.com', 'zippymail.info', 'zoemail.net',
  'zoemail.org', 'zomg.info',
  // Vietnamese disposable patterns
  'vmailpro.net', 'inboxd.me', 'tempemailco.com',
])

// TLDs that strongly suggest company/institutional email
const CORPORATE_TLDS = new Set([
  'vn', 'com.vn', 'net.vn', 'org.vn', 'edu.vn', 'gov.vn', 'ac.vn',
  'edu', 'edu.au', 'edu.sg', 'edu.my', 'edu.ph',
  'gov', 'gov.au', 'gov.sg',
  'ac.uk', 'ac.nz', 'ac.id', 'ac.jp',
])

// Returns true if email domain is allowed for registration
export function isAllowedEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return false

  // Always block known disposable services
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) return false

  // Block sub-domains of known disposable services (e.g. anything.mailinator.com)
  for (const blocked of BLOCKED_EMAIL_DOMAINS) {
    if (domain.endsWith('.' + blocked)) return false
  }

  // Always allow major consumer providers
  if (MAJOR_EMAIL_PROVIDERS.has(domain)) return true

  // Allow known corporate/institutional TLDs
  for (const tld of CORPORATE_TLDS) {
    if (domain.endsWith('.' + tld) || domain === tld) return true
  }

  // For all other domains: require
  // 1. Standard TLD (.com, .net, .org, .io, .co, .biz, .info, etc.)
  // 2. Domain name part ≥ 4 characters (filters out ad.me, ab.cd etc.)
  // 3. No numeric-only domain names (cheap disposable pattern)
  const parts = domain.split('.')
  if (parts.length < 2) return false
  const domainName = parts.slice(0, -1).join('.')
  const tld = parts[parts.length - 1]

  const allowedTlds = new Set(['com', 'net', 'org', 'io', 'co', 'biz', 'info', 'app', 'dev', 'tech', 'online', 'site', 'web'])
  if (!allowedTlds.has(tld)) return false
  if (domainName.length < 4) return false
  if (/^\d+$/.test(domainName)) return false  // purely numeric domain
  if (/^[a-z]{1,3}\d{3,}$/.test(domainName)) return false  // pattern like ab123456 (random)

  return true
}

// Kept for any existing references
export function isDisposableEmail(email) {
  return !isAllowedEmail(email)
}

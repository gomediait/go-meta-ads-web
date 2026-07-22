import jwt from 'jsonwebtoken'
import { getSupabase } from '../../../lib/supabase'
import { encryptToken } from '../../../lib/tokenCrypto'

const JWT_SECRET = process.env.JWT_SECRET || 'gmap-secret-change-in-prod'

export default async function handler(req, res) {
  const { code, state, error: fbError } = req.query

  if (fbError) {
    return res.redirect(`/settings/connect-facebook?error=${encodeURIComponent(fbError)}`)
  }

  // Verify state JWT (10-minute window)
  let statePayload
  try {
    statePayload = jwt.verify(state, JWT_SECRET)
  } catch {
    return res.redirect('/settings/connect-facebook?error=state_invalid')
  }

  const { user_id } = statePayload
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adsmeta.gonetwork.vn'
  const redirectUri = `${siteUrl}/api/auth/callback`

  // Exchange code → short-lived user token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v23.0/oauth/access_token?` +
    new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code })
  )
  const tokenData = await tokenRes.json()

  if (tokenData.error) {
    console.error('FB token exchange error:', tokenData.error)
    return res.redirect(`/settings/connect-facebook?error=${encodeURIComponent(tokenData.error.message)}`)
  }

  const shortToken = tokenData.access_token

  // Exchange short-lived → long-lived token (60 days)
  const longTokenRes = await fetch(
    `https://graph.facebook.com/v23.0/oauth/access_token?` +
    new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    })
  )
  const longTokenData = await longTokenRes.json()

  if (longTokenData.error) {
    console.error('FB long token error:', longTokenData.error)
    return res.redirect(`/settings/connect-facebook?error=${encodeURIComponent(longTokenData.error.message)}`)
  }

  const longToken = longTokenData.access_token
  const expiresIn = longTokenData.expires_in || 5184000 // default 60 days
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

  // Get FB user profile
  const profileRes = await fetch(
    `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${longToken}`
  )
  const profile = await profileRes.json()

  if (profile.error) {
    return res.redirect(`/settings/connect-facebook?error=profile_fetch_failed`)
  }

  // Get ad accounts
  const accountsRes = await fetch(
    `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,currency,timezone_name,account_status&access_token=${longToken}&limit=50`
  )
  const accountsData = await accountsRes.json()

  const sb = getSupabase()

  // Upsert fb_connections
  const { error: connErr } = await sb.from('fb_connections').upsert({
    user_id,
    fb_user_id: profile.id,
    fb_name: profile.name,
    fb_email: profile.email || null,
    access_token: encryptToken(longToken),
    token_expires_at: tokenExpiresAt,
    scopes: 'ads_read,ads_management,read_insights,public_profile,email',
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (connErr) {
    console.error('Supabase fb_connections upsert error:', connErr)
    return res.redirect('/settings/connect-facebook?error=db_error')
  }

  // Update users.facebook_id
  await sb.from('users').update({ facebook_id: profile.id }).eq('id', user_id)

  // Save ad accounts
  if (accountsData.data?.length) {
    const accounts = accountsData.data.map(acc => ({
      user_id,
      account_id: acc.id,
      account_name: acc.name,
      currency: acc.currency || 'VND',
      timezone: acc.timezone_name || null,
      account_status: acc.account_status || 1,
      is_selected: true,
    }))

    // Replace existing accounts
    await sb.from('fb_ad_accounts').delete().eq('user_id', user_id)
    await sb.from('fb_ad_accounts').insert(accounts)
  }

  return res.redirect('/settings/connect-facebook?success=1')
}

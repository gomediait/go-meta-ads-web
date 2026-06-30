const META_BASE = 'https://graph.facebook.com/v23.0'

export async function callMeta(path, token, params = {}) {
  const query = new URLSearchParams({ access_token: token, ...params }).toString()
  const url = `${META_BASE}/${path}?${query}`
  try {
    const res = await fetch(url)
    const json = await res.json()
    if (json.error) {
      console.error('[MetaAPI] Error:', json.error)
      if (json.error.code === 190) {
        json.error.message = 'TOKEN_EXPIRED'
      }
    }
    return json
  } catch (err) {
    console.error('[MetaAPI] Fetch error:', err)
    return { error: { message: err.message } }
  }
}

// Fetch ALL pages — follows paging.next until exhausted or maxItems reached
export async function callMetaAll(path, token, params = {}, maxItems = 10000) {
  const first = await callMeta(path, token, { limit: '500', ...params })
  if (first?.error || !Array.isArray(first?.data)) return first

  let all = [...first.data]
  let nextUrl = first.paging?.next

  while (nextUrl && all.length < maxItems) {
    try {
      const res  = await fetch(nextUrl)
      const json = await res.json()
      if (json.error || !Array.isArray(json.data)) break
      all.push(...json.data)
      nextUrl = json.paging?.next || null
    } catch { break }
  }

  return { data: all }
}

export async function getUserFbData(userId, sb) {
  try {
    const { data: conn, error: connErr } = await sb
      .from('fb_connections')
      .select('access_token, fb_user_id, fb_name, token_expires_at')
      .eq('user_id', userId)
      .single()

    if (connErr || !conn) return null

    const { data: accounts, error: accErr } = await sb
      .from('fb_ad_accounts')
      .select('account_id, account_name, currency')
      .eq('user_id', userId)
      .eq('is_selected', true)

    if (accErr) return null

    return {
      token: conn.access_token,
      accounts: accounts || [],
      conn
    }
  } catch (err) {
    console.error('[getUserFbData] Error:', err)
    return null
  }
}

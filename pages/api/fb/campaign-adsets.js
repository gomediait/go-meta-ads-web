import { getUserFromReq } from '../../../lib/auth'
import { getSupabase } from '../../../lib/supabase'
import { getUserFbData, callMetaAll } from '../../../lib/metaApi'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = getUserFromReq(req)
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' })

  const { campaign_id } = req.query
  if (!campaign_id) return res.status(400).json({ error: 'Thiếu campaign_id' })

  const sb = getSupabase()
  const fbData = await getUserFbData(user.id, sb)
  if (!fbData) return res.json({ ok: true, adsets: [] })

  const { token, accounts } = fbData
  const allAdsets = []

  for (const account of accounts) {
    try {
      const result = await callMetaAll(
        `${account.account_id}/adsets`,
        token,
        {
          fields: 'id,name,status,effective_status',
          filtering: JSON.stringify([
            { field: 'campaign.id', operator: 'EQUAL', value: campaign_id }
          ]),
          limit: '200',
        }
      )
      if (result?.data) {
        for (const a of result.data) {
          allAdsets.push({
            id: a.id,
            name: a.name,
            status: a.status,
            effective_status: a.effective_status,
          })
        }
      }
    } catch (err) {
      console.error('[campaign-adsets] Error for account', account.account_id, err)
    }
  }

  return res.json({ ok: true, adsets: allAdsets })
}

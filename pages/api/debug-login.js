import { getSupabase } from '../../lib/supabase'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  const db = getSupabase()
  const email = 'ngvanan1805@gmail.com'
  const password = '123456'

  const { data: user, error } = await db.from('users')
    .select('id,email,password_hash,status,plan')
    .eq('email', email).single()

  if (!user) return res.json({ found: false, error: error?.message })

  const match = bcrypt.compareSync(password, user.password_hash || '')

  return res.json({
    found: true,
    email: user.email,
    status: user.status,
    plan: user.plan,
    hash_prefix: (user.password_hash || '').substring(0, 20),
    password_match: match
  })
}

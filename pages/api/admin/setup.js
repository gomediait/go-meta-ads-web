import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ ok: false, error: 'Not found' })
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Kiểm tra xem bảng có tồn tại chưa
  const { data: users, error: checkErr } = await sb.from('admin_users').select('*')
  if (checkErr) {
    return res.json({ ok: false, error: 'Table admin_users does not exist. Please run SQL first: ' + checkErr.message })
  }

  if (users && users.length > 0) {
    return res.json({ ok: false, error: 'Admin user already exists!' })
  }

  const hash = bcrypt.hashSync('admin123', 10)
  
  const { data, error } = await sb.from('admin_users').insert([{
    email: 'admin@gomedia.com',
    password_hash: hash,
    role: 'superadmin'
  }])

  if (error) {
    return res.json({ ok: false, error: error.message })
  }
  return res.json({ ok: true, message: 'Created admin user successfully' })
}

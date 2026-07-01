export default function handler(req, res) {
  res.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    supabase_key_prefix: (process.env.SUPABASE_SERVICE_KEY || 'NOT SET').substring(0, 20),
    anon_key_prefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT SET').substring(0, 20),
  })
}

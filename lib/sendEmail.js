import nodemailer from 'nodemailer'
import { getSupabase } from './supabase'

export async function sendEmail(to, subject, html) {
  try {
    const sb = getSupabase()
    const { data: smtp } = await sb.from('smtp_settings').select('*').eq('is_active', true).single()
    if (!smtp?.host || !smtp?.username || !smtp?.password) return false

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port || 587,
      secure: smtp.port === 465,
      auth: { user: smtp.username, pass: smtp.password },
      tls: { rejectUnauthorized: false },
    })
    await transporter.sendMail({
      from: `"${smtp.from_name || 'Go Meta Ads Pro'}" <${smtp.from_email || smtp.username}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (e) {
    console.warn('[Email send error]', e.message)
    return false
  }
}

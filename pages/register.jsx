import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Mật khẩu xác nhận không khớp')
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự')
    setLoading(true)
    try {
      await register(form.email, form.password, form.name)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Đăng ký — Go Meta Ads Pro</title></Head>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.png" alt="logo" onError={e => e.target.style.display='none'} />
            <h1>Tạo tài khoản miễn phí</h1>
            <p>Dùng thử 7 ngày — không cần thẻ tín dụng</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Họ và tên</label>
              <input type="text" placeholder="Nguyễn Văn A" autoComplete="name"
                value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="email@example.com" autoComplete="email"
                value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <input type="password" placeholder="Tối thiểu 6 ký tự" autoComplete="new-password"
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
            </div>
            <div className="field">
              <label>Xác nhận mật khẩu</label>
              <input type="password" placeholder="Nhập lại mật khẩu" autoComplete="new-password"
                value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} required />
            </div>

            {error && <div className="err-msg">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '⏳ Đang tạo tài khoản...' : '🚀 Bắt đầu dùng thử miễn phí'}
            </button>

            <p className="terms-note">
              Bằng cách đăng ký, bạn đồng ý với <Link href="/terms">Điều khoản dịch vụ</Link> và <Link href="/privacy">Chính sách bảo mật</Link>.
            </p>
          </form>

          <div className="auth-footer">
            Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #0c2a72 0%, #1a3a8f 60%, #0f1117 100%);
          padding: 20px;
        }
        .auth-card {
          background: #1e2536; border: 1px solid #2a3347; border-radius: 18px;
          padding: 36px 32px; width: 100%; max-width: 420px;
          box-shadow: 0 24px 60px rgba(0,0,0,.6);
        }
        .auth-logo { text-align: center; margin-bottom: 24px; }
        .auth-logo img { width: 48px; height: 48px; object-fit: contain; border-radius: 10px; margin-bottom: 10px; }
        .auth-logo h1 { font-size: 18px; font-weight: 700; color: #e8eaf0; margin-bottom: 4px; }
        .auth-logo p  { font-size: 12px; color: #00c48c; font-weight: 600; }

        .field { margin-bottom: 12px; }
        .field label { display: block; font-size: 12px; font-weight: 600; color: #6b7a99; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .4px; }
        .field input {
          width: 100%; background: #161b27; border: 1.5px solid #2a3347;
          border-radius: 9px; padding: 10px 14px; font-size: 14px; color: #e8eaf0;
          outline: none; transition: border-color .15s;
        }
        .field input:focus { border-color: #3b82f6; }

        .err-msg { background: rgba(255,69,96,.12); border: 1px solid rgba(255,69,96,.3); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #ff8fa3; margin-bottom: 12px; }

        .submit-btn {
          width: 100%; background: #fe5f01; border: none; border-radius: 10px;
          padding: 13px; font-size: 15px; font-weight: 700; color: #fff;
          cursor: pointer; transition: opacity .15s; margin-top: 6px;
        }
        .submit-btn:hover:not(:disabled) { opacity: .88; }
        .submit-btn:disabled { opacity: .5; cursor: not-allowed; }

        .terms-note { font-size: 11px; color: #6b7a99; margin-top: 10px; text-align: center; line-height: 1.6; }
        .terms-note a { color: #3b82f6; text-decoration: none; }
        .terms-note a:hover { text-decoration: underline; }

        .auth-footer { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7a99; }
        .auth-footer a { color: #fe5f01; text-decoration: none; font-weight: 600; }
        .auth-footer a:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}

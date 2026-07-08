import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/LangContext'

export default function Register() {
  const { register } = useAuth()
  const router = useRouter()
  const { lang, setLang, t } = useLang()
  const tr = t.auth?.register || {}
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', referral_code: '', otp: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // OTP state
  const [otpSending, setOtpSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef(null)

  useEffect(() => {
    const ref = router.query.ref
    if (ref) setForm(f => ({ ...f, referral_code: ref }))
  }, [router.query.ref])

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [])

  function startCountdown() {
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleSendOtp() {
    setOtpError('')
    if (!form.email) return setOtpError(lang === 'en' ? 'Please enter your email first' : 'Vui lòng nhập email trước')
    setOtpSending(true)
    try {
      const r = await fetch('/api/auth?action=send_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      const d = await r.json()
      if (!r.ok) return setOtpError(d.error || (tr.errSendFail || 'Gửi mã thất bại'))
      setOtpSent(true)
      setOtpVerified(false)
      setForm(f => ({ ...f, otp: '' }))
      startCountdown()
    } catch {
      setOtpError(tr.errNetwork || 'Lỗi kết nối')
    } finally {
      setOtpSending(false)
    }
  }

  async function handleVerifyOtp() {
    setOtpError('')
    if (form.otp.length !== 6) return setOtpError(tr.errOtpDigits || 'Mã gồm 6 chữ số')
    try {
      const r = await fetch('/api/auth?action=verify_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      })
      const d = await r.json()
      if (!r.ok) return setOtpError(d.error || (tr.errOtpWrong || 'Mã không đúng'))
      setOtpVerified(true)
      setOtpError('')
    } catch {
      setOtpError(tr.errNetwork || 'Lỗi kết nối')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!otpVerified) return setError(tr.errVerifyFirst || 'Vui lòng xác minh email trước khi đăng ký')
    if (form.password !== form.confirm) return setError(tr.errPwdMismatch || 'Mật khẩu xác nhận không khớp')
    if (form.password.length < 6) return setError(tr.errPwdShort || 'Mật khẩu tối thiểu 6 ký tự')
    if (!form.phone.trim()) return setError(tr.errPhoneReq || 'Vui lòng nhập số điện thoại')
    setLoading(true)
    try {
      await register(form.email, form.password, form.name, form.phone, form.referral_code, form.otp)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Go Meta Ads Pro</title></Head>
      <div className="auth-page">
        <div className="auth-card">
          <button className="lang-toggle" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
            {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
          </button>
          <div className="auth-logo">
            <img src="/logo.png" alt="logo" onError={e => e.target.style.display='none'} />
            <h1>{tr.title || 'Tạo tài khoản miễn phí'}</h1>
            <p>{tr.subtitle || 'Dùng thử 3 ngày — không cần thẻ tín dụng'}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Email + OTP */}
            <div className="step-label">{tr.step1 || 'Bước 1 — Xác minh email'}</div>

            <div className="field">
              <label>{tr.email || 'Email'} <span className="field-hint">{tr.emailHint || 'Gmail, Outlook, Yahoo, email công ty...'}</span></label>
              <div className="otp-row">
                <input type="email" placeholder="email@gmail.com" autoComplete="email"
                  value={form.email}
                  onChange={e => { setForm(f => ({...f, email: e.target.value})); setOtpSent(false); setOtpVerified(false) }}
                  disabled={otpVerified}
                  required />
                <button type="button" className="otp-btn" onClick={handleSendOtp}
                  disabled={!form.email || otpSending || countdown > 0 || otpVerified}>
                  {otpSending ? '...' : countdown > 0 ? `${countdown}s` : otpSent ? (tr.resendOtp || 'Gửi lại') : (tr.sendOtp || 'Gửi mã')}
                </button>
              </div>
            </div>

            {otpSent && !otpVerified && (
              <div className="field">
                <label>{tr.otpLabel || 'Mã xác nhận'} <span className="field-hint">{tr.otpHint || '6 số gửi về email của bạn'}</span></label>
                <div className="otp-row">
                  <input type="text" placeholder="_ _ _ _ _ _" maxLength={6} inputMode="numeric"
                    value={form.otp}
                    onChange={e => setForm(f => ({...f, otp: e.target.value.replace(/\D/g, '')}))}
                    style={{ letterSpacing: 6, fontSize: 18, textAlign: 'center' }} />
                  <button type="button" className="otp-btn confirm" onClick={handleVerifyOtp}
                    disabled={form.otp.length !== 6}>
                    {tr.confirmOtp || 'Xác nhận'}
                  </button>
                </div>
                {otpError && <div className="otp-err">{otpError}</div>}
              </div>
            )}

            {otpVerified && (
              <div className="verified-badge">{tr.verified || '✅ Email đã được xác minh'}</div>
            )}

            {/* Step 2: Account info */}
            <div className="step-label" style={{ marginTop: 20 }}>{tr.step2 || 'Bước 2 — Thông tin tài khoản'}</div>

            <div className="field">
              <label>{tr.name || 'Họ và tên'}</label>
              <input type="text" placeholder={tr.namePh || 'Nguyễn Văn A'} autoComplete="name"
                value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="field">
              <label>{tr.phone || 'Số điện thoại'}</label>
              <input type="tel" placeholder={tr.phonePh || '0912 345 678'} autoComplete="tel"
                value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} required />
            </div>
            <div className="field">
              <label>{tr.password || 'Mật khẩu'}</label>
              <input type="password" placeholder={tr.passwordPh || 'Tối thiểu 6 ký tự'} autoComplete="new-password"
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
            </div>
            <div className="field">
              <label>{tr.confirm || 'Xác nhận mật khẩu'}</label>
              <input type="password" placeholder={tr.confirmPh || 'Nhập lại mật khẩu'} autoComplete="new-password"
                value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} required />
            </div>
            <div className="field">
              <label>{tr.referral || 'Mã giới thiệu'} <span className="field-hint">{tr.referralHint || '(tùy chọn)'}</span></label>
              <input type="text" placeholder={tr.referralPh || 'Nhập mã nếu có'} style={{ textTransform: 'uppercase' }}
                value={form.referral_code} onChange={e => setForm(f => ({...f, referral_code: e.target.value.toUpperCase()}))} />
            </div>

            {error && <div className="err-msg">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading || !otpVerified}>
              {loading ? (tr.submitting || '⏳ Đang tạo tài khoản...') : (tr.submit || '🚀 Bắt đầu dùng thử miễn phí')}
            </button>

            <p className="terms-note">
              {tr.termsNote || 'Bằng cách đăng ký, bạn đồng ý với'} <Link href="/terms">{tr.termsLink || 'Điều khoản dịch vụ'}</Link> {tr.and || 'và'} <Link href="/privacy">{tr.privacyLink || 'Chính sách bảo mật'}</Link>.
            </p>
          </form>

          <div className="auth-footer">
            {tr.hasAccount || 'Đã có tài khoản?'} <Link href="/login">{tr.loginLink || 'Đăng nhập'}</Link>
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
          padding: 36px 32px; width: 100%; max-width: 440px;
          box-shadow: 0 24px 60px rgba(0,0,0,.6);
        }
        .lang-toggle {
          position: absolute; top: 14px; right: 14px;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18);
          border-radius: 7px; padding: 4px 10px; font-size: 11px; font-weight: 700;
          color: #e8eaf0; cursor: pointer; transition: background .15s;
        }
        .lang-toggle:hover { background: rgba(255,255,255,.16); }
        .auth-card { position: relative; }
        .auth-logo { text-align: center; margin-bottom: 20px; }
        .auth-logo img { width: 48px; height: 48px; object-fit: contain; border-radius: 10px; margin-bottom: 10px; }
        .auth-logo h1 { font-size: 18px; font-weight: 700; color: #e8eaf0; margin-bottom: 4px; }
        .auth-logo p  { font-size: 12px; color: #00c48c; font-weight: 600; }

        .step-label {
          font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase;
          letter-spacing: .6px; margin-bottom: 10px; padding-bottom: 6px;
          border-bottom: 1px solid #2a3347;
        }

        .field { margin-bottom: 12px; }
        .field label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #6b7a99; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .4px; }
        .field-hint { font-size: 10px; color: #3b82f6; text-transform: none; font-weight: 400; letter-spacing: 0; }
        .field input {
          width: 100%; background: #161b27; border: 1.5px solid #2a3347;
          border-radius: 9px; padding: 10px 14px; font-size: 14px; color: #e8eaf0;
          outline: none; transition: border-color .15s; font-family: inherit;
        }
        .field input:focus { border-color: #3b82f6; }
        .field input:disabled { opacity: .6; cursor: not-allowed; }

        .otp-row { display: flex; gap: 8px; }
        .otp-row input { flex: 1; }
        .otp-btn {
          background: #3b82f6; border: none; border-radius: 9px; padding: 0 14px;
          font-size: 12px; font-weight: 700; color: #fff; cursor: pointer;
          white-space: nowrap; font-family: inherit; transition: opacity .15s; min-width: 76px;
        }
        .otp-btn.confirm { background: #10b981; }
        .otp-btn:hover:not(:disabled) { opacity: .85; }
        .otp-btn:disabled { opacity: .4; cursor: not-allowed; }
        .otp-err { font-size: 12px; color: #ff8fa3; margin-top: 5px; }

        .verified-badge {
          background: rgba(0,196,140,.1); border: 1px solid rgba(0,196,140,.3);
          border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #00c48c;
          font-weight: 600; margin-bottom: 6px;
        }

        .err-msg { background: rgba(255,69,96,.12); border: 1px solid rgba(255,69,96,.3); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #ff8fa3; margin-bottom: 12px; }

        .submit-btn {
          width: 100%; background: #fe5f01; border: none; border-radius: 10px;
          padding: 13px; font-size: 15px; font-weight: 700; color: #fff;
          cursor: pointer; transition: opacity .15s; margin-top: 6px; font-family: inherit;
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

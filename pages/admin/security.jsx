import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { Spinner, ErrorBox, AdminPageHeader, AdminCard, AdminButton, AdminInput, CopyButton } from '../../components/AdminUI'
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react'
import { apiPost } from '../../lib/adminUtils'

function TwoFactorCard() {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')

  // Setup flow (chưa bật)
  const [setupData, setSetupData] = useState(null) // { secret, otpauth_uri }
  const [enableCode, setEnableCode] = useState('')
  const [enabling, setEnabling] = useState(false)

  // Disable flow (đã bật)
  const [showDisable, setShowDisable] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [disabling, setDisabling] = useState(false)

  async function fetchStatus() {
    setLoading(true)
    try {
      const r = await apiPost('/api/admin/2fa', { action: 'status' })
      setEnabled(!!r.enabled)
    } catch (e) { setError('Lỗi tải trạng thái 2FA: ' + e.message) } finally { setLoading(false) }
  }

  useEffect(() => { fetchStatus() }, [])

  async function handleSetup() {
    setError('')
    try {
      const r = await apiPost('/api/admin/2fa', { action: 'setup' })
      if (r.ok === false) { setError(r.error); return }
      setSetupData(r)
    } catch (e) { setError('Lỗi: ' + e.message) }
  }

  async function handleEnable() {
    setError('')
    setEnabling(true)
    try {
      const r = await apiPost('/api/admin/2fa', { action: 'enable', code: enableCode })
      if (!r.ok) { setError(r.error || 'Mã không đúng'); return }
      setSetupData(null)
      setEnableCode('')
      await fetchStatus()
    } catch (e) { setError('Lỗi: ' + e.message) } finally { setEnabling(false) }
  }

  async function handleDisable() {
    setError('')
    setDisabling(true)
    try {
      const r = await apiPost('/api/admin/2fa', { action: 'disable', password: disablePassword, code: disableCode })
      if (!r.ok) { setError(r.error || 'Không tắt được 2FA'); return }
      setShowDisable(false)
      setDisablePassword('')
      setDisableCode('')
      await fetchStatus()
    } catch (e) { setError('Lỗi: ' + e.message) } finally { setDisabling(false) }
  }

  if (loading) return <AdminCard><Spinner /></AdminCard>

  return (
    <AdminCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: enabled ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: enabled ? 'var(--grn)' : 'var(--mut)',
        }}>
          {enabled ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt)' }}>Xác thực 2 lớp (2FA)</div>
          <div style={{ fontSize: 13, color: 'var(--mut)' }}>
            {enabled ? 'Đang bật — cần nhập mã từ ứng dụng Authenticator mỗi lần đăng nhập' : 'Chưa bật — chỉ dùng email + mật khẩu'}
          </div>
        </div>
      </div>

      <ErrorBox msg={error} />

      {!enabled && !setupData && (
        <AdminButton icon={KeyRound} onClick={handleSetup}>Thiết lập 2FA</AdminButton>
      )}

      {!enabled && setupData && (
        <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--txt)', marginBottom: 10 }}>
            Mở Google Authenticator / Authy / 1Password → <b>Thêm tài khoản → Nhập mã thiết lập thủ công</b>, dán key dưới đây:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <code style={{ background: '#fff', border: '1px solid var(--bd)', borderRadius: 6, padding: '8px 12px', fontSize: 14, fontFamily: 'monospace', letterSpacing: 1, wordBreak: 'break-all' }}>
              {setupData.secret}
            </code>
            <CopyButton value={setupData.secret} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Nhập mã 6 số từ app để xác nhận</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <AdminInput value={enableCode} onChange={e => setEnableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" style={{ maxWidth: 140, letterSpacing: 3, fontFamily: 'monospace', fontSize: 16, textAlign: 'center' }} />
              <AdminButton onClick={handleEnable} disabled={enabling || enableCode.length !== 6}>
                {enabling ? 'Đang xác nhận...' : 'Xác nhận & Bật'}
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => { setSetupData(null); setEnableCode('') }}>Huỷ</AdminButton>
            </div>
          </div>
        </div>
      )}

      {enabled && !showDisable && (
        <AdminButton variant="danger" icon={ShieldOff} onClick={() => setShowDisable(true)}>Tắt 2FA</AdminButton>
      )}

      {enabled && showDisable && (
        <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--txt)', marginBottom: 12 }}>Nhập mật khẩu và mã 2FA hiện tại để xác nhận tắt:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280 }}>
            <AdminInput type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)} placeholder="Mật khẩu" />
            <AdminInput value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Mã 6 số" style={{ letterSpacing: 3, fontFamily: 'monospace', textAlign: 'center' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <AdminButton variant="danger" onClick={handleDisable} disabled={disabling || !disablePassword || disableCode.length !== 6}>
                {disabling ? 'Đang tắt...' : 'Xác nhận tắt 2FA'}
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setShowDisable(false)}>Huỷ</AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminCard>
  )
}

export default function Page() {
  return (
    <AdminLayout title="Bảo mật">
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <AdminPageHeader title="Bảo mật tài khoản Admin" icon={KeyRound} />
        <TwoFactorCard />
      </div>
    </AdminLayout>
  )
}

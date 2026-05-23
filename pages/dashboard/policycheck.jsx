import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import Link from 'next/link'

const INDUSTRIES = [
  { value: 'general',     label: 'Tổng hợp' },
  { value: 'health',      label: 'Sức khoẻ / Thực phẩm chức năng' },
  { value: 'beauty',      label: 'Làm đẹp / Mỹ phẩm' },
  { value: 'diet',        label: 'Giảm cân / Fitness' },
  { value: 'finance',     label: 'Tài chính / Đầu tư' },
  { value: 'ecommerce',   label: 'Thương mại điện tử' },
  { value: 'real_estate', label: 'Bất động sản' },
  { value: 'education',   label: 'Giáo dục / Khoá học' },
]

const OVERALL_CONFIG = {
  safe:      { color: '#10b981', bg: 'rgba(16,185,129,.12)', icon: '✅', label: 'An toàn — Không vi phạm' },
  warning:   { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', icon: '⚠️', label: 'Cảnh báo — Có rủi ro' },
  violation: { color: '#ef4444', bg: 'rgba(239,68,68,.12)',  icon: '❌', label: 'Vi phạm — Dễ bị từ chối' },
}
const SEVERITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#6b7a99' }
const SEVERITY_LABEL = { high: 'Nghiêm trọng', medium: 'Trung bình', low: 'Nhẹ' }

export default function PolicyCheck() {
  const { user, isPro } = useAuth()
  const [headline, setHeadline]   = useState('')
  const [body,     setBody]       = useState('')
  const [desc,     setDesc]       = useState('')
  const [industry, setIndustry]   = useState('general')
  const [loading,  setLoading]    = useState(false)
  const [result,   setResult]     = useState(null)
  const [error,    setError]      = useState('')

  async function handleCheck() {
    if (!headline.trim() && !body.trim()) { setError('Vui lòng nhập Tiêu đề hoặc Nội dung chính'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/policycheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { headline, body, desc }, industry })
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        if (d.upgrade) {
          setError('upgrade')
        } else {
          setError(d.error || 'Có lỗi xảy ra. Vui lòng thử lại.')
        }
        return
      }
      setResult(d)
    } catch { setError('Không thể kết nối. Kiểm tra lại kết nối mạng.') }
    finally { setLoading(false) }
  }

  const oc = result ? (OVERALL_CONFIG[result.overall] || OVERALL_CONFIG.warning) : null

  return (
    <DashboardLayout title="Kiểm tra Vi phạm">
      <div className="pc-page">

        <div className="page-header">
          <span className="ph-icon">🛡️</span>
          <div>
            <h1>Kiểm tra Vi phạm Chính sách Meta</h1>
            <p>AI phân tích nội dung quảng cáo — phát hiện rủi ro vi phạm trước khi chạy</p>
          </div>
        </div>

        {!isPro ? (
          <div className="upgrade-card">
            <div className="uc-icon">🔒</div>
            <div className="uc-title">Tính năng dành cho gói Business trở lên</div>
            <div className="uc-desc">Kiểm tra không giới hạn vi phạm chính sách Meta bằng AI. Tránh bị khoá tài khoản quảng cáo.</div>
            <Link href="/mua-goi" className="uc-btn">Nâng cấp ngay →</Link>
          </div>
        ) : (
          <div className="main-grid">
            {/* LEFT: form */}
            <div className="col-left">
              <div className="card">
                <div className="card-title"><span>📝</span> Nội dung quảng cáo</div>

                <div className="field">
                  <label>Tiêu đề (Headline)</label>
                  <input type="text" placeholder="VD: Kem dưỡng trắng da chuyên sâu — hiệu quả sau 7 ngày"
                    value={headline} onChange={e => setHeadline(e.target.value)} maxLength={100} />
                  <div className="field-count">{headline.length}/100</div>
                </div>

                <div className="field">
                  <label>Nội dung chính (Primary Text)</label>
                  <textarea rows={5} placeholder="Nhập nội dung quảng cáo đầy đủ..."
                    value={body} onChange={e => setBody(e.target.value)} maxLength={2000} />
                  <div className="field-count">{body.length}/2000</div>
                </div>

                <div className="field">
                  <label>Mô tả (Description) <span className="optional">Tuỳ chọn</span></label>
                  <input type="text" placeholder="Mô tả ngắn bên dưới headline..."
                    value={desc} onChange={e => setDesc(e.target.value)} maxLength={150} />
                </div>

                <div className="field">
                  <label>Ngành nghề</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}>
                    {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>

                {error === 'upgrade' ? (
                  <div className="err-box">
                    ⚠️ Tài khoản của bạn chưa đủ quyền dùng tính năng này.{' '}
                    <Link href="/mua-goi">Nâng cấp ngay →</Link>
                  </div>
                ) : error && (
                  <div className="err-box">⚠️ {error}</div>
                )}

                <button className="check-btn" onClick={handleCheck} disabled={loading}>
                  {loading ? '⏳ AI đang phân tích...' : '🛡️ Kiểm tra vi phạm'}
                </button>
              </div>

              {result && result.usage_today != null && (
                <div className="usage-info">
                  Đã dùng hôm nay: <strong>{result.usage_today}</strong> / {result.usage_limit} lần
                </div>
              )}
            </div>

            {/* RIGHT: result */}
            <div className="col-right">
              {!result && !loading && (
                <div className="placeholder">
                  <div className="ph-icon-lg">🛡️</div>
                  <strong>Kết quả phân tích sẽ hiện ở đây</strong>
                  <div>Nhập nội dung quảng cáo và nhấn Kiểm tra</div>
                </div>
              )}

              {loading && (
                <div className="placeholder">
                  <div className="ph-icon-lg spinning">⚙️</div>
                  <strong>AI đang phân tích...</strong>
                  <div>Thường mất 3-8 giây</div>
                </div>
              )}

              {result && oc && (
                <div className="result-wrap">
                  {/* Overall badge */}
                  <div className="overall-card" style={{ background: oc.bg, border: `1px solid ${oc.color}44` }}>
                    <div className="overall-icon">{oc.icon}</div>
                    <div>
                      <div className="overall-label" style={{ color: oc.color }}>{oc.label}</div>
                      <div className="overall-summary">{result.summary}</div>
                    </div>
                  </div>

                  {/* Violations */}
                  {result.violations?.length > 0 && (
                    <div className="section">
                      <div className="section-title">Vi phạm phát hiện ({result.violations.length})</div>
                      {result.violations.map((v, i) => (
                        <div key={i} className="violation-card" style={{ borderLeft: `3px solid ${SEVERITY_COLOR[v.severity]}` }}>
                          <div className="vi-header">
                            <span className="vi-rule">{v.rule_name}</span>
                            <span className="vi-sev" style={{ color: SEVERITY_COLOR[v.severity], background: SEVERITY_COLOR[v.severity] + '18' }}>
                              {SEVERITY_LABEL[v.severity] || v.severity}
                            </span>
                          </div>
                          <div className="vi-exp">{v.explanation}</div>
                          {v.text_highlighted && (
                            <div className="vi-hl">"{v.text_highlighted}"</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.violations?.length === 0 && (
                    <div className="no-violations">✅ Không phát hiện vi phạm rõ ràng</div>
                  )}

                  {/* Suggestions */}
                  {result.suggestions?.length > 0 && (
                    <div className="section">
                      <div className="section-title">Gợi ý cải thiện</div>
                      <ul className="suggestions">
                        {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  <button className="recheck-btn" onClick={() => { setResult(null); setError('') }}>
                    ↺ Kiểm tra lại nội dung khác
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .pc-page { padding: 24px; max-width: 1100px; }

        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .ph-icon { font-size: 32px; }
        h1 { font-size: 18px; font-weight: 700; color: var(--txt); margin-bottom: 4px; }
        p  { font-size: 13px; color: var(--mut); }

        /* Upgrade card */
        .upgrade-card {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          background: var(--s1); border: 1px solid var(--bd); border-radius: 16px;
          padding: 48px 32px; text-align: center;
        }
        .uc-icon  { font-size: 40px; }
        .uc-title { font-size: 16px; font-weight: 700; color: var(--txt); }
        .uc-desc  { font-size: 13px; color: var(--mut); max-width: 380px; line-height: 1.6; }
        .uc-btn { background: #fe5f01; color: #fff; border-radius: 9px; padding: 10px 22px; font-size: 13px; font-weight: 700; text-decoration: none; transition: opacity .15s; }
        .uc-btn:hover { opacity: .88; }

        /* Layout */
        .main-grid { display: grid; grid-template-columns: 1fr 420px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

        /* Card */
        .card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 18px; }
        .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--mut); margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }

        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 12px; font-weight: 600; color: var(--mut); margin-bottom: 6px; text-transform: uppercase; letter-spacing: .4px; }
        .optional { font-size: 10px; font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--mut); margin-left: 6px; }
        .field input, .field textarea, .field select {
          width: 100%; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 9px;
          padding: 10px 13px; font-size: 14px; color: var(--txt); outline: none;
          transition: border-color .15s; resize: vertical; font-family: inherit;
        }
        .field input:focus, .field textarea:focus, .field select:focus { border-color: var(--primary); }
        .field-count { font-size: 11px; color: var(--mut); text-align: right; margin-top: 3px; }

        .err-box { background: rgba(255,69,96,.08); border: 1px solid rgba(255,69,96,.25); border-radius: 9px; padding: 10px 14px; font-size: 13px; color: #ff8fa3; margin-bottom: 14px; }
        .err-box a { color: #fe5f01; text-decoration: underline; }

        .check-btn {
          width: 100%; background: linear-gradient(135deg, #0c2a72, #1a3a8f);
          border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 700;
          color: #fff; cursor: pointer; font-family: inherit; transition: opacity .15s;
        }
        .check-btn:hover:not(:disabled) { opacity: .88; }
        .check-btn:disabled { opacity: .5; cursor: not-allowed; }

        .usage-info { font-size: 12px; color: var(--mut); text-align: center; margin-top: 10px; }

        /* Right col */
        .col-right { position: sticky; top: 20px; }
        .placeholder {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          background: var(--s1); border: 1px dashed var(--bd); border-radius: 14px;
          padding: 48px 24px; text-align: center; color: var(--mut); font-size: 13px; line-height: 1.7;
        }
        .ph-icon-lg { font-size: 40px; opacity: .5; margin-bottom: 4px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinning { animation: spin 1.5s linear infinite; }

        /* Result */
        .result-wrap { display: flex; flex-direction: column; gap: 12px; }
        .overall-card { display: flex; align-items: flex-start; gap: 12px; border-radius: 14px; padding: 16px; }
        .overall-icon { font-size: 28px; flex-shrink: 0; }
        .overall-label { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
        .overall-summary { font-size: 13px; color: var(--mut); line-height: 1.5; }

        .section { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; overflow: hidden; }
        .section-title { padding: 12px 16px; font-size: 12px; font-weight: 700; color: var(--mut); text-transform: uppercase; letter-spacing: .5px; background: var(--s2); border-bottom: 1px solid var(--bd); }

        .violation-card { padding: 14px 16px; border-bottom: 1px solid var(--bd); }
        .violation-card:last-child { border-bottom: none; }
        .vi-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .vi-rule { font-size: 13px; font-weight: 700; color: var(--txt); }
        .vi-sev  { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
        .vi-exp  { font-size: 13px; color: var(--mut); line-height: 1.5; }
        .vi-hl   { font-size: 12px; color: var(--red); background: rgba(239,68,68,.08); border-radius: 6px; padding: 6px 10px; margin-top: 8px; font-style: italic; }

        .no-violations { background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2); border-radius: 12px; padding: 14px 16px; font-size: 13px; color: var(--grn); font-weight: 600; text-align: center; }

        .suggestions { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; overflow: hidden; list-style: none; }
        .suggestions li { padding: 11px 16px; border-bottom: 1px solid var(--bd); font-size: 13px; color: var(--txt); line-height: 1.5; }
        .suggestions li::before { content: '💡 '; }
        .suggestions li:last-child { border-bottom: none; }

        .recheck-btn { width: 100%; background: transparent; border: 1px solid var(--bd); border-radius: 10px; padding: 11px; font-size: 13px; color: var(--mut); cursor: pointer; font-family: inherit; transition: all .15s; }
        .recheck-btn:hover { border-color: var(--primary); color: var(--primary); }
      `}</style>
    </DashboardLayout>
  )
}

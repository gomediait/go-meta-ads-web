import { useState, useEffect, useRef, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../lib/AuthContext'
import { Package, Megaphone, ShieldAlert, Truck, Layers, Info, Target, TrendingUp, Save } from 'lucide-react'

const SETTINGS_KEY = 'profit_settings_v1'
const SETTINGS_FIELDS = ['ads-pct', 'acc-pct', 'return-pct', 'vat-pct', 'ship', 'extra-pct']
const PLAN_MAX = { trial: 3, personal: 3, business: 10, agency: Infinity }
const fmt = n => Math.round(n).toLocaleString('vi-VN') + '₫'

function calcProfit(state) {
  const cost      = parseFloat(state.cost) || 0
  const price     = parseFloat(state.price) || 0
  const adsPct    = parseFloat(state['ads-pct']) || 0
  const accPct    = parseFloat(state['acc-pct']) || 0
  const returnPct = parseFloat(state['return-pct']) || 0
  const vatPct    = parseFloat(state['vat-pct']) || 0
  const ship      = state.shipEnabled ? (parseFloat(state.ship) || 0) : 0
  const extraPct  = parseFloat(state['extra-pct']) || 0
  const extra     = Math.round(price * extraPct / 100)
  const qty       = state.qty || 1

  const adsAmt    = price * adsPct / 100
  const accAmt    = adsAmt * accPct / 100
  const vatAmt    = price * vatPct / 100
  const returnCost = returnPct / 100 * price
  const totalCost = cost + adsAmt + accAmt + vatAmt + ship + extra + returnCost
  const profit    = price - totalCost
  const margin    = price > 0 ? (profit / price * 100) : 0
  const roi       = totalCost > 0 ? (profit / totalCost * 100) : 0

  const pctOfPrice = (adsPct + vatPct + returnPct) / 100
  const fixedCost  = cost + ship + extra
  const breakeven  = pctOfPrice < 1 ? fixedCost / (1 - pctOfPrice) : 0

  return { cost, price, adsPct, accPct, returnPct, vatPct, ship, extra, extraPct, qty,
           adsAmt, accAmt, vatAmt, returnCost, totalCost, profit, margin, roi, breakeven }
}

function genId() { return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) }

const EMPTY_STATE = {
  cost: '', price: '', 'ads-pct': '', 'acc-pct': '', 'return-pct': '', 'vat-pct': '',
  ship: '', 'extra-pct': '', qty: 1, shipEnabled: true
}

export default function Profit() {
  const { user } = useAuth()
  const maxProducts = PLAN_MAX[user?.plan] ?? 3

  const [products, setProducts] = useState([{ id: genId(), name: '', state: { ...EMPTY_STATE }, result: null }])
  const [activeId, setActiveId] = useState(null)
  const [savedSettings, setSavedSettings] = useState(null)
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef(null)

  const activeProduct = products.find(p => p.id === activeId) || products[0]
  const formState = activeProduct?.state || { ...EMPTY_STATE }

  useEffect(() => { if (!activeId && products.length > 0) setActiveId(products[0].id) }, [products, activeId])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        setSavedSettings(data)
        setProducts(prev => prev.map((p, i) => i === 0 ? { ...p, state: { ...EMPTY_STATE, ...data } } : p))
      }
    } catch {}
  }, [])

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2500)
  }

  function updateField(field, value) {
    setProducts(prev => prev.map(p => p.id === activeId ? { ...p, state: { ...p.state, [field]: value } } : p))
  }

  function quickAdd(field, val) {
    const cur = parseFloat(formState[field]) || 0
    updateField(field, String(cur + val))
  }

  function quickSet(field, val) { updateField(field, String(val)) }

  function calculate() {
    const r = calcProfit(formState)
    if (!r.cost || !r.price) { showToast('⚠️ Vui lòng nhập giá vốn và giá bán!'); return }
    setProducts(prev => prev.map(p => {
      if (p.id !== activeId) return p
      const name = p.name || ('Sản phẩm ' + (prev.indexOf(p) + 1))
      return { ...p, name, result: r }
    }))
    showToast('Đã tính xong!')
  }

  function saveSettings() {
    const data = { shipEnabled: formState.shipEnabled }
    SETTINGS_FIELDS.forEach(f => { data[f] = formState[f] || '' })
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data))
      setSavedSettings(data)
      showToast('Đã lưu cài đặt mặc định!')
    } catch { showToast('⚠️ Lưu thất bại') }
  }

  function clearSettings() {
    try { localStorage.removeItem(SETTINGS_KEY) } catch {}
    setSavedSettings(null)
    showToast('🗑 Đã xoá cài đặt đã lưu')
  }

  function resetAll() {
    setProducts(prev => prev.map(p => p.id === activeId ? { ...p, name: '', state: { ...EMPTY_STATE }, result: null } : p))
    showToast('↺ Đã xoá toàn bộ')
  }

  function addProduct() {
    if (products.length >= maxProducts) {
      showToast(`🔒 Gói ${user?.plan || 'trial'} chỉ cho phép tối đa ${maxProducts} sản phẩm`)
      return
    }
    const id = genId()
    const base = savedSettings ? { ...EMPTY_STATE, ...savedSettings } : { ...EMPTY_STATE }
    setProducts(prev => [...prev, { id, name: '', state: base, result: null }])
    setActiveId(id)
  }

  function removeProduct(id) {
    if (products.length <= 1) { showToast('⚠️ Cần ít nhất 1 sản phẩm'); return }
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id)
      if (activeId === id) setActiveId(next[next.length - 1].id)
      return next
    })
  }

  const result = activeProduct?.result
  const calculated = products.filter(p => p.result)

  function calcTarget(targetProfit, r) {
    if (!r || r.profit <= 0 || !targetProfit) return null
    const ordersNeeded = Math.ceil(targetProfit / r.profit)
    const ordersPerDay = Math.ceil(ordersNeeded / 30)
    const revenueNeeded = ordersNeeded * r.price
    const adsBudget = revenueNeeded * (r.adsPct / 100)
    const capitalNeeded = ordersNeeded * r.cost
    return { ordersNeeded, ordersPerDay, revenueNeeded, adsBudget, capitalNeeded }
  }

  const [targetProfit, setTargetProfit] = useState('')
  const targetResult = calcTarget(parseFloat(targetProfit), result)

  const previewAds    = formState.price && formState['ads-pct']    ? fmt(parseFloat(formState.price) * parseFloat(formState['ads-pct']) / 100)    : ''
  const previewAcc    = formState.price && formState['acc-pct'] && formState['ads-pct'] ? fmt(parseFloat(formState.price) * parseFloat(formState['ads-pct']) / 100 * parseFloat(formState['acc-pct']) / 100) : ''
  const previewReturn = formState.price && formState['return-pct'] ? fmt(parseFloat(formState.price) * parseFloat(formState['return-pct']) / 100) : ''
  const previewVat    = formState.price && formState['vat-pct']    ? fmt(parseFloat(formState.price) * parseFloat(formState['vat-pct']) / 100)    : ''
  const previewExtra  = formState.price && formState['extra-pct']  ? fmt(parseFloat(formState.price) * parseFloat(formState['extra-pct']) / 100)  : ''

  const savedParts = savedSettings ? SETTINGS_FIELDS.filter(f => savedSettings[f] && savedSettings[f] !== '0').map(f => {
    if (f === 'ship') return 'Ship ' + parseInt(savedSettings[f]).toLocaleString('vi-VN') + '₫'
    return f.replace('-pct', '').replace('ads', 'Ads').replace('acc', 'Thuê TK').replace('return', 'Hoàn').replace('vat', 'VAT').replace('extra', 'Khác') + ' ' + savedSettings[f] + '%'
  }) : []

  return (
    <DashboardLayout title="Kiểm soát Lãi Lỗ">
      <div className="profit-page">

        {/* Saved settings banner */}
        {savedSettings && savedParts.length > 0 && (
          <div className="saved-banner">
            <span className="sb-icon"><Save size={14} /></span>
            <div className="sb-text">
              <strong>Đã tải cài đặt!</strong> Chỉ nhập giá vốn & giá bán
              <div className="sb-meta">{savedParts.join(' · ')}</div>
            </div>
            <button className="sb-clear" onClick={clearSettings}>Xoá</button>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div className="ph-icon"><TrendingUp size={22} /></div>
          <div>
            <h1>Kiểm soát Lãi / Lỗ Đơn hàng</h1>
            <p>Tính đầy đủ chi phí — Biết kết quả ngay tức thì</p>
          </div>
        </div>

        {/* Info block */}
        <div className="info-block">
          <div className="info-head"><Info size={14} style={{ flexShrink: 0 }} /> Lưu ý quan trọng: Quy tắc đặt tên Nhóm quảng cáo</div>
          <div className="info-body">
            Để hệ thống tự động tính Lãi/Lỗ, bạn bắt buộc phải chèn <strong>Mã sản phẩm</strong> vào tên của Nhóm quảng cáo trên Facebook.
            <div className="info-example">
              <div className="ex-label">Ví dụ Mã SP là: <strong style={{ color: 'var(--grn)' }}>COCINOX</strong></div>
              <div style={{ marginTop: 4 }}>✅ Đúng: <strong>COCINOX</strong>-CTC-A1 · Nhóm <strong>COCINOX</strong> Test <span style={{color: 'var(--text-light)', fontSize: '0.9em'}}>(Hệ thống tự nhận diện)</span></div>
              <div style={{ color: 'var(--red)', marginTop: 4 }}>❌ Sai: "Adset 1" · "Cốc Inox Test" <span style={{fontSize: '0.9em'}}>(Thiếu mã SP, không tính được)</span></div>
            </div>
          </div>
        </div>

        <div className="layout-grid">
          {/* LEFT: form */}
          <div className="col-left">
            {/* Product tabs */}
            <div className="tabs-row">
              <div className="tabs-scroll">
                {products.map(p => (
                  <button key={p.id}
                    className={`ptab${p.id === activeId ? ' active' : ''}`}
                    onClick={() => setActiveId(p.id)}
                  >
                    {p.name || 'Sản phẩm'}{p.result ? (p.result.profit >= 0 ? ' ✓' : ' ✗') : ''}
                    {products.length > 1 && (
                      <span className="tab-x" onClick={e => { e.stopPropagation(); removeProduct(p.id) }}>×</span>
                    )}
                  </button>
                ))}
              </div>
              <button className="add-tab" onClick={addProduct}>＋ Thêm SP</button>
            </div>

            {/* Product info card */}
            <div className="card">
              <div className="card-title"><Package size={15} /> Thông tin sản phẩm</div>
              <input className="name-input" type="text" placeholder="Tên sản phẩm (VD: Cốc inox iMat)" maxLength={40}
                aria-label="Tên sản phẩm"
                value={activeProduct?.name || ''}
                onChange={e => setProducts(prev => prev.map(p => p.id === activeId ? { ...p, name: e.target.value } : p))} />

              <Field label="Giá vốn (giá nhập hàng)" unit="₫">
                <input type="number" placeholder="0" inputMode="numeric"
                  value={formState.cost} onChange={e => updateField('cost', e.target.value)} />
                <QuickBtns items={[50000, 100000, 200000, 500000]} onAdd={v => quickAdd('cost', v)} prefix="+" />
              </Field>

              <Field label="Giá bán ra cho khách" unit="₫">
                <input type="number" placeholder="0" inputMode="numeric"
                  value={formState.price} onChange={e => updateField('price', e.target.value)} />
                <QuickBtns items={[50000, 100000, 200000, 500000]} onAdd={v => quickAdd('price', v)} prefix="+" />
              </Field>

              <div className="field-group">
                <div className="fl">Số lượng đơn hàng</div>
                <div className="qty-row">
                  <button className="qty-btn" onClick={() => updateField('qty', Math.max(1, (formState.qty || 1) - 1))}>−</button>
                  <div className="qty-val">{formState.qty || 1}</div>
                  <button className="qty-btn" onClick={() => updateField('qty', (formState.qty || 1) + 1)}>+</button>
                </div>
              </div>
            </div>

            {/* Ads cost card */}
            <div className="card">
              <div className="card-title"><Megaphone size={15} /> Chi phí quảng cáo</div>
              <Field label="Tỉ lệ ngân sách ads / doanh thu" unit="%" badge={previewAds ? `≈ ${previewAds}` : ''}>
                <input type="number" placeholder="0" inputMode="decimal" step="0.1"
                  value={formState['ads-pct']} onChange={e => updateField('ads-pct', e.target.value)} />
                <QuickBtns items={[5, 10, 15, 20, 30]} onSet={v => quickSet('ads-pct', v)} suffix="%" />
              </Field>
              <Field label="Phí thuê tài khoản ads (% trên tiền ads)" unit="%" badge={previewAcc ? `≈ ${previewAcc}` : ''}>
                <input type="number" placeholder="0" inputMode="decimal" step="0.1"
                  value={formState['acc-pct']} onChange={e => updateField('acc-pct', e.target.value)} />
                <QuickBtns items={[3, 5, 7, 10]} onSet={v => quickSet('acc-pct', v)} suffix="%" />
              </Field>
            </div>

            {/* Risk & tax */}
            <div className="card">
              <div className="card-title"><ShieldAlert size={15} /> Rủi ro & Thuế</div>
              <Field label="Tỉ lệ hoàn hàng dự kiến" unit="%" badge={previewReturn ? `≈ ${previewReturn}/đơn` : ''} badgeColor="var(--red)">
                <input type="number" placeholder="0" inputMode="decimal" step="0.1"
                  value={formState['return-pct']} onChange={e => updateField('return-pct', e.target.value)} />
                <QuickBtns items={[5, 10, 15, 20]} onSet={v => quickSet('return-pct', v)} suffix="%" />
              </Field>
              <Field label="Thuế VAT trên doanh thu" unit="%" badge={previewVat ? `≈ ${previewVat}` : ''} badgeColor="var(--red)">
                <input type="number" placeholder="0" inputMode="decimal" step="0.1"
                  value={formState['vat-pct']} onChange={e => updateField('vat-pct', e.target.value)} />
                <QuickBtns items={[0, 5, 8, 10]} onSet={v => quickSet('vat-pct', v)} suffix="%" />
              </Field>
            </div>

            {/* Shipping */}
            <div className="card">
              <div className="card-title"><Truck size={15} /> Phí vận chuyển</div>
              <div className="toggle-row">
                <span id="ship-toggle-label">Người bán chịu phí giao hàng</span>
                <button className={`toggle${formState.shipEnabled ? ' on' : ''}`}
                  role="switch" aria-checked={formState.shipEnabled} aria-labelledby="ship-toggle-label"
                  onClick={() => updateField('shipEnabled', !formState.shipEnabled)} />
              </div>
              {formState.shipEnabled && (
                <Field label="Phí ship mỗi đơn" unit="₫">
                  <input type="number" placeholder="0" inputMode="numeric"
                    value={formState.ship} onChange={e => updateField('ship', e.target.value)} />
                  <QuickBtns items={[15000, 20000, 25000, 35000]} onSet={v => quickSet('ship', v)} fmt={v => v / 1000 + 'k'} />
                </Field>
              )}
            </div>

            {/* Extra costs */}
            <div className="card">
              <div className="card-title"><Layers size={15} /> Chi phí phát sinh (tuỳ chọn)</div>
              <Field label="Đóng gói, túi, nhãn mác... (% giá bán)" unit="%" badge={previewExtra ? `≈ ${previewExtra} / đơn` : ''}>
                <input type="number" placeholder="0" inputMode="decimal" step="0.1"
                  value={formState['extra-pct']} onChange={e => updateField('extra-pct', e.target.value)} />
                <QuickBtns items={[1, 2, 3, 5]} onSet={v => quickSet('extra-pct', v)} suffix="%" />
              </Field>
            </div>

            {/* Action buttons */}
            <button className="calc-btn" onClick={calculate}>Phân tích Lãi / Lỗ</button>
            <button className="save-btn" onClick={saveSettings}>Lưu làm mặc định</button>
            <button className="reset-btn" onClick={resetAll}>Xoá & Nhập lại</button>

            {/* Mobile result (shown on small screens) */}
            {result && <div className="mobile-result"><ResultCard result={result} formState={formState} targetProfit={targetProfit} setTargetProfit={setTargetProfit} targetResult={targetResult} /></div>}
          </div>

          {/* RIGHT: result */}
          <div className="col-right">
            {!result ? (
              <div className="result-placeholder">
                <div className="ph-icon-lg"><TrendingUp size={36} /></div>
                <strong>Kết quả sẽ hiện ở đây</strong>
                <div>Điền thông tin sản phẩm và nhấn <strong>Phân tích Lãi / Lỗ</strong></div>
              </div>
            ) : (
              <ResultCard result={result} formState={formState} targetProfit={targetProfit} setTargetProfit={setTargetProfit} targetResult={targetResult} />
            )}

            {/* Multi-product summary */}
            {calculated.length >= 2 && (
              <div className="summary-card">
                <div className="s-header">Tổng hợp tất cả sản phẩm</div>
                {calculated.map(p => (
                  <div key={p.id}>
                    <div className="s-row" style={{ background: 'rgba(108,99,255,.04)' }}>
                      <span className="sl" style={{ fontWeight: 700, color: 'var(--txt)' }}>{p.name || 'SP'}</span>
                      <span className={`sv ${p.result.profit >= 0 ? 'pos' : 'neg'}`}>{p.result.profit >= 0 ? '+' : ''}{fmt(p.result.profit)}/đơn</span>
                    </div>
                    <div className="s-row"><span className="sl" style={{ paddingLeft: 12 }}>Giá bán</span><span className="sv acc">{fmt(p.result.price)}</span></div>
                  </div>
                ))}
                <div className="s-row" style={{ borderTop: '2px solid var(--bd)', marginTop: 2 }}>
                  <span className="sl" style={{ fontWeight: 700, color: 'var(--txt)' }}>Tổng doanh thu</span>
                  <span className="sv acc">{fmt(calculated.reduce((s, p) => s + p.result.price * (p.result.qty || 1), 0))}</span>
                </div>
                <div className="s-row">
                  <span className="sl" style={{ fontWeight: 700, color: 'var(--txt)' }}>Tổng lãi / lỗ</span>
                  <span className={`sv ${calculated.reduce((s, p) => s + p.result.profit, 0) >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 15, fontWeight: 700 }}>
                    {calculated.reduce((s, p) => s + p.result.profit, 0) >= 0 ? '+' : ''}{fmt(calculated.reduce((s, p) => s + p.result.profit, 0))}
                  </span>
                </div>
              </div>
            )}

            {/* CPA table */}
            {calculated.length > 0 && (
              <div className="cpa-card">
                <div className="cpa-header">
                  <span><Target size={14} style={{ verticalAlign: -2 }} /> CPA tối đa theo sản phẩm</span>
                  <span className="cpa-sub">Từ % Ads × Giá bán</span>
                </div>
                {calculated.filter(p => p.result.adsPct > 0).map(p => (
                  <div key={p.id} className="cpa-row">
                    <span className="cpa-name">{p.name || 'SP'}</span>
                    <span className="cpa-val">{fmt(Math.round(p.result.price * p.result.adsPct / 100))}</span>
                  </div>
                ))}
                {calculated.filter(p => p.result.adsPct > 0).length === 0 && (
                  <div className="cpa-empty">Nhập % Ads để xem CPA tối đa</div>
                )}
              </div>
            )}
          </div>
        </div>

        {toast && <div className="local-toast show" role="status" aria-live="polite">{toast}</div>}
      </div>

      <style jsx>{`
        .profit-page { padding: 20px; max-width: 1200px; margin: 0 auto; }

        /* Banner */
        .saved-banner {
          display: flex; align-items: flex-start; gap: 10px;
          background: var(--s1); border: 1px solid rgba(16,185,129,.3);
          border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;
        }
        .sb-icon { flex-shrink: 0; color: var(--grn); margin-top: 1px; }
        .sb-text { flex: 1; font-size: 13px; color: var(--txt); }
        .sb-meta { font-size: 11px; color: var(--mut); margin-top: 3px; }
        .sb-clear { background: transparent; border: 1px solid var(--bd); border-radius: 7px; padding: 3px 9px; font-size: 11px; color: var(--mut); cursor: pointer; flex-shrink: 0; }
        .sb-clear:hover { border-color: var(--red); color: var(--red); }

        /* Header */
        .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .ph-icon {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(254,95,1,.08); color: var(--primary);
        }
        h1 { font-size: 18px; font-weight: 700; color: var(--txt); margin-bottom: 3px; }
        p  { font-size: 12px; color: var(--mut); }

        /* Info block */
        .info-block {
          background: var(--s1); border: 1px solid var(--bd);
          border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;
        }
        .info-head { font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .info-body { font-size: 13px; line-height: 1.6; color: var(--txt); }
        .info-example {
          background: var(--s2); border: 1px solid var(--bd); border-radius: 8px;
          padding: 10px 12px; margin: 10px 0; font-size: 12px;
        }
        .ex-label { font-size: 11px; color: var(--mut); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; }

        /* Layout */
        .layout-grid { display: grid; grid-template-columns: 1fr 400px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } .col-right { display: none; } .mobile-result { display: block; } }
        @media (min-width: 901px) { .mobile-result { display: none; } }

        /* Tabs */
        .tabs-row { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
        .tabs-scroll { display: flex; gap: 6px; overflow-x: auto; flex: 1; scrollbar-width: none; }
        .tabs-scroll::-webkit-scrollbar { display: none; }
        .ptab {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 9px; border: 1px solid var(--bd);
          background: var(--s2); font-size: 13px; font-weight: 500; color: var(--mut);
          cursor: pointer; white-space: nowrap; flex-shrink: 0; font-family: inherit;
          transition: all .15s;
        }
        .ptab.active { background: var(--primary); color: #fff; border-color: var(--primary); }
        .tab-x {
          width: 15px; height: 15px; border-radius: 50%; background: rgba(255,255,255,.2);
          display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer;
        }
        .add-tab {
          padding: 6px 12px; border-radius: 9px; border: 1px dashed var(--bd);
          background: transparent; font-size: 13px; color: var(--mut); cursor: pointer;
          font-family: inherit; white-space: nowrap; flex-shrink: 0; transition: all .15s;
        }
        .add-tab:hover { border-color: var(--primary); color: var(--primary); }

        /* Card */
        .card { background: var(--s1); border: 1px solid var(--bd); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
        .card-title { font-size: 13px; font-weight: 600; color: var(--txt); margin-bottom: 14px; display: flex; align-items: center; gap: 7px; }
        .name-input {
          width: 100%; background: var(--s2); border: 1px solid var(--bd); border-radius: 9px;
          padding: 10px 13px; font-size: 14px; font-weight: 500; color: var(--txt); outline: none;
          margin-bottom: 14px; transition: border-color .15s; font-family: inherit;
        }
        .name-input:focus { border-color: var(--primary); }

        /* Quantity row */
        .field-group { margin-bottom: 14px; }
        .fl { font-size: 12px; color: var(--mut); margin-bottom: 6px; }
        .qty-row { display: flex; align-items: center; gap: 12px; background: var(--s2); border: 1px solid var(--bd); border-radius: 9px; padding: 8px 14px; }
        .qty-btn { width: 32px; height: 32px; background: var(--bd); border: none; border-radius: 7px; font-size: 20px; font-weight: 300; color: var(--txt); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .qty-btn:hover { background: var(--s3); }
        .qty-val { flex: 1; text-align: center; font-size: 20px; font-weight: 700; color: var(--txt); }

        /* Toggle */
        .toggle-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--txt); margin-bottom: 12px; }
        .toggle { width: 44px; height: 24px; background: var(--bd); border: none; border-radius: 12px; position: relative; cursor: pointer; transition: background .2s; flex-shrink: 0; padding: 0; }
        .toggle.on { background: var(--primary); }
        .toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform .2s; }
        .toggle.on::after { transform: translateX(20px); }
        .toggle:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

        /* Action buttons */
        .calc-btn {
          width: 100%; background: var(--primary);
          border: none; border-radius: 10px; padding: 14px; font-size: 14px; font-weight: 700;
          color: white; cursor: pointer; margin: 14px 0 8px; font-family: inherit;
          transition: background .15s;
        }
        .calc-btn:hover { background: var(--navy); }
        .save-btn {
          width: 100%; background: transparent; border: 1px solid var(--bd);
          border-radius: 10px; padding: 11px; font-size: 13px; font-weight: 500; color: var(--txt);
          cursor: pointer; margin-bottom: 8px; font-family: inherit; transition: all .15s;
        }
        .save-btn:hover { background: var(--s2); }
        .reset-btn {
          width: 100%; background: transparent; border: 1px solid var(--bd);
          border-radius: 12px; padding: 11px; font-size: 13px; color: var(--txt); opacity: .6;
          cursor: pointer; margin-bottom: 16px; font-family: inherit; transition: all .15s;
        }
        .reset-btn:hover { opacity: .9; border-color: var(--mut); }

        /* Right col */
        .col-right { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 12px; }
        .result-placeholder {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          background: var(--s1); border: 1px dashed var(--bd); border-radius: 14px;
          padding: 48px 24px; text-align: center; color: var(--mut); font-size: 13px; line-height: 1.7;
        }
        .ph-icon-lg { opacity: .3; margin-bottom: 4px; color: var(--mut); }

        /* Summary */
        .summary-card { background: var(--s1); border: 1px solid rgba(0,196,140,.3); border-radius: 14px; overflow: hidden; }
        .s-header { padding: 13px 16px; font-size: 13px; font-weight: 600; color: var(--grn); background: var(--s2); border-bottom: 1px solid var(--bd); }
        .s-row { display: flex; justify-content: space-between; padding: 9px 16px; border-bottom: 1px solid var(--bd); font-size: 13px; }
        .s-row:last-child { border-bottom: none; }
        .sl { color: var(--mut); flex: 1; }
        .sv { font-weight: 600; }
        .sv.pos { color: var(--grn); }
        .sv.neg { color: var(--red); }
        .sv.acc { color: var(--primary); }

        /* CPA table */
        .cpa-card { background: var(--s1); border: 1px solid rgba(249,115,22,.25); border-radius: 14px; overflow: hidden; }
        .cpa-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; font-size: 13px; font-weight: 700; color: var(--ylw); background: rgba(249,115,22,.07); border-bottom: 1px solid rgba(249,115,22,.15); }
        .cpa-sub { font-size: 11px; color: var(--mut); font-weight: 400; }
        .cpa-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 16px; border-bottom: 1px solid var(--bd); font-size: 13px; }
        .cpa-row:last-child { border-bottom: none; }
        .cpa-name { font-weight: 600; color: var(--txt); }
        .cpa-val  { font-size: 14px; font-weight: 700; color: var(--ylw); }
        .cpa-empty { padding: 16px; text-align: center; color: var(--mut); font-size: 12px; }

        /* Toast */
        .local-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: var(--s1); border: 1px solid var(--bd); border-radius: 10px;
          padding: 9px 18px; font-size: 13px; font-weight: 500; color: var(--txt);
          z-index: 50; pointer-events: none; white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,.35);
        }

        /* Focus indicators */
        .calc-btn:focus-visible,
        .save-btn:focus-visible,
        .reset-btn:focus-visible,
        .ptab:focus-visible,
        .add-tab:focus-visible,
        .sb-clear:focus-visible,
        .qty-btn:focus-visible,
        .name-input:focus-visible {
          outline: 2px solid var(--blue); outline-offset: 2px;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .toggle::after { transition: none; }
          .local-toast { animation: none; }
        }

        /* Mobile adjustments */
        @media (max-width: 600px) {
          .profit-page { padding: 12px; }
          .page-header { gap: 10px; }
          h1 { font-size: 16px; }
          .tabs-row { flex-wrap: wrap; }
          .calc-btn { padding: 14px; font-size: 14px; }
          .card { padding: 14px; }
        }
      `}</style>
    </DashboardLayout>
  )
}

function Field({ label, unit, badge, badgeColor, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        {badge && <span style={{ color: badgeColor || 'var(--primary)', fontWeight: 600 }}>{badge}</span>}
      </div>
      <div style={{ position: 'relative' }}>
        <style jsx>{`
          input[type=number] {
            width: 100%; background: var(--s2); border: 1.5px solid var(--bd); border-radius: 9px;
            padding: 10px 46px 10px 13px; font-size: 15px; font-weight: 500; color: var(--txt);
            outline: none; transition: border-color .15s; font-family: inherit;
            -moz-appearance: textfield;
          }
          input[type=number]::-webkit-outer-spin-button,
          input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
          input[type=number]:focus { border-color: var(--primary); }
        `}</style>
        {children[0]}
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--mut)', pointerEvents: 'none' }}>{unit}</span>
      </div>
      {children[1]}
    </div>
  )
}

function QuickBtns({ items, onSet, onAdd, prefix, suffix, fmt: fmtFn }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
      {items.map(v => (
        <button key={v} onClick={() => onSet ? onSet(v) : onAdd(v)}
          style={{
            background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 7,
            padding: '3px 9px', fontSize: 12, color: 'var(--txt)', cursor: 'pointer',
            opacity: .75, transition: 'all .15s', fontFamily: 'inherit'
          }}
          onMouseEnter={e => { e.target.style.opacity = 1; e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)' }}
          onMouseLeave={e => { e.target.style.opacity = '.75'; e.target.style.borderColor = 'var(--bd)'; e.target.style.color = 'var(--txt)' }}
        >
          {prefix}{fmtFn ? fmtFn(v) : v}{suffix}
        </button>
      ))}
    </div>
  )
}

function ResultCard({ result: r, formState, targetProfit, setTargetProfit, targetResult }) {
  const cls = r.profit > 0 ? 'profit' : r.profit < 0 ? 'loss' : 'zero'
  const clsColor = { profit: 'var(--grn)', loss: 'var(--red)', zero: 'var(--ylw)' }[cls]
  const badge = { profit: 'Có lãi', loss: 'Đang lỗ', zero: 'Hoà vốn' }[cls]

  let advice = ''
  if (r.profit < 0) advice = `Đang lỗ ${fmt(Math.abs(r.profit))}/đơn. Giá bán tối thiểu để hoà vốn: ${fmt(r.totalCost)}.`
  else if (r.returnPct > 20) advice = `⚠️ Tỉ lệ hoàn hàng cao (${r.returnPct}%)! Dù đang lãi ${fmt(r.profit)}/đơn, hoàn hàng cao đang ăn mòn lợi nhuận. Nên giảm về dưới 15%.`
  else if (r.margin < 15) advice = `⚠️ Biên lợi nhuận mỏng (${r.margin.toFixed(1)}%). Chỉ cần hoàn tăng nhẹ là lỗ. Nên tăng giá hoặc giảm chi phí ads.`
  else if (r.margin < 30) advice = `Biên lợi nhuận ổn (${r.margin.toFixed(1)}%). Đang lãi ${fmt(r.profit)}/đơn.`
  else advice = `🔥 Margin tốt (${r.margin.toFixed(1)}%) — lãi ${fmt(r.profit)}/đơn! Có thể tăng ngân sách ads để scale mạnh.`

  return (
    <div>
      {/* Result main */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ padding: 18, textAlign: 'center', borderBottom: '1px solid var(--bd)' }}>
          <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 4 }}>Lãi / Lỗ mỗi đơn</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: clsColor, letterSpacing: -1 }}>{fmt(r.profit)}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: clsColor + '18', color: clsColor, fontSize: 12, fontWeight: 600, marginTop: 8 }}>{badge}</div>
        </div>

        <div style={{ padding: '12px 16px' }}>
          <Row l="Giá bán" v={fmt(r.price)} vc="var(--primary)" />
          <Row l="Giá vốn" v={`−${fmt(r.cost)}`} vc="var(--red)" />
          {r.adsAmt > 0    && <Row l={`Chi phí ads (${r.adsPct}%)`}          v={`−${fmt(r.adsAmt)}`}    vc="var(--red)" />}
          {r.accAmt > 0    && <Row l={`Phí thuê TK (${r.accPct}% của ads)`}  v={`−${fmt(r.accAmt)}`}    vc="var(--red)" />}
          {r.ship > 0      && <Row l="Phí ship"                               v={`−${fmt(r.ship)}`}      vc="var(--red)" />}
          {r.extra > 0     && <Row l={`Chi phí khác (${r.extraPct}%)`}        v={`−${fmt(r.extra)}`}     vc="var(--red)" />}
          {r.returnCost > 0 && <Row l={`Hoàn hàng (${r.returnPct}%)`}        v={`−${fmt(r.returnCost)}`} vc="var(--red)" />}
          {r.vatAmt > 0    && <Row l={`Thuế VAT (${r.vatPct}%)`}              v={`−${fmt(r.vatAmt)}`}    vc="var(--red)" />}
          <div style={{ height: 1, background: 'var(--bd)', margin: '8px 0' }} />
          <Row l="Tổng chi phí"  v={`−${fmt(r.totalCost)}`} vb lc />
          <Row l="Lãi / Lỗ / đơn" v={(r.profit >= 0 ? '+' : '') + fmt(r.profit)} vc={clsColor} vb lc />
          {r.qty > 1 && <Row l={`Lãi/lỗ × ${r.qty} đơn`} v={(r.profit >= 0 ? '+' : '') + fmt(r.profit * r.qty)} vc={clsColor} />}
          <Row l="ROI" v={r.roi.toFixed(1) + '%'} vc={r.roi >= 0 ? 'var(--grn)' : 'var(--red)'} />
          <div style={{ height: 1, background: 'var(--bd)', margin: '8px 0' }} />
          <Row l="Giá bán hoà vốn" v={fmt(r.breakeven)} vc="var(--ylw)" vb />
          <Row l="Cao hơn hoà vốn" v={(r.price - r.breakeven >= 0 ? '+' : '') + fmt(r.price - r.breakeven)} vc={r.price - r.breakeven >= 0 ? 'var(--grn)' : 'var(--red)'} />
        </div>

        {/* Margin bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--bd)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: 'var(--mut)' }}>Biên lợi nhuận</span>
            <span style={{ fontWeight: 700, color: clsColor }}>{r.margin.toFixed(1)}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--s2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '100%', borderRadius: 4, background: r.profit >= 0 ? 'linear-gradient(90deg, var(--grn), var(--blue))' : 'var(--red)', transformOrigin: 'left', transform: `scaleX(${Math.min(Math.max(r.margin, 0), 100) / 100})`, transition: 'transform .5s cubic-bezier(.16,1,.3,1)' }} />
          </div>
        </div>
      </div>

      {/* Advice */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: '12px 16px', fontSize: 13, lineHeight: 1.7, color: 'var(--mut)', marginBottom: 10 }}>
        {advice}
      </div>

      {/* Target profit */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ background: 'var(--s2)', padding: '13px 16px', borderBottom: '1px solid var(--bd)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 10 }}>Muốn đạt lợi nhuận bao nhiêu / tháng?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="number" placeholder="100,000,000" inputMode="numeric"
                value={targetProfit}
                onChange={e => setTargetProfit(e.target.value)}
                style={{ width: '100%', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 9, padding: '10px 46px 10px 13px', fontSize: 14, fontWeight: 600, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit' }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--mut)' }}>₫</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
            {[50000000, 100000000, 200000000, 500000000].map(v => (
              <button key={v} onClick={() => setTargetProfit(String(v))}
                style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 7, padding: '3px 9px', fontSize: 12, color: 'var(--mut)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {v >= 1000000 ? v / 1000000 + 'tr' : v}
              </button>
            ))}
          </div>
        </div>
        {targetResult && (
          <div>
            <div style={{ textAlign: 'center', padding: 16, borderBottom: '1px solid var(--bd)' }}>
              <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 4 }}>Số đơn cần bán / tháng</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', letterSpacing: -1 }}>{targetResult.ordersNeeded.toLocaleString('vi-VN')}</div>
              <div style={{ fontSize: 13, color: 'var(--mut)', marginTop: 4 }}>{targetResult.ordersPerDay.toLocaleString('vi-VN')} đơn / ngày</div>
            </div>
            <div style={{ padding: '4px 0' }}>
              <Row l="Doanh thu cần / tháng" v={fmt(targetResult.revenueNeeded)} />
              {r.adsPct > 0 && <Row l="Ngân sách ads cần / tháng" v={fmt(targetResult.adsBudget)} vc="var(--ylw)" />}
              <Row l="Vốn hàng cần / tháng" v={fmt(targetResult.capitalNeeded)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ l, v, vc, vb, lc }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bd)', fontSize: 13 }}>
      <span style={{ color: lc ? 'var(--txt)' : 'var(--mut)', fontWeight: lc ? 600 : 400 }}>{l}</span>
      <span style={{ color: vc || 'var(--txt)', fontWeight: vb ? 700 : 600 }}>{v}</span>
    </div>
  )
}

import { useState } from 'react'

export default function FloatingSupport() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9001, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>

      {/* Expanded buttons */}
      {open && (
        <>
          {/* Zalo */}
          <a
            href="https://zalo.me/0833336851"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #0068ff, #00c7de)',
              color: '#fff', padding: '10px 18px', borderRadius: 50,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,104,255,0.4)',
              animation: 'slideInRight 0.25s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
            Zalo tư vấn
          </a>

          {/* Messenger */}
          <a
            href="https://m.me/go.media.vn"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #0084ff, #a033ff)',
              color: '#fff', padding: '10px 18px', borderRadius: 50,
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,132,255,0.4)',
              animation: 'slideInRight 0.35s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.89 1.22 5.48 3.19 7.29.16.14.26.34.26.56l.05 1.75c.02.56.6.92 1.1.69l1.95-.87c.17-.08.36-.09.53-.04.88.24 1.83.37 2.82.37 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm.88 13.07l-2.54-2.73-4.96 2.73 5.46-5.79 2.6 2.73 4.9-2.73-5.46 5.79z"/>
            </svg>
            Messenger
          </a>
        </>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 54, height: 54, borderRadius: '50%',
          background: open
            ? 'rgba(255,255,255,0.1)'
            : 'linear-gradient(135deg, #00c7de, #35e7e9)',
          border: open ? '1.5px solid rgba(255,255,255,0.2)' : 'none',
          color: open ? 'rgba(255,255,255,0.8)' : '#000',
          fontSize: open ? 22 : 24,
          cursor: 'pointer',
          boxShadow: open ? 'none' : '0 4px 20px rgba(0,199,222,0.5)',
          transition: 'all 0.25s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={open ? 'Đóng' : 'Tư vấn miễn phí'}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Pulse ring */}
      {!open && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 54, height: 54, borderRadius: '50%',
          border: '2px solid rgba(0,199,222,0.5)',
          animation: 'pulseRing 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <style>{`
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.5);opacity:0} }
      `}</style>
    </div>
  )
}

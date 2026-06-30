import { ShieldAlert } from 'lucide-react'

export default function RestrictedView({ requiredRole = 'Manager' }) {
  return (
    <div className="restricted-view">
      <div className="rv-icon">
        <ShieldAlert size={48} />
      </div>
      <h2 className="rv-title">Chức năng bị khóa</h2>
      <p className="rv-desc">
        Tài khoản của bạn hiện tại không có quyền truy cập trang này. <br />
        Vui lòng liên hệ Admin để được cấp quyền <strong>{requiredRole}</strong> trở lên.
      </p>
      
      <style jsx>{`
        .restricted-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 60vh;
          text-align: center;
          padding: 24px;
        }
        .rv-icon {
          color: var(--mut);
          opacity: 0.5;
          margin-bottom: 20px;
        }
        .rv-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--txt);
          margin-bottom: 12px;
        }
        .rv-desc {
          font-size: 15px;
          color: var(--mut);
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'

const VI_NAMES = [
  'Nguyễn Văn An','Trần Thị Bình','Lê Văn Cường','Phạm Thị Dung','Hoàng Văn Em',
  'Đặng Thị Phượng','Bùi Văn Giang','Đinh Thị Hoa','Vũ Văn Hùng','Đỗ Thị Lan',
  'Hồ Văn Long','Ngô Thị Mai','Lý Văn Nam','Dương Thị Oanh','Phan Văn Phúc',
  'Trương Thị Quyên','Võ Văn Sơn','Lưu Thị Thu','Cao Văn Tuấn','Bùi Thị Uyên',
  'Trần Văn Vinh','Nguyễn Thị Xuân','Lê Văn Yên','Phạm Văn Anh','Hoàng Thị Bích',
  'Đặng Văn Chiến','Đinh Thị Dịu','Vũ Văn Đức','Đỗ Thị Én','Hồ Văn Phong',
  'Ngô Văn Quân','Lý Thị Hằng','Dương Văn Hiếu','Phan Thị Huệ','Trương Văn Kiên',
  'Võ Thị Linh','Lưu Văn Minh','Cao Thị Ngân','Trần Văn Nhân','Nguyễn Thị Oanh',
  'Lê Thị Phương','Phạm Văn Quý','Hoàng Văn Tài','Đặng Thị Thảo','Bùi Văn Thiện',
  'Đinh Văn Thịnh','Vũ Thị Thúy','Đỗ Văn Tiến','Hồ Thị Trang','Ngô Văn Trung',
  'Lý Thị Tuyết','Dương Văn Vũ','Phan Thị Vân','Trương Văn Việt','Võ Văn Viễn',
  'Lưu Thị Yến','Cao Văn Dũng','Trần Thị Hải','Nguyễn Văn Khoa','Lê Thị Khánh',
  'Phạm Văn Lâm','Hoàng Thị Lệ','Đặng Văn Lộc','Bùi Thị Lý','Đinh Văn Mạnh',
  'Vũ Thị Ngọc','Đỗ Văn Nghĩa','Hồ Thị Nhung','Ngô Văn Ninh','Lý Văn Phát',
  'Dương Thị Phúc','Phan Văn Quốc','Trương Thị Quynh','Võ Văn Thắng','Lưu Văn Thành',
  'Cao Thị Thương','Trần Văn Toàn','Nguyễn Thị Trà','Lê Văn Trọng','Phạm Thị Trúc',
  'Hoàng Văn Tuấn','Đặng Thị Tuyến','Bùi Văn Tâm','Đinh Thị Tâm','Vũ Văn Thiên',
  'Đỗ Thị Thơm','Hồ Văn Thu','Ngô Thị Thủy','Lý Văn Thụy','Dương Văn Tiến',
  'Phan Thị Tình','Trương Văn Toán','Võ Thị Toàn','Lưu Văn Tùng','Cao Văn Tứ',
  'Trần Thị Út','Nguyễn Văn Ước','Lê Thị Vân','Phạm Văn Văn','Hoàng Thị Yến',
  'Đinh Thị Ánh','Vũ Văn Bảo','Đỗ Thị Bảo','Hồ Văn Bình','Ngô Văn Chí',
  'Lý Thị Châu','Dương Văn Chi','Phan Thị Chiêu','Trương Văn Chung','Võ Thị Cúc',
  'Lưu Văn Cường','Cao Thị Dạ','Trần Văn Danh','Nguyễn Thị Dao','Lê Văn Dần',
  'Phạm Thị Điệp','Hoàng Văn Đinh','Đặng Văn Định','Bùi Thị Đoan','Đinh Văn Đoàn',
  'Vũ Thị Đỗ','Đỗ Văn Đức','Hồ Thị Gái','Ngô Thị Hà','Lý Văn Hải',
  'Dương Thị Hạnh','Phan Văn Hậu','Trương Thị Hiền','Võ Văn Hiện','Lưu Thị Hiệu',
  'Cao Văn Hiếu','Trần Thị Hồng','Nguyễn Văn Hội','Lê Thị Hợp','Phạm Văn Huy',
  'Hoàng Thị Huyền','Đặng Văn Hưng','Bùi Thị Hương','Đinh Văn Hướng','Vũ Văn Hựu',
  'Đỗ Thị Khanh','Hồ Văn Khánh','Ngô Thị Khoa','Lý Văn Khôi','Dương Thị Kim',
  'Phan Văn Kính','Trương Thị La','Võ Văn Lại','Lưu Thị Lanh','Cao Thị Lành',
  'Trần Văn Lập','Nguyễn Thị Lâu','Lê Văn Lê','Phạm Thị Lễ','Hoàng Văn Lịch',
  'Đặng Thị Liễu','Bùi Văn Lợi','Đinh Thị Loan','Vũ Văn Lộc','Đỗ Văn Lương',
  'Hồ Thị Lụa','Ngô Văn Lực','Lý Thị Lý','Dương Văn Mẫn','Phan Thị Mến',
  'Trương Văn Mộc','Võ Thị Mơ','Lưu Văn Mừng','Cao Văn Mỹ','Trần Thị Nết',
  'Nguyễn Văn Nghĩa','Lê Thị Nhi','Phạm Văn Nhị','Hoàng Thị Nhuần','Đặng Văn Nở',
  'Bùi Thị Nương','Đinh Văn Oanh','Vũ Thị Ổn','Đỗ Văn Phẩm','Hồ Thị Phấn',
  'Ngô Văn Phước','Lý Thị Qua','Dương Văn Quang','Phan Thị Quế','Trương Văn Quyết',
  'Võ Thị Quyền','Lưu Văn Sang','Cao Thị Sen','Trần Văn Sơn','Nguyễn Thị Sương',
  'Lê Văn Tâm','Phạm Thị Tân','Hoàng Văn Thân','Đặng Thị Thập','Bùi Văn Thế',
  'Đinh Thị Thịnh','Vũ Văn Thoại','Đỗ Thị Thuận','Hồ Văn Thương','Ngô Thị Tích',
  // Boss names for authenticity
  'Minh Phạm','Trung Nguyễn','Lan Anh','Hùng Trần','Linh Nguyễn',
  'Tuấn Anh','Hải Đăng','Bảo Châu','Khánh Linh','Đức Minh',
  'Thanh Trúc','Hoàng Nam','Thu Hà','Việt Anh','Phương Thảo',
  'Quốc Dũng','Mỹ Hạnh','Gia Huy','Kim Ngân','Bá Thịnh',
  'Hà Linh','Thanh Long','Nhật Minh','Xuân Mai','Tiến Đạt',
  'Anh Tuấn','Bích Ngọc','Công Danh','Diễm Thúy','Gia Bảo',
  'Hồng Nhung','Kiều Oanh','Lâm Phát','Minh Châu','Ngọc Hân',
  'Oanh Liên','Phi Long','Quỳnh Anh','Thái Sơn','Uyên Phương',
  'Văn Tú','Xuân Hoa','Yến Nhi','Ánh Tuyết','Đình Khải',
  'Hữu Phúc','Khắc Nghĩa','Lệ Hằng','Mộng Tuyền','Ngọc Thảo',
  // Shop owners
  'Chủ shop Hoa Đào','Chủ shop Áo Xinh','Agency MediaPro VN',
  'Shop Thời Trang TX','Team Ads GoViral','Agency ThinkMax',
  'Shop Mỹ Phẩm Linh','Team Marketing HCMC','Ads Manager Thành',
]

const EN_NAMES = [
  'James Wilson','Sarah Johnson','Michael Chen','Emily Davis','David Kim',
  'Jessica Brown','Chris Martinez','Amanda Taylor','Ryan Lee','Laura White',
  'Daniel Harris','Megan Clark','Kevin Lewis','Rachel Walker','Brian Hall',
  'Stephanie Young','Justin Allen','Melissa King','Brandon Wright','Nicole Scott',
  'Tyler Adams','Samantha Baker','Austin Gonzalez','Ashley Nelson','Nathan Carter',
  'Brittany Mitchell','Jordan Perez','Heather Roberts','Adam Turner','Kayla Phillips',
  'Lucas Campbell','Amber Evans','Aaron Edwards','Courtney Collins','Evan Stewart',
  'Hannah Sanchez','Ian Morris','Natalie Rogers','Kyle Reed','Melissa Cook',
  'Ethan Morgan','Diana Bell','Seth Murphy','Crystal Bailey','Caleb Rivera',
  'Victoria Cooper','Sean Richardson','Tiffany Cox','Patrick Howard','Stacey Ward',
  'Alex Torres','Brooke Peterson','Dustin Gray','Candice Ramirez','Cody James',
  'Vanessa Watson','Jake Brooks','Danielle Kelly','Zach Sanders','Marissa Price',
  'Trevor Bennett','Leah Wood','Marcus Barnes','Gabrielle Ross','Spencer Henderson',
  'Cassandra Coleman','Owen Jenkins','Jasmine Perry','Garrett Powell','Sierra Long',
  'Zachary Patterson','Andrea Hughes','Derek Flores','Monica Washington','Graham Butler',
  'Kristen Simmons','Logan Foster','Veronica Gonzales','Seth Bryant','Elena Alexander',
  'Kurt Russell','Jennifer Lawrence','Tom Holland','Emma Stone','Chris Pratt',
  'Anna Williams','Sam Johnson','Mike Anderson','Lisa Thompson','John Davis',
  'Mary Jackson','Robert Garcia','Patricia Martinez','Charles Rodriguez','Linda Lewis',
  'Mark Walker','Barbara Hall','William Young','Susan King','Richard Wright',
  'Donna Scott','Joseph Green','Carol Adams','Thomas Baker','Sharon Nelson',
]

const PLANS = ['gói Cá nhân', 'gói Doanh nghiệp', 'gói Agency', 'gói dùng thử']
const PLAN_EN = ['Personal plan', 'Business plan', 'Agency plan', 'Free trial']
const ACTIONS_VI = [
  'vừa đăng ký', 'vừa gia hạn', 'vừa nâng cấp lên', 'vừa mua'
]
const ACTIONS_EN = ['just registered', 'just renewed', 'just upgraded to', 'just purchased']

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function generateNotification() {
  const isVN  = Math.random() < 0.75
  const name  = isVN ? randomItem(VI_NAMES) : randomItem(EN_NAMES)
  const plan  = Math.floor(Math.random() * 4)
  const action = isVN ? randomItem(ACTIONS_VI) : randomItem(ACTIONS_EN)
  const planLabel = isVN ? PLANS[plan] : PLAN_EN[plan]
  const text  = isVN
    ? `${name} ${action} ${planLabel}`
    : `${name} ${action} ${planLabel}`

  const mins  = Math.floor(Math.random() * 30)
  const timeText = isVN
    ? (mins === 0 ? 'vừa xong' : `${mins} phút trước`)
    : (mins === 0 ? 'just now' : `${mins}m ago`)

  return { name, text, timeText, isVN }
}

export default function FomoPopup() {
  const [notif, setNotif]     = useState(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const show = () => {
    setNotif(generateNotification())
    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), 5500)
  }

  useEffect(() => {
    // First popup after 4s
    const first = setTimeout(show, 4000)

    // Then repeat every 15-45s
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 30000
      timerRef.current = setTimeout(() => { show(); scheduleNext() }, delay)
    }
    const repeat = setTimeout(scheduleNext, 12000)

    return () => { clearTimeout(first); clearTimeout(repeat); clearTimeout(timerRef.current) }
  }, [])

  if (!notif) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      zIndex: 9000,
      maxWidth: 320,
      transform: visible ? 'translateX(0)' : 'translateX(-120%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
    }}>
      <div style={{
        background: 'rgba(0,15,30,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,199,222,0.2)',
        borderRadius: 14,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,199,222,0.05)',
      }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, hsl(${Math.random()*360},60%,40%), hsl(${Math.random()*360},60%,60%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: '#fff',
        }}>
          {notif.name.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {notif.text}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(0,199,222,0.6)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 6px #00e676' }} />
            Go Meta Ads Pro · {notif.timeText}
          </div>
        </div>

        <button onClick={() => setVisible(false)} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer', fontSize: 14, padding: '0 0 0 4px', flexShrink: 0,
          lineHeight: 1,
        }}>✕</button>
      </div>
    </div>
  )
}

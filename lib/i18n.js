// ═══════════════════════════════════════════════════════════════
//  Go Meta Ads Pro — Translations (VI / EN)
//  Covers every section of the website
// ═══════════════════════════════════════════════════════════════

export const translations = {

  /* ═══════════════════════ VIETNAMESE ═══════════════════════ */
  vi: {

    nav: {
      features:  'Tính năng',
      pricing:   'Bảng giá',
      guide:     'Hướng dẫn',
      affiliate: 'Affiliate',
      download:  'Tải xuống',
      lookupKey: 'Tra cứu key',
      tryFree:   'Dùng thử miễn phí',
    },

    hero: {
      badge: 'Hơn 500+ shop & agency tin dùng mỗi ngày',
      title1: 'Đồng bộ CPA từng sản phẩm',
      title2: 'Biết ngay lãi hay lỗ',
      desc:   'Thiết lập CPA tối đa theo kế hoạch kinh doanh, đồng bộ ngay cho cả team. Tool tự so sánh với chi tiêu thực tế và cảnh báo ngay khi chiến dịch bắt đầu lỗ — để bạn không còn đốt tiền ads mà không hay biết.',
      cta1:   'Dùng thử 7 ngày miễn phí',
      cta2:   'Xem bảng giá →',
      trust: [
        'Cài đặt 3 phút',
        'Dữ liệu local, bảo mật tuyệt đối',
        'Không cấp phép phức tạp',
        'Hỗ trợ Zalo trực tiếp',
      ],
    },

    stats: [
      { num: 2800, suffix: '+',  label: 'Tài khoản ads đang đồng bộ',     note: 'và tăng mỗi ngày' },
      { display: '1 phút',       label: 'Tự động cập nhật dữ liệu',        note: 'không cần F5' },
      { num: 22,   suffix: '%',  label: 'Giảm chi phí ads trung bình',     note: 'sau 30 ngày dùng' },
      { num: 4.9,  suffix: '★',  label: 'Đánh giá từ 127+ người dùng',     note: 'đánh giá trung bình' },
    ],

    problems: {
      badge:    'Bạn đang gặp vấn đề này?',
      title:    'Bạn đang lãng phí tiền ads mà không hay biết?',
      subtitle: 'Những vấn đề này xảy ra hàng ngày với hàng nghìn shop & agency tại Việt Nam — và đều có thể giải quyết tự động.',
      items: [
        { icon: '📉', title: 'CPA vượt ngưỡng không biết',      desc: 'Đến cuối ngày mới thấy camp đang lỗ. Trong khi đó hàng triệu đồng đã chảy đi mà không hay.' },
        { icon: '📊', title: 'Không biết sản phẩm nào lãi',     desc: 'Spend nhiều nhưng không biết sản phẩm nào thực sự có lãi sau khi trừ hết hoàn hàng, ship, VAT.' },
        { icon: '👥', title: 'NV hiểu CPA mỗi người một kiểu',  desc: 'Admin nói CPA 50K, nhân viên hiểu 50K gross — không ai tính hoàn hàng, ship, phí Marketplace.' },
        { icon: '🕐', title: 'Báo cáo mất 2 tiếng mỗi sáng',   desc: 'Copy số từ Ads Manager, paste vào Excel, tính toán thủ công — lặp đi lặp lại mỗi ngày.' },
        { icon: '😴', title: 'Camp chạy lãng phí ban đêm',      desc: 'Không có người theo dõi, adset tiêu tiền qua đêm với CPA cao mà không ai biết cho đến sáng.' },
        { icon: '🔁', title: 'Set ads thủ công mệt mỏi',        desc: 'Mỗi bài viết mới phải tạo camp tay — cấu hình, audience, creative, budget từng bước một.' },
      ],
    },

    features: {
      badge:    '6 tính năng cốt lõi',
      title:    'Sáu trụ cột giúp bạn kinh doanh chủ động hơn',
      subtitle: 'Mỗi tính năng giải quyết đúng 1 vấn đề thực tế mà shop & agency gặp phải mỗi ngày.',
      items: [
        { icon: '🎯', title: 'Đồng bộ CPA mục tiêu',       desc: 'Thiết lập CPA tối đa theo kế hoạch kinh doanh. Cả team nhìn vào cùng 1 con số — không còn mỗi người hiểu mỗi kiểu.',                                   tags: ['CPA mục tiêu', 'Đồng bộ team', 'Tự cập nhật'] },
        { icon: '📊', title: 'Theo dõi theo sản phẩm',     desc: 'Mỗi camp gắn với sản phẩm cụ thể. Xem ngay CPA thực tế vs mục tiêu, ROAS, lãi/lỗ từng dòng sản phẩm — không cần mở Excel.',                           tags: ['Realtime', 'Theo sản phẩm', 'CPA so sánh'] },
        { icon: '🔔', title: 'Cảnh báo thông minh 7 ngày', desc: 'Phân tích xu hướng 7 ngày qua. Phát hiện sớm adset CPA tăng >50%, 3 ngày 0 đơn, ROAS giảm — có đề xuất hành động cụ thể.',                              tags: ['7 loại cảnh báo', 'Đề xuất hành động', 'Cảnh báo sớm'] },
        { icon: '💚', title: 'Auto Care & Action nhanh',   desc: 'Toggle bật/tắt, sửa ngân sách, bulk action hàng loạt ngay trong tool. Off-hours tự pause adset ban đêm, tự resume sáng hôm sau.',                     tags: ['Bulk action', 'Off-hours pause', 'Auto resume'] },
        { icon: '⚙️', title: 'Tự động set quảng cáo',      desc: 'Quét bài viết Facebook → tự tạo Campaign + Adset + Creative theo hashtag sản phẩm. Tiết kiệm 90% thời gian set ads thủ công.',                        tags: ['Web Conv', 'Messenger', 'Bulk creation'] },
        { icon: '📱', title: 'Báo cáo Telegram & Lark',   desc: 'Gửi báo cáo chi tiêu, đơn hàng, ROAS, lãi/lỗ vào Telegram/Lark theo lịch. Cả team xem cùng lúc — không cần mở Ads Manager.',                          tags: ['Realtime', 'Lịch tùy chỉnh', 'Cả team nhận'] },
      ],
    },

    beforeAfter: {
      badge:  'So sánh trước và sau',
      title:  'Khác biệt rõ ràng chỉ sau vài ngày sử dụng',
      before: [
        'Mỗi sáng phải mở Excel ghi tay số liệu',
        'Không biết camp nào lãi, camp nào lỗ',
        'NV mỗi người hiểu CPA mục tiêu một kiểu',
        'CPA vượt ngưỡng — cuối ngày mới thấy',
        'Set ads mỗi bài viết mất 30 phút thủ công',
        'Không biết lãi lỗ — chỉ thấy spend và click',
      ],
      after: [
        'Tự động cập nhật sau 1 phút, không cần tay',
        'Thấy ngay lãi/lỗ từng sản phẩm theo realtime',
        'Đồng bộ CPA cho cả team chỉ 1 click duy nhất',
        'Cảnh báo ngay khi CPA vượt — trước khi mất thêm',
        'Quét bài → tự tạo camp hoàn chỉnh trong 3 phút',
        'Báo cáo lãi/lỗ tự động gửi Telegram mỗi ngày',
      ],
    },

    howItWorks: {
      badge:    'Bắt đầu trong 3 phút',
      title:    'Cách hoạt động cực kỳ đơn giản',
      subtitle: 'Bốn bước từ cài đặt đến tối ưu chiến dịch đầu tiên — không cần kỹ thuật, không cần cấu hình phức tạp.',
      steps: [
        { num: '01', icon: '📥', title: 'Cài tiện ích Chrome',  desc: 'Tải file ZIP → giải nén → cài vào Chrome trong 1 phút. Không cần tài khoản, không cần cấu hình phức tạp.' },
        { num: '02', icon: '🎯', title: 'Nhập CPA mục tiêu',   desc: 'Thiết lập CPA tối đa cho từng sản phẩm theo kế hoạch kinh doanh. Tool tự tính từ giá vốn, hoàn hàng, chi phí.' },
        { num: '03', icon: '👥', title: 'Đồng bộ cho team',    desc: 'Nhập key NV cho nhân viên — cả team nhận CPA mục tiêu, theo dõi cùng chiến dịch trên máy riêng.' },
        { num: '04', icon: '📈', title: 'Tối ưu lập tức',      desc: 'Nhận cảnh báo ngay khi CPA vượt ngưỡng. Quyết định scale hay dừng — chính xác, kịp thời, không bỏ lỡ.' },
      ],
    },

    testimonials: {
      badge:    'Đánh giá thực tế',
      title:    'Chủ shop & Agency nói gì về Go Meta Ads Pro?',
      subtitle: '4.9/5 sao từ 127+ đánh giá thực tế — không có review ảo, không có fake testimonial.',
      items: [
        {
          name:    'Trung Nguyễn',
          role:    'Chủ shop thời trang HCM · 9 TK ads',
          content: 'Từ khi dùng Go Meta Ads Pro, tôi không cần ngồi tổng hợp Excel mỗi sáng nữa. CPA được đồng bộ cho cả team, ai cũng biết camp nào đang tốt, camp nào cần điều chỉnh. Tiết kiệm cả tiếng mỗi ngày.',
          result:  'Giảm 24% chi phí ads lãng phí',
        },
        {
          name:    'Minh Phạm',
          role:    'Giám đốc điều hành · Agency Hà Nội · 5 nhân viên',
          content: 'Tính năng lãi lỗ tự động là thứ tôi cần nhất. Nhập giá vốn, giá bán, tỉ lệ hoàn hàng một lần — hệ thống tự tính CPA tối đa. Cả team biết ngưỡng cần giữ, không ai tối ưu sai hướng nữa.',
          result:  'ROAS tăng từ 2.5x lên 3.8x sau 3 tuần',
        },
        {
          name:    'Lan Anh',
          role:    'Marketing Manager · Công ty FMCG · 10 sản phẩm',
          content: 'Tính năng cảnh báo thông minh giúp tôi tiết kiệm rất nhiều. Trước đây đến cuối ngày mới biết có camp nào vượt CPA, giờ nhận alert ngay — xử lý kịp trước khi tốn thêm tiền vô ích.',
          result:  'Tiết kiệm ~180K tiền ads lãng phí/tháng',
        },
      ],
    },

    pricing: {
      badge:     'Tìm gói phù hợp',
      title:     'Gói nào phù hợp với bạn?',
      subtitle:  'Trả lời 4 câu hỏi nhanh — chúng tôi sẽ gợi ý gói tối ưu cho quy mô của bạn.',
      questions: [
        {
          question: 'Bạn đang gặp vấn đề gì?',
          subtitle: 'Chọn một hoặc nhiều vấn đề đang gặp (multi-select)',
          multi: true,
          choices: [
            { icon: '📉', title: 'CPA không kiểm soát',  desc: 'Vượt ngưỡng không biết kịp' },
            { icon: '📋', title: 'Báo cáo thủ công',     desc: 'Excel mỗi sáng tốn 1-2 tiếng' },
            { icon: '👥', title: 'NV làm sai CPA',       desc: 'Mỗi người hiểu một kiểu' },
            { icon: '💸', title: 'Không biết lãi lỗ',   desc: 'Không rõ camp nào đang lãi' },
            { icon: '🤖', title: 'Muốn tự động hóa',    desc: 'Giảm thao tác thủ công' },
            { icon: '😴', title: 'Camp chạy ban đêm',    desc: 'Tiêu tiền không ai kiểm soát' },
          ],
        },
        {
          question: 'Team của bạn có bao nhiêu người?',
          subtitle: 'Chọn quy mô team hiện tại',
          multi: false,
          choices: [
            { icon: '🧑',           title: 'Chỉ mình tôi', desc: 'Tự quản lý toàn bộ' },
            { icon: '👫',           title: '2–3 người',     desc: 'Team nhỏ mới hình thành' },
            { icon: '👨‍👩‍👧‍👦', title: '4-10 người',    desc: 'Team trung bình' },
            { icon: '🏢',           title: '10+ người',     desc: 'Agency hoặc công ty lớn' },
          ],
        },
        {
          question: 'Ngân sách ads trung bình mỗi tháng?',
          subtitle: 'Giúp chúng tôi gợi ý gói phù hợp nhất',
          multi: false,
          choices: [
            { icon: '💵', title: 'Dưới 10 triệu',    desc: 'Shop nhỏ mới chạy ads' },
            { icon: '💴', title: '10–50 triệu',       desc: 'Shop đang tăng trưởng' },
            { icon: '💶', title: '50–200 triệu',      desc: 'Shop đang scale mạnh' },
            { icon: '💷', title: 'Trên 200 triệu',    desc: 'Agency hoặc doanh nghiệp lớn' },
          ],
        },
        {
          question: 'Bạn đang quản lý bao nhiêu tài khoản ads?',
          subtitle: 'Số tài khoản Facebook Ads Manager',
          multi: false,
          choices: [
            { icon: '1️⃣', title: '1–3 TK',    desc: 'Tập trung 1 shop' },
            { icon: '4️⃣', title: '4–10 TK',   desc: 'Nhiều shop hoặc nhiều TK' },
            { icon: '🔟', title: '11–50 TK',   desc: 'Multi-shop hoặc agency nhỏ' },
            { icon: '♾️', title: '50+ TK',     desc: 'Agency lớn, nhiều khách hàng' },
          ],
        },
      ],
      plans: [
        {
          key:        'personal',
          name:       'Cá nhân',
          priceMonth: 200,
          priceYear:  160,
          desc:       'Phù hợp shop nhỏ, quản lý 1 người',
          features: [
            '1 Admin + 1 Nhân viên',
            'Không giới hạn tài khoản ads',
            'Đồng bộ CPA cho team',
            'Cập nhật 1 phút/lần',
            'Cảnh báo thông minh 7 ngày',
            'Bật/tắt & sửa ngân sách nhanh',
          ],
          notIncluded: [
            'Bulk action hàng loạt',
            'Auto Care quảng cáo',
            'Báo cáo lãi lỗ chi tiết',
          ],
          cta: 'Mua Personal',
        },
        {
          key:        'business',
          name:       'Doanh nghiệp',
          priceMonth: 500,
          priceYear:  400,
          desc:       'Dành cho team 2–5 người, shop đang scale',
          popular:    true,
          features: [
            '2 Admin + 5 Nhân viên',
            'Không giới hạn tài khoản ads',
            'Đồng bộ CPA cho team',
            'Cập nhật 1 phút/lần',
            'Cảnh báo thông minh 7 ngày',
            'Bật/tắt & sửa ngân sách nhanh',
            'Bulk action hàng loạt',
            'Auto Care quảng cáo',
            'Báo cáo lãi lỗ chi tiết theo SP',
            'Hỗ trợ qua Zalo',
          ],
          notIncluded: [],
          cta: 'Mua Business — Tiết kiệm nhất',
        },
        {
          key:        'agency',
          name:       'Agency',
          priceMonth: 1200,
          priceYear:  960,
          desc:       'Agency, multi-shop, không giới hạn quy mô',
          features: [
            '6 Admin + Không giới hạn NV',
            'Không giới hạn tài khoản ads',
            'Đồng bộ CPA cho team',
            'Cập nhật 1 phút/lần',
            'Cảnh báo thông minh 7 ngày',
            'Bulk action hàng loạt',
            'Auto Care quảng cáo',
            'Báo cáo lãi lỗ chi tiết theo SP',
            'Hỗ trợ 1-1 Zalo / Call',
          ],
          notIncluded: [],
          cta: 'Mua Agency',
        },
      ],
      billingMonth:  'Theo tháng',
      billingYear:   'Theo năm',
      yearSave:      'Tiết kiệm 20%',
      recommend:     'Gợi ý cho bạn',
      popularLabel:  'Phổ biến nhất',
      perMonth:      '/tháng',
      buyNow:        'Mua ngay',
      tryFree:       'Dùng thử 7 ngày',
      prev:          '← Quay lại',
      next:          'Tiếp theo →',
      seeResult:     'Xem gói phù hợp →',
      skipWizard:    'Xem tất cả gói →',
      retake:        '← Làm lại khảo sát',
      stepLabels:    ['Vấn đề', 'Team', 'Ngân sách', 'Tài khoản'],
      guarantees:    ['Thanh toán an toàn', 'Dữ liệu local bảo mật', 'Hỗ trợ Zalo trong 5 phút', 'Không tự động gia hạn'],
    },

    faq: {
      badge: 'FAQ',
      title: 'Mọi thắc mắc được giải đáp tại đây',
      items: [
        {
          q: 'Dữ liệu tài khoản ads của tôi có an toàn không?',
          a: 'Hoàn toàn an toàn. Go Meta Ads Pro chạy 100% local trên Chrome của bạn — dữ liệu không gửi về server nào. Token Facebook chỉ lưu trên máy bạn và chỉ bạn thấy.',
        },
        {
          q: 'Tôi có thể dùng thử trước khi mua không?',
          a: 'Có. Gói dùng thử 7 ngày miễn phí cho trải nghiệm đầy đủ tính năng gói Agency. Sau 7 ngày bạn chọn gói phù hợp hoặc không cần tiếp tục — không tự động trừ tiền.',
        },
        {
          q: 'Cài Go Meta Ads Pro có làm Facebook khoá tài khoản ads không?',
          a: 'Không. Tool đọc dữ liệu qua API chính thức của Facebook, không can thiệp vào giao diện hay thao tác tự động trên Ads Manager. Hàng nghìn shop đang dùng mà không có vấn đề gì.',
        },
        {
          q: 'Tôi có 5 nhân viên, mỗi người 1 máy — có dùng được không?',
          a: 'Được. Gói Business hỗ trợ 5 nhân viên, mỗi người nhận key NV riêng. Admin set CPA mục tiêu, NV đồng bộ về máy và xem theo dõi chiến dịch của mình.',
        },
        {
          q: 'Tính năng tự động pause/tăng ngân sách hoạt động thế nào?',
          a: 'Bạn thiết lập điều kiện (CPA > ngưỡng, 0 đơn 3 ngày...) → tool tự kiểm tra mỗi phút khi Chrome mở → tự pause hoặc tăng ngân sách theo rule. Bạn nhận thông báo Telegram khi có action.',
        },
        {
          q: 'CPA mục tiêu được tính như thế nào?',
          a: 'Bạn nhập: giá bán, giá vốn, % ads, % hoàn hàng, phí ship... → tool tính lãi/đơn và ngược suy ra CPA tối đa để vẫn có lãi. Con số này đồng bộ cho cả team chỉ 1 click.',
        },
        {
          q: 'Tôi đổi máy hoặc cài lại Chrome thì sao?',
          a: 'Mỗi key được khóa với 1 thiết bị. Nếu cần đổi máy, vào trang Tra cứu → nhập SĐT đăng ký → reset thiết bị (tối đa 1 lần/tháng, hoàn toàn tự động).',
        },
        {
          q: 'Có hợp đồng hay tự động gia hạn không?',
          a: 'Không có hợp đồng, không tự gia hạn. Bạn thanh toán từng tháng hoặc từng năm — hệ thống cập nhật hạn sử dụng ngay sau khi nhận được thanh toán.',
        },
      ],
    },

    cta: {
      badge:    'Bắt đầu ngay hôm nay',
      title:    'Bắt đầu tối ưu ads ngay hôm nay',
      subtitle: 'Dùng thử 7 ngày miễn phí — không cần thẻ tín dụng, không cần cài đặt phức tạp, hỗ trợ Zalo trực tiếp trong 5 phút.',
      cta1:     'Dùng miễn phí 7 ngày',
      cta2:     'Xem bảng giá →',
      contact:  'Liên hệ hỗ trợ:',
    },

    security: {
      title: 'Dữ liệu của bạn — chỉ bạn thấy',
      desc:  'Go Meta Ads Pro là tiện ích Chrome chạy hoàn toàn local trên trình duyệt của bạn. Toàn bộ dữ liệu chiến dịch, chi tiêu, doanh thu chỉ hiển thị trên máy bạn — không gửi về server, không chia sẻ bên thứ ba. Hơn 500+ shop & agency đã dùng từ 2024 mà chưa có sự cố bảo mật nào.',
      items: [
        { icon: '🏠', title: 'Dữ liệu local',    desc: 'Lưu trên Chrome của bạn, không đâu khác' },
        { icon: '🚫', title: 'Không gửi server', desc: 'Không log bất kỳ dữ liệu nào về phía chúng tôi' },
        { icon: '⚡', title: 'Chạy ổn định',     desc: 'Hoạt động liên tục từ 2024, không có downtime' },
        { icon: '🔑', title: 'Key riêng biệt',   desc: 'Mỗi thiết bị 1 key độc lập, không chia sẻ' },
      ],
    },

    footer: {
      productLabel:   'Sản phẩm',
      supportLabel:   'Hỗ trợ',
      businessLabel:  'Kinh doanh',
      productLinks: [
        { label: 'Tính năng',        href: '#features' },
        { label: 'Bảng giá',         href: '#pricing' },
        { label: 'Tải xuống',        href: '/tai-xuong' },
        { label: 'Hướng dẫn sử dụng', href: '/huong-dan' },
        { label: 'Nhật ký cập nhật', href: '/huong-dan#changelog' },
      ],
      supportLinks: [
        { label: 'Tra cứu key',         href: '/quan-ly' },
        { label: 'Zalo hỗ trợ',         href: 'https://zalo.me', external: true },
        { label: 'Telegram Bot',         href: 'https://t.me/Go_Meta_Ads_Pro_V1_bot', external: true },
        { label: 'Câu hỏi thường gặp',  href: '#faq' },
      ],
      businessLinks: [
        { label: 'Chương trình Affiliate', href: '/affiliate' },
        { label: 'Mua gói',                href: '/mua-goi' },
        { label: 'Liên hệ hợp tác',        href: 'mailto:admin@gonetwork.vn' },
      ],
      copyright: '© 2026 Go Media Vietnam · Go Meta Ads Pro',
      terms:     'Điều khoản',
      privacy:   'Bảo mật',
      contact:   'Liên hệ',
      tagline:   'Đồng bộ CPA, biết ngay lãi hay lỗ.',
    },

    pages: {
      'tai-xuong': {
        title:    'Tải xuống Go Meta Ads Pro',
        subtitle: 'Cài đặt tiện ích Chrome trong 1 phút — bắt đầu theo dõi CPA ngay hôm nay.',
        steps:    ['Tải file ZIP', 'Giải nén', 'Mở chrome://extensions', 'Bật Developer mode', 'Load Unpacked'],
        note:     'Yêu cầu Chrome 100+ trở lên. Không hỗ trợ Firefox, Safari.',
        cta:      'Tải xuống ngay (miễn phí 7 ngày)',
      },
      'quan-ly': {
        title:    'Tra cứu & Quản lý key',
        subtitle: 'Nhập số điện thoại đã đăng ký để xem thông tin key, hạn sử dụng và reset thiết bị.',
        phonePlaceholder: 'Nhập số điện thoại (VD: 0901234567)',
        searchBtn:        'Tra cứu',
        resetDevice:      'Reset thiết bị',
        resetNote:        'Tối đa 1 lần/tháng · Tự động xử lý ngay',
      },
      'mua-goi': {
        title:    'Mua gói Go Meta Ads Pro',
        subtitle: 'Chọn gói và hoàn tất thanh toán — key sẽ gửi qua Zalo/Telegram trong vài phút.',
        payNote:  'Hỗ trợ: Chuyển khoản ngân hàng · MoMo · ZaloPay',
        successMsg: 'Thanh toán thành công! Key của bạn đã được gửi qua Zalo.',
      },
      affiliate: {
        title:      'Kiếm tiền cùng Go Meta Ads Pro',
        subtitle:   'Hoa hồng 30% trên mỗi đơn thành công — không giới hạn thu nhập.',
        commission: '30% hoa hồng',
        howTitle:   'Cách tham gia',
        steps:      ['Đăng ký affiliate miễn phí', 'Nhận link giới thiệu riêng', 'Chia sẻ cho cộng đồng', 'Nhận hoa hồng mỗi tháng'],
        cta:        'Đăng ký Affiliate ngay',
      },
      'huong-dan': {
        title:    'Hướng dẫn sử dụng Go Meta Ads Pro',
        subtitle: 'Từ cài đặt đến tối ưu chiến dịch đầu tiên — mọi thứ đều có ở đây.',
        sections: ['Cài đặt ban đầu', 'Thiết lập CPA mục tiêu', 'Đồng bộ cho team', 'Cảnh báo thông minh', 'Báo cáo tự động', 'Auto Care', 'FAQ'],
      },
    },
  },

  /* ════════════════════════════ ENGLISH ═══════════════════════════ */
  en: {

    nav: {
      features:  'Features',
      pricing:   'Pricing',
      guide:     'Guide',
      affiliate: 'Affiliate',
      download:  'Download',
      lookupKey: 'Check Key',
      tryFree:   'Try Free',
    },

    hero: {
      badge: 'Trusted by 500+ shops & agencies every day',
      title1: 'Sync CPA by Product',
      title2: 'Know your profit instantly',
      desc:   'Set maximum CPA targets based on your business plan, synced for the whole team. Get alerts the moment a campaign starts losing money — no more blind ad spending.',
      cta1:   'Try Free for 7 Days',
      cta2:   'View Pricing →',
      trust: [
        '3-min setup',
        'Data stays local & secure',
        'No complex permissions',
        'Direct Zalo support',
      ],
    },

    stats: [
      { num: 2800, suffix: '+',  label: 'Ad accounts being synced',     note: 'and growing daily' },
      { display: '1 min',        label: 'Auto data refresh interval',    note: 'no manual refresh' },
      { num: 22,   suffix: '%',  label: 'Average ad cost reduction',     note: 'after 30 days of use' },
      { num: 4.9,  suffix: '★',  label: 'Rating from 127+ real users',  note: 'average score' },
    ],

    problems: {
      badge:    'Are you facing these issues?',
      title:    'You\'re wasting ad money without realising it',
      subtitle: 'These problems happen every day with thousands of shops & agencies — and they can all be solved automatically.',
      items: [
        { icon: '📉', title: 'CPA spikes go unnoticed',        desc: 'You only find out at end of day that campaigns were losing money the whole time.' },
        { icon: '📊', title: 'Can\'t tell which products profit', desc: 'High spend but no clarity on which SKU actually makes money after returns, shipping, VAT.' },
        { icon: '👥', title: 'Team misaligns on CPA targets',  desc: 'Admin says CPA 50K, staff interprets it differently — nobody accounts for returns or platform fees.' },
        { icon: '🕐', title: 'Reports take 2 hours each morning', desc: 'Copy numbers from Ads Manager, paste into Excel, calculate manually — every single day.' },
        { icon: '😴', title: 'Campaigns burn cash overnight',  desc: 'No one watching, adsets spend through the night at high CPA — you only find out in the morning.' },
        { icon: '🔁', title: 'Manual ad setup is exhausting',  desc: 'Every new post requires a manual campaign — audience, creative, budget, step by step.' },
      ],
    },

    features: {
      badge:    '6 Core Features',
      title:    'Six pillars for smarter, more proactive ad management',
      subtitle: 'Each feature solves exactly one real problem shops & agencies face every day.',
      items: [
        { icon: '🎯', title: 'Sync CPA Targets',            desc: 'Set maximum CPA based on your business plan. The whole team looks at the same number — no more misalignment.',                     tags: ['Target CPA', 'Team sync', 'Auto-update'] },
        { icon: '📊', title: 'Product-level Tracking',      desc: 'Each campaign linked to a specific product. See actual vs target CPA, ROAS, profit/loss per SKU — no Excel needed.',             tags: ['Realtime', 'Per product', 'CPA compare'] },
        { icon: '🔔', title: '7-Day Smart Alerts',          desc: 'Analyses 7-day trends. Detects adsets where CPA rose >50%, 3 days with 0 orders, or ROAS dropped — with recommended actions.',  tags: ['7 alert types', 'Action tips', 'Early warning'] },
        { icon: '💚', title: 'Auto Care & Quick Actions',   desc: 'Toggle on/off, edit budgets, bulk actions — all inside the tool. Off-hours auto-pauses adsets at night, resumes in the morning.', tags: ['Bulk action', 'Off-hours pause', 'Auto resume'] },
        { icon: '⚙️', title: 'Auto Ad Creation',             desc: 'Scan Facebook posts → auto-create Campaign + Adset + Creative by product hashtag. Save 90% of manual ad setup time.',          tags: ['Web Conv', 'Messenger', 'Bulk creation'] },
        { icon: '📱', title: 'Telegram & Lark Reports',     desc: 'Send spend, orders, ROAS, profit/loss reports to Telegram or Lark on schedule. Whole team sees it — no Ads Manager needed.',    tags: ['Realtime', 'Custom schedule', 'Whole team'] },
      ],
    },

    beforeAfter: {
      badge:  'Before vs After',
      title:  'The difference is clear within days of using it',
      before: [
        'Open Excel every morning and log numbers manually',
        'Can\'t tell which campaigns are profitable',
        'Each team member interprets CPA targets differently',
        'CPA breach only noticed at end of day',
        'Each post takes 30 minutes to set up ads manually',
        'Only see spend and clicks — no profit/loss visibility',
      ],
      after: [
        'Auto-updates every minute — no manual work',
        'See profit/loss per product in realtime',
        'Team-wide CPA sync with one click',
        'Instant alert when CPA breaches — before more is lost',
        'Scan posts → auto-create full campaigns in 3 minutes',
        'Daily profit/loss report sent automatically to Telegram',
      ],
    },

    howItWorks: {
      badge:    'Up and running in 3 minutes',
      title:    'Incredibly simple to use',
      subtitle: 'Four steps from installation to optimising your first campaign — no technical skills required.',
      steps: [
        { num: '01', icon: '📥', title: 'Install Chrome Extension', desc: 'Download ZIP → unzip → install in Chrome in 1 minute. No account needed, no complex configuration.' },
        { num: '02', icon: '🎯', title: 'Enter CPA Targets',        desc: 'Set maximum CPA per product based on your business plan. Tool auto-calculates from cost, return rate, fees.' },
        { num: '03', icon: '👥', title: 'Sync with your Team',      desc: 'Give staff keys — the whole team receives CPA targets and monitors campaigns on their own devices.' },
        { num: '04', icon: '📈', title: 'Optimise Immediately',     desc: 'Get alerts the moment CPA breaches. Decide to scale or stop — accurate, timely, nothing missed.' },
      ],
    },

    testimonials: {
      badge:    'Real Reviews',
      title:    'What shop owners & agencies say about Go Meta Ads Pro',
      subtitle: '4.9/5 stars from 127+ real reviews — no fake testimonials.',
      items: [
        {
          name:    'Trung Nguyen',
          role:    'Fashion Shop Owner, HCM · 9 ad accounts',
          content: 'Since using Go Meta Ads Pro I no longer have to compile Excel every morning. CPA is synced for the whole team — everyone knows which campaigns are performing and which need adjusting. Saves me an hour every day.',
          result:  '24% reduction in wasted ad spend',
        },
        {
          name:    'Minh Pham',
          role:    'CEO · Hanoi Agency · 5 staff',
          content: 'The auto profit/loss feature is exactly what I needed. Enter cost price, selling price, return rate once — the system calculates max CPA automatically. The whole team knows the targets, no one optimises in the wrong direction.',
          result:  'ROAS improved from 2.5x to 3.8x in 3 weeks',
        },
        {
          name:    'Lan Anh',
          role:    'Marketing Manager · FMCG Company · 10 products',
          content: 'The smart alert feature saves me so much. Before, I\'d only find out at end of day if a campaign exceeded CPA — now I get an instant alert and can act before wasting more budget.',
          result:  'Saved ~180K in wasted ad spend per month',
        },
      ],
    },

    pricing: {
      badge:    'Find your plan',
      title:    'Which plan fits you?',
      subtitle: 'Answer 4 quick questions — we\'ll suggest the best plan for your scale.',
      questions: [
        {
          question: 'What challenges are you facing?',
          subtitle: 'Select one or more issues (multi-select)',
          multi: true,
          choices: [
            { icon: '📉', title: 'Uncontrolled CPA',     desc: 'Breach goes unnoticed until too late' },
            { icon: '📋', title: 'Manual reporting',      desc: 'Excel takes 1-2 hours each morning' },
            { icon: '👥', title: 'Team misaligns on CPA', desc: 'Everyone interprets it differently' },
            { icon: '💸', title: 'No profit visibility',  desc: 'Can\'t tell which campaigns make money' },
            { icon: '🤖', title: 'Want automation',       desc: 'Reduce manual tasks' },
            { icon: '😴', title: 'Overnight ad burns',    desc: 'Spend going out with no oversight' },
          ],
        },
        {
          question: 'How big is your team?',
          subtitle: 'Select your current team size',
          multi: false,
          choices: [
            { icon: '🧑',           title: 'Just me',      desc: 'Managing everything myself' },
            { icon: '👫',           title: '2–3 people',   desc: 'Small team just forming' },
            { icon: '👨‍👩‍👧‍👦', title: '4–10 people',  desc: 'Mid-sized team' },
            { icon: '🏢',           title: '10+ people',   desc: 'Agency or large company' },
          ],
        },
        {
          question: 'Average monthly ad budget?',
          subtitle: 'Helps us recommend the most suitable plan',
          multi: false,
          choices: [
            { icon: '💵', title: 'Under $500',   desc: 'Small shop just starting ads' },
            { icon: '💴', title: '$500–$2,000',  desc: 'Growing shop' },
            { icon: '💶', title: '$2,000–$8,000', desc: 'Scaling aggressively' },
            { icon: '💷', title: '$8,000+',       desc: 'Agency or enterprise' },
          ],
        },
        {
          question: 'How many ad accounts do you manage?',
          subtitle: 'Total Facebook Ads Manager accounts',
          multi: false,
          choices: [
            { icon: '1️⃣', title: '1–3 accounts',   desc: 'Single shop focus' },
            { icon: '4️⃣', title: '4–10 accounts',  desc: 'Multiple shops or accounts' },
            { icon: '🔟', title: '11–50 accounts',  desc: 'Multi-shop or small agency' },
            { icon: '♾️', title: '50+ accounts',    desc: 'Large agency, many clients' },
          ],
        },
      ],
      plans: [
        {
          key:        'personal',
          name:       'Personal',
          priceMonth: 200,
          priceYear:  160,
          desc:       'Perfect for small shops, solo management',
          features: [
            '1 Admin + 1 Staff',
            'Unlimited ad accounts',
            'Team CPA sync',
            '1-minute data refresh',
            '7-day smart alerts',
            'Quick toggle & budget edit',
          ],
          notIncluded: [
            'Bulk actions',
            'Auto Care',
            'Detailed profit/loss reports',
          ],
          cta: 'Buy Personal',
        },
        {
          key:        'business',
          name:       'Business',
          priceMonth: 500,
          priceYear:  400,
          desc:       'For teams of 2–5, shops that are scaling',
          popular:    true,
          features: [
            '2 Admin + 5 Staff',
            'Unlimited ad accounts',
            'Team CPA sync',
            '1-minute data refresh',
            '7-day smart alerts',
            'Quick toggle & budget edit',
            'Bulk actions',
            'Auto Care',
            'Detailed profit/loss by product',
            'Zalo support',
          ],
          notIncluded: [],
          cta: 'Buy Business — Best Value',
        },
        {
          key:        'agency',
          name:       'Agency',
          priceMonth: 1200,
          priceYear:  960,
          desc:       'Agency, multi-shop, unlimited scale',
          features: [
            '6 Admin + Unlimited Staff',
            'Unlimited ad accounts',
            'Team CPA sync',
            '1-minute data refresh',
            '7-day smart alerts',
            'Bulk actions',
            'Auto Care',
            'Detailed profit/loss by product',
            '1-on-1 Zalo / Call support',
          ],
          notIncluded: [],
          cta: 'Buy Agency',
        },
      ],
      billingMonth:  'Monthly',
      billingYear:   'Yearly',
      yearSave:      'Save 20%',
      recommend:     'Recommended for You',
      popularLabel:  'Most Popular',
      perMonth:      '/mo',
      buyNow:        'Buy Now',
      tryFree:       'Try Free 7 Days',
      prev:          '← Back',
      next:          'Next →',
      seeResult:     'See recommended plan →',
      skipWizard:    'See all plans →',
      retake:        '← Retake quiz',
      stepLabels:    ['Problems', 'Team', 'Budget', 'Accounts'],
      guarantees:    ['Secure payment', 'Local data security', 'Zalo support in 5 min', 'No auto-renewal'],
    },

    faq: {
      badge: 'FAQ',
      title: 'Every question answered here',
      items: [
        {
          q: 'Is my ad account data secure?',
          a: 'Completely safe. Go Meta Ads Pro runs 100% locally in your Chrome browser — data is never sent to any server. Your Facebook token is stored only on your device and only you can see it.',
        },
        {
          q: 'Can I try before buying?',
          a: 'Yes. The 7-day free trial gives you full access to all Agency-level features. After 7 days you choose a plan or stop — no automatic charges.',
        },
        {
          q: 'Will installing Go Meta Ads Pro get my Facebook ad account banned?',
          a: 'No. The tool reads data through Facebook\'s official API and does not interact with or automate actions inside Ads Manager. Thousands of shops have been using it since 2024 with zero issues.',
        },
        {
          q: 'I have 5 staff on separate computers — does this work?',
          a: 'Yes. The Business plan supports 5 staff members, each receiving their own staff key. Admin sets CPA targets, staff sync them to their machines and monitor their own campaigns.',
        },
        {
          q: 'How does the auto-pause / budget boost feature work?',
          a: 'You configure rules (CPA > threshold, 0 orders for 3 days…) → the tool checks every minute while Chrome is open → auto-pauses or adjusts budget per rule. You receive a Telegram notification when any action is taken.',
        },
        {
          q: 'How is the target CPA calculated?',
          a: 'You enter: selling price, cost price, ad %, return rate, shipping fee... → the tool calculates profit per order and back-calculates the maximum CPA to remain profitable. This figure syncs to the whole team with one click.',
        },
        {
          q: 'What if I change devices or reinstall Chrome?',
          a: 'Each key is locked to one device. If you need to switch, go to the Lookup page → enter your registered phone number → reset device (max once per month, fully automated).',
        },
        {
          q: 'Is there a contract or auto-renewal?',
          a: 'No contracts, no auto-renewal. You pay monthly or yearly — the system updates your expiry date immediately after payment is confirmed.',
        },
      ],
    },

    cta: {
      badge:    'Get started today',
      title:    'Start optimising your ads today',
      subtitle: 'Try free for 7 days — no credit card, no complex setup, Zalo support within 5 minutes.',
      cta1:     'Try Free for 7 Days',
      cta2:     'View Pricing →',
      contact:  'Contact support:',
    },

    security: {
      title: 'Your data — visible only to you',
      desc:  'Go Meta Ads Pro is a Chrome extension that runs entirely locally in your browser. All campaign data, spend, and revenue is displayed only on your device — nothing is sent to our servers or shared with third parties. 500+ shops & agencies have used it since 2024 with zero security incidents.',
      items: [
        { icon: '🏠', title: 'Local data',       desc: 'Stored in your Chrome, nowhere else' },
        { icon: '🚫', title: 'No server uploads', desc: 'We log absolutely nothing from your data' },
        { icon: '⚡', title: 'Reliable uptime',   desc: 'Running continuously since 2024, no downtime' },
        { icon: '🔑', title: 'Unique keys',       desc: 'One independent key per device, never shared' },
      ],
    },

    footer: {
      productLabel:   'Product',
      supportLabel:   'Support',
      businessLabel:  'Business',
      productLinks: [
        { label: 'Features',       href: '#features' },
        { label: 'Pricing',        href: '#pricing' },
        { label: 'Download',       href: '/tai-xuong' },
        { label: 'User Guide',     href: '/huong-dan' },
        { label: 'Changelog',      href: '/huong-dan#changelog' },
      ],
      supportLinks: [
        { label: 'Key Lookup',        href: '/quan-ly' },
        { label: 'Zalo Support',      href: 'https://zalo.me', external: true },
        { label: 'Telegram Bot',      href: 'https://t.me/Go_Meta_Ads_Pro_V1_bot', external: true },
        { label: 'FAQ',               href: '#faq' },
      ],
      businessLinks: [
        { label: 'Affiliate Program', href: '/affiliate' },
        { label: 'Buy a Plan',        href: '/mua-goi' },
        { label: 'Partnership',       href: 'mailto:admin@gonetwork.vn' },
      ],
      copyright: '© 2026 Go Media Vietnam · Go Meta Ads Pro',
      terms:     'Terms',
      privacy:   'Privacy',
      contact:   'Contact',
      tagline:   'Sync CPA. Know profit instantly.',
    },

    pages: {
      'tai-xuong': {
        title:    'Download Go Meta Ads Pro',
        subtitle: 'Install the Chrome extension in 1 minute — start tracking CPA today.',
        steps:    ['Download ZIP', 'Unzip', 'Open chrome://extensions', 'Enable Developer mode', 'Load Unpacked'],
        note:     'Requires Chrome 100 or higher. Firefox and Safari not supported.',
        cta:      'Download now (7-day free trial)',
      },
      'quan-ly': {
        title:    'Look up & Manage your key',
        subtitle: 'Enter your registered phone number to view key info, expiry date and reset your device.',
        phonePlaceholder: 'Enter phone number (e.g. 0901234567)',
        searchBtn:        'Search',
        resetDevice:      'Reset device',
        resetNote:        'Max once per month · Processed automatically',
      },
      'mua-goi': {
        title:    'Buy a Go Meta Ads Pro Plan',
        subtitle: 'Choose your plan and complete payment — key delivered via Zalo/Telegram within minutes.',
        payNote:  'Payment: Bank transfer · MoMo · ZaloPay',
        successMsg: 'Payment successful! Your key has been sent via Zalo.',
      },
      affiliate: {
        title:      'Earn with Go Meta Ads Pro',
        subtitle:   '30% commission on every successful referral — unlimited earning potential.',
        commission: '30% commission',
        howTitle:   'How to join',
        steps:      ['Register for free', 'Get your unique referral link', 'Share with your community', 'Receive monthly commissions'],
        cta:        'Join Affiliate Now',
      },
      'huong-dan': {
        title:    'Go Meta Ads Pro User Guide',
        subtitle: 'From installation to optimising your first campaign — everything you need is here.',
        sections: ['Initial setup', 'Setting CPA targets', 'Team sync', 'Smart alerts', 'Automated reports', 'Auto Care', 'FAQ'],
      },
    },
  },
}

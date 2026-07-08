# GoMeta Pro — Spec phân tích **Bước 0: Modal khởi tạo Campaign**

**Vị trí trong luồng:** Dialog modal hiện ra ĐẦU TIÊN khi user bấm "Tạo chiến dịch" — trước Bước 1 trong spec chính.
**Output:** 2 lựa chọn cốt lõi (`buying_type` + `objective`) → unlock màn hình config chi tiết bên dưới.
**Ghi chú:** Khi user chọn "Tiếp tục", Meta khởi tạo Campaign draft với 2 thông số này, sau đó load màn hình cấu hình ở Bước 1.

---

## Mục tiêu của bước

Đây là bước **gate**: Meta yêu cầu user chốt 2 quyết định chiến lược trước khi cho phép cấu hình chi tiết — vì objective quyết định toàn bộ các option khả dụng ở Ad Set (destination, optimization goal, billing event, CTA…). Với GoMeta Pro, AI bắt buộc phải suy luận đúng objective từ insight, vì sai ở đây sẽ kéo theo sai chain ở các bước sau.

---

## Các trường dữ liệu

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 0.1 | `buying_type` | Chọn cách mua | ✅ Required | Dropdown (2 options) | `Đấu giá` (`AUCTION`) | Mặc định `AUCTION`. Option khác: `RESERVED` (Đặt trước — Reach & Frequency) |
| 0.2 | `objective` | Chọn mục tiêu chiến dịch | ✅ Required | Radio list (6 options, single-select) | Tùy ảnh (mỗi ảnh chọn 1) | 6 ODAX objectives. Mỗi option có icon + label + mô tả + danh sách "Phù hợp với" (destination types) |

### Chi tiết enum `buying_type`

| Value | Label hiển thị | Mô tả Meta | Khi nào dùng |
|---|---|---|---|
| `AUCTION` | Đấu giá | Mua theo thời gian thực bằng cách đặt giá thầu có chi phí hợp lý | **Default cho 99% trường hợp** — flexible budget, dynamic delivery |
| `RESERVED` | Đặt trước | Mua trước để đạt kết quả dễ dự đoán hơn | Chỉ dùng cho R&F (Reach & Frequency) — branding ngân sách lớn, không phải MVP target |

→ **GoMeta Pro MVP: hardcode `AUCTION`**, không expose `RESERVED` cho user. Có thể thêm sau khi mở rộng cho khách enterprise.

### Chi tiết enum `objective` (6 options ODAX)

| Icon | Label hiển thị | API value | Mô tả Meta hiển thị | Phù hợp với (destinations) |
|---|---|---|---|---|
| 📢 (loa) | Mức độ nhận biết | `OUTCOME_AWARENESS` | Hiển thị quảng cáo cho những người có nhiều khả năng nhớ đến quảng cáo nhất | Số người tiếp cận, Mức độ nhận biết thương hiệu, Lượt xem video |
| 🖱️ (cursor) | Lưu lượng truy cập | `OUTCOME_TRAFFIC` | Chuyển mọi người tới một đích đến nào đó, chẳng hạn như trang web, ứng dụng, trang cá nhân Instagram hoặc sự kiện trên Facebook | Lượt click vào liên kết, Lượt xem trang đích, Lượt truy cập vào trang cá nhân Instagram, Messenger/Instagram/WhatsApp, Cuộc gọi |
| 💬 (chat bubble) | Lượt tương tác | `OUTCOME_ENGAGEMENT` | Tăng số tin nhắn, lượt mua qua tin nhắn, lượt xem video, lượt tương tác với bài viết, lượt thích Trang hoặc lượt phản hồi sự kiện | Messenger/Instagram/WhatsApp, Lượt xem video, Lượt tương tác với bài viết, Lượt chuyển đổi, Cuộc gọi |
| 🔻 (funnel) | Khách hàng tiềm năng | `OUTCOME_LEADS` | Tìm kiếm khách hàng tiềm năng cho doanh nghiệp hoặc thương hiệu của bạn | Trang web và mẫu phản hồi tức thì, Mẫu phản hồi tức thì, Messenger/Instagram/WhatsApp, Lượt chuyển đổi, Cuộc gọi |
| 👥 (people) | Quảng cáo ứng dụng | `OUTCOME_APP_PROMOTION` | Thu hút những người mới cài đặt và tiếp tục sử dụng ứng dụng của bạn | Lượt cài đặt ứng dụng, Sự kiện trong ứng dụng |
| 🛍️ (bag) | Doanh số | `OUTCOME_SALES` | Tìm những người có khả năng sẽ mua sản phẩm hoặc dịch vụ của bạn | Lượt chuyển đổi, Doanh số theo danh mục, Messenger/Instagram/WhatsApp, Cuộc gọi |

---

## Bảng MAPPING ĐẦY ĐỦ: Objective → Destination → Optimization Goal

**Đây là bảng tra cứu cốt lõi cho AI inference.** Khi AI gen objective, lập tức lookup bảng này để biết destination khả dụng + optimization_goal tương ứng.

| Objective (Campaign) | "Phù hợp với" (UI label) | `destination_type` (API) | `optimization_goal` (API) | `billing_event` (default) | Use case insight điển hình |
|---|---|---|---|---|---|
| `OUTCOME_AWARENESS` | Số người tiếp cận | `UNDEFINED` (page/post awareness) | `REACH` | `IMPRESSIONS` | Brand mới, ra mắt sản phẩm, không có pixel/data |
| `OUTCOME_AWARENESS` | Mức độ nhận biết thương hiệu | `UNDEFINED` | `AD_RECALL_LIFT` | `IMPRESSIONS` | Củng cố thương hiệu, đo lift recall |
| `OUTCOME_AWARENESS` | Lượt xem video | `ON_VIDEO` | `THRUPLAY` hoặc `VIDEO_VIEWS` | `IMPRESSIONS` | Có video creative, muốn tối đa view |
| `OUTCOME_TRAFFIC` | Lượt click vào liên kết | `WEBSITE` | `LINK_CLICKS` | `LINK_CLICKS` hoặc `IMPRESSIONS` | Drive traffic web, không cần track conversion sâu |
| `OUTCOME_TRAFFIC` | Lượt xem trang đích | `WEBSITE` | `LANDING_PAGE_VIEWS` | `IMPRESSIONS` | Yêu cầu pixel — tối ưu cho người thực sự load trang |
| `OUTCOME_TRAFFIC` | Lượt truy cập vào trang cá nhân Instagram | `INSTAGRAM_PROFILE` | `PROFILE_VISIT` (hoặc `LINK_CLICKS`) | `IMPRESSIONS` | Grow IG account |
| `OUTCOME_TRAFFIC` | Messenger / Instagram / WhatsApp | `MESSENGER` / `INSTAGRAM_DIRECT` / `WHATSAPP` | `LINK_CLICKS` (vì là Traffic) | `IMPRESSIONS` | Drive click vào chat — khác với ENGAGEMENT ở chỗ chỉ đo click, không đo conversation |
| `OUTCOME_TRAFFIC` | Cuộc gọi | `PHONE_CALL` | `QUALITY_CALL` hoặc `LINK_CLICKS` | `IMPRESSIONS` | Local business muốn người gọi điện |
| `OUTCOME_ENGAGEMENT` | Messenger / IG / WhatsApp | `MESSENGER` / `INSTAGRAM_DIRECT` / `WHATSAPP` | `CONVERSATIONS` | `IMPRESSIONS` | **Đây là case 4Q Seafood trong ảnh.** Đo cuộc trò chuyện được kích hoạt |
| `OUTCOME_ENGAGEMENT` | Lượt xem video | `ON_VIDEO` | `THRUPLAY` | `IMPRESSIONS` | Đo view video sâu hơn (15s hoặc full) |
| `OUTCOME_ENGAGEMENT` | Lượt tương tác với bài viết | `ON_POST` | `POST_ENGAGEMENT` | `IMPRESSIONS` | Like/comment/share — boost post truyền thống |
| `OUTCOME_ENGAGEMENT` | Lượt chuyển đổi | `WEBSITE` / `APP` | `OFFSITE_CONVERSIONS` | `IMPRESSIONS` | Đo conversion (cần pixel/SDK) — không phải sale, là event engagement |
| `OUTCOME_ENGAGEMENT` | Cuộc gọi | `PHONE_CALL` | `QUALITY_CALL` | `IMPRESSIONS` | — |
| `OUTCOME_LEADS` | Trang web và mẫu phản hồi tức thì | `WEBSITE` + Instant Form | `LEAD_GENERATION` | `IMPRESSIONS` | Kết hợp web form + Meta Lead Form |
| `OUTCOME_LEADS` | Mẫu phản hồi tức thì | `ON_AD` (Instant Form) | `LEAD_GENERATION` | `IMPRESSIONS` | **Instant Form trên Meta** — UX tốt nhất cho mobile lead |
| `OUTCOME_LEADS` | Messenger / IG / WhatsApp | `MESSENGER` / `INSTAGRAM_DIRECT` / `WHATSAPP` | `CONVERSATIONS` | `IMPRESSIONS` | Lead qua chat — Meta đo conversation chất lượng |
| `OUTCOME_LEADS` | Lượt chuyển đổi | `WEBSITE` | `OFFSITE_CONVERSIONS` (Lead pixel event) | `IMPRESSIONS` | Lead form trên web với pixel event `Lead` |
| `OUTCOME_LEADS` | Cuộc gọi | `PHONE_CALL` | `QUALITY_CALL` | `IMPRESSIONS` | — |
| `OUTCOME_APP_PROMOTION` | Lượt cài đặt ứng dụng | `APP` | `APP_INSTALLS` | `IMPRESSIONS` hoặc `APP_INSTALLS` | Cài app mới |
| `OUTCOME_APP_PROMOTION` | Sự kiện trong ứng dụng | `APP` | `OFFSITE_CONVERSIONS` (app event) | `IMPRESSIONS` | Tối ưu in-app action (purchase, level-up...) |
| `OUTCOME_SALES` | Lượt chuyển đổi | `WEBSITE` / `APP` | `OFFSITE_CONVERSIONS` | `IMPRESSIONS` | E-commerce checkout — cần pixel + purchase event |
| `OUTCOME_SALES` | Doanh số theo danh mục | `SHOP_AUTOMATIC` (catalog) | `OFFSITE_CONVERSIONS` (catalog) | `IMPRESSIONS` | DPA — dynamic product ads từ catalog |
| `OUTCOME_SALES` | Messenger / IG / WhatsApp | `MESSENGER` / `INSTAGRAM_DIRECT` / `WHATSAPP` | `CONVERSATIONS` | `IMPRESSIONS` | Sale qua chat (4Q Seafood style nhưng intent là mua) |
| `OUTCOME_SALES` | Cuộc gọi | `PHONE_CALL` | `QUALITY_CALL` | `IMPRESSIONS` | — |

---

## Logic AI suy luận `objective` từ insight (cho GoMeta Pro)

AI prompt phải có decision tree rõ ràng. Đây là bộ rule An có thể đưa vào system prompt của Claude Haiku:

### Bước 1: Parse intent verbs trong insight

| Pattern trong insight | Map sang objective |
|---|---|
| "biết đến", "ra mắt", "giới thiệu", "khám phá", "nhận diện thương hiệu", "phủ sóng", "viral" | `OUTCOME_AWARENESS` |
| "ghé thăm web", "vào website", "đọc bài chi tiết", "xem trang", "truy cập" | `OUTCOME_TRAFFIC` |
| "nhắn tin", "tư vấn", "chat", "hỏi đáp", "comment", "tương tác", "like page", "xem video", "trò chuyện" | `OUTCOME_ENGAGEMENT` |
| "đăng ký nhận tư vấn", "để lại số", "leave info", "form đăng ký", "lead", "thu thập thông tin" | `OUTCOME_LEADS` |
| "tải app", "cài đặt ứng dụng", "download app", "in-app purchase" | `OUTCOME_APP_PROMOTION` |
| "mua hàng", "đặt mua", "checkout", "thanh toán", "đặt phòng", "book", "đặt bàn", "order" | `OUTCOME_SALES` |

### Bước 2: Resolve destination từ Page connections + post format

AI phải xét thêm dữ kiện thực tế (pre-flight check trả về):
- Page có Messenger không? Có IG link không? Có WhatsApp Business link không? Có pixel + website không? Có app không?
- Post format hiện tại là gì? (image / video / carousel / text)

### Bước 3: Decision matrix (ưu tiên đơn giản cho MVP)

```
IF objective = ENGAGEMENT AND page.messenger_enabled = true 
   AND insight chứa "tư vấn|nhắn tin|chat"
THEN destination_type = MESSENGER
     optimization_goal = CONVERSATIONS

IF objective = SALES AND page.has_pixel = true 
   AND insight chứa "mua|checkout|đặt hàng"
THEN destination_type = WEBSITE
     optimization_goal = OFFSITE_CONVERSIONS
     custom_event_type = PURCHASE

IF objective = LEADS AND page.has_lead_form = true
THEN destination_type = ON_AD (Instant Form)
     optimization_goal = LEAD_GENERATION

(... bổ sung dần ...)
```

### Bước 4: Trường hợp ambiguous

Insight kiểu "muốn nhiều người biết đến quán, ai đi ngang qua thấy thì ghé ăn" → vừa AWARENESS vừa SALES.

→ **MVP rule:** Khi ambiguous, ưu tiên objective có ROI đo lường được rõ nhất, theo thứ tự: `SALES > LEADS > ENGAGEMENT > TRAFFIC > AWARENESS`. Lý do: GoMeta Pro phục vụ SME budget nhỏ, AWARENESS khó đo, nên fallback xuống objective có conversion trực tiếp.

### Bước 5: Confidence score & fallback

AI phải output kèm confidence (0-1). Threshold:
- `>= 0.8` → auto-apply, user chỉ review
- `0.5 - 0.8` → AI suggest + ghi rõ lý do, user xác nhận
- `< 0.5` → fallback `OUTCOME_ENGAGEMENT` + `MESSENGER` (mặc định an toàn cho F&B/local SME ở VN) + cờ "AI không chắc chắn, vui lòng review"

---

## JSON output từ AI ở bước này

AI Haiku call trả về schema sau (1 phần của payload tổng):

```json
{
  "campaign_init": {
    "buying_type": "AUCTION",
    "objective": "OUTCOME_ENGAGEMENT",
    "objective_confidence": 0.92,
    "objective_reasoning": "Insight đề cập 'tư vấn qua chat', 'inbox đặt bàn' → intent là conversation. Page 4Q Seafood có Messenger active. Match OUTCOME_ENGAGEMENT + destination MESSENGER.",
    "suggested_destination_type": "MESSENGER",
    "suggested_optimization_goal": "CONVERSATIONS",
    "alternative_options": [
      {
        "objective": "OUTCOME_SALES",
        "destination_type": "MESSENGER",
        "optimization_goal": "CONVERSATIONS",
        "when_to_use": "Nếu khách có thể mua thẳng qua chat, không chỉ tư vấn"
      }
    ]
  }
}
```

**Trường `alternative_options` quan trọng**: cho phép user 1-click switch sang objective khác mà không phải gen lại từ đầu. Trong UI, hiển thị dạng tab/dropdown bên cạnh objective chính.

---

## Mapping sang Meta API call

Bước 0 không phải là 1 API call riêng — nó là 2 field truyền vào `POST /act_{ad_account_id}/campaigns` (đã có trong file spec chính). Chỉ là về UX flow, dialog này hiện ra TRƯỚC, lock 2 field này lại, rồi mới mở các field còn lại.

**Trong GoMeta Pro**, vì AI điền tự động, ta có thể skip dialog này hoàn toàn — show 1 màn hình review tổng hợp với 2 field này ở đầu (dạng card "Mục tiêu AI đề xuất") + alternative_options để switch.

---

## Implications cho UX của GoMeta Pro

### 1. Không bắt user chọn objective bằng tay

Ưu thế cạnh tranh chính: user paste insight → AI tự gen objective + giải thích lý do. Meta Ads Manager bắt user tự chọn objective + đọc 6 mô tả + tự suy ra destination tương ứng — đây là khâu **mất 5-10 phút** với người mới và **dễ chọn sai** (đúng như BOD đã nhận xét: "set up sai mục tiêu chiến dịch so với định dạng bài viết").

### 2. Hiển thị reasoning trong UI

Thay vì chỉ show "Mục tiêu: Lượt tương tác", show:

```
🎯 AI đề xuất: Lượt tương tác (Engagement)
   ↳ Vì insight nhắc đến "tư vấn qua chat" → mục tiêu hợp lý là Conversations
   ↳ Đích đến: Messenger (Page 4Q Seafood đã kết nối)
   ↳ Tối ưu cho: Lượt cuộc trò chuyện được bắt đầu
   
   [Đổi sang Doanh số ▾]
```

Cái này tạo trust với user, đồng thời giáo dục họ về objective logic — về lâu dài user sẽ chọn nhanh hơn.

### 3. Validation cross-step

Khi user chọn objective khác với AI suggest, hệ thống PHẢI re-run logic ở các bước sau:
- Đổi từ ENGAGEMENT → SALES → destination có thể đổi → optimization_goal đổi → CTA đổi → AI có thể cần re-gen interests (target khác).

→ An nên thiết kế state management với 1 reducer chung cho toàn bộ form, mỗi khi `objective` thay đổi thì cascade re-validate các field phụ thuộc.

### 4. Cảnh báo objective không phù hợp post format

Pre-flight P4 ở file chính cần dùng bảng mapping objective × post format. Nếu user (hoặc AI) chọn `OUTCOME_SALES` nhưng post là text-only không có sản phẩm → show cảnh báo:

```
⚠️ Mục tiêu Doanh số thường cần post có hình sản phẩm + link mua. 
   Post hiện tại là text-only — có thể hiệu quả kém. 
   Đề xuất đổi sang Lượt tương tác.
```

---

## Tổng kết bước 0

| Aspect | Giá trị |
|---|---|
| Số field thực sự | 2 (`buying_type` + `objective`) |
| Field GoMeta Pro hardcode | `buying_type = AUCTION` |
| Field AI suy luận | `objective` (kéo theo destination + optimization_goal ở Bước 2) |
| API call | Không riêng — merge vào `POST /campaigns` |
| Vị trí trong flow file chính | Chèn TRƯỚC "Bước 1: Tạo Campaign", có thể đặt là **"Bước 1A: Modal khởi tạo"** và đổi Bước 1 hiện tại thành **"Bước 1B: Cấu hình chi tiết Campaign"** |

---

**Sau khi user chọn xong objective + buying_type ở dialog này → bấm "Tiếp tục" → load màn hình config Campaign chi tiết (Bước 1 trong spec chính).**

Tham khảo file spec chính: `GoMeta_Pro_Ads_Creation_Spec.md`

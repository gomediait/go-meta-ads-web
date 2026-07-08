# GoMeta Pro — Spec phân tích quy trình tạo Ads trên Meta Ads Manager

**Nguồn dữ liệu:** 3 ảnh chụp màn hình Meta Ads Manager (Campaign / Ad Set / Ad)
**Mục đích:** Tài liệu BA chi tiết để dev (An) build form input và mapping sang Meta Marketing API v23
**Phạm vi:** Campaign "Lượt tương tác" → Ad Set "Tin nhắn" → Ad từ Existing Post (post → Messenger)
**Ngày phân tích:** 25/06/2026

---

## TỔNG QUAN LUỒNG

```
Campaign (objective=OUTCOME_ENGAGEMENT)
   └── Ad Set (destination_type=MESSENGER, optimization_goal=CONVERSATIONS)
          └── Ad (creative.object_story_id = existing post)
```

Trạng thái mục tiêu: tạo trong status `PAUSED` để user review trước khi publish.

---

# BƯỚC 1: TẠO CAMPAIGN (Chiến dịch)

## Mục tiêu
Xác định mục tiêu marketing tổng thể (objective) và chiến lược ngân sách ở cấp chiến dịch. Đây là cấp cao nhất, quyết định toàn bộ logic phân phối của các Ad Set bên dưới.

## Các trường dữ liệu

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 1.1 | `name` | Tên chiến dịch | ✅ Required | Text (max 400 chars) | `[4Q Seafood] chuyển đổi mess` | Tên chiến dịch, hiển thị nội bộ. Có nút "Tạo mẫu" để lưu naming convention |
| 1.2 | `is_live_video` | Quảng cáo video trực tiếp | Optional | Boolean (toggle) | `false` (Tắt) | Bật khi quảng cáo video livestream |
| 1.3 | `buying_type` | Cách mua | ✅ Required | Dropdown | `Đấu giá` (`AUCTION`) | `AUCTION` (mặc định) hoặc `RESERVED` (Reach & Frequency) |
| 1.4 | `objective` | Mục tiêu chiến dịch | ✅ Required | Dropdown | `Lượt tương tác` (`OUTCOME_ENGAGEMENT`) | 6 ODAX objectives: `OUTCOME_AWARENESS`, `OUTCOME_TRAFFIC`, `OUTCOME_ENGAGEMENT`, `OUTCOME_LEADS`, `OUTCOME_APP_PROMOTION`, `OUTCOME_SALES` |
| 1.5 | — | "Hiển thị thêm lựa chọn" | — | Toggle UI | Đóng | Mở rộng thêm field nâng cao (xem ghi chú dưới) |
| 1.6 | `budget_level` | Chiến lược ngân sách | ✅ Required | Radio (2 options) | `Ngân sách nhóm quảng cáo` (ad_set level) | Option 1: Ngân sách chiến dịch (CBO/Advantage Campaign Budget) → set `daily_budget`/`lifetime_budget` tại campaign. Option 2: Ngân sách nhóm quảng cáo (ABO) → set budget tại từng adset |
| 1.7 | `budget_rebalance_flag` | Chia sẻ một phần ngân sách với các nhóm quảng cáo khác | Optional | Checkbox | `false` | Chỉ enable khi chọn ABO. Cho phép Meta share tối đa 20% budget giữa các adset trong cùng campaign |
| 1.8 | — | Trạng thái hợp lệ | Auto-generated | Display only | `Chiến dịch này đáp ứng mọi yêu cầu hợp lệ` | Validation status từ Meta |
| 1.9 | — | Thử nghiệm A/B | Optional | Toggle | `false` (Đang tắt) | Khi bật sẽ tạo split test giữa 2 phiên bản. **MVP: bỏ qua** |
| 1.10 | `special_ad_categories` | Hạng mục quảng cáo đặc biệt | ✅ Required (có thể empty array) | Multi-select dropdown | Không khai báo (`[]`) | Khai báo nếu thuộc các nhóm: `CREDIT`, `EMPLOYMENT`, `HOUSING`, `ISSUES_ELECTIONS_POLITICS`, `ONLINE_GAMBLING_AND_GAMING`, `FINANCIAL_PRODUCTS_SERVICES`. F&B/du lịch → empty |
| 1.11 | `special_ad_category_country` | (Hạng mục quảng cáo đặc biệt - quốc gia) | Conditional | Multi-select country | Không hiển thị | Bắt buộc nếu `special_ad_categories` ≠ empty |

### Field nâng cao (ẩn sau "Hiển thị thêm lựa chọn" — không thấy trong ảnh)
Theo Meta API docs, các field thường ẩn:
- `bid_strategy` — chỉ áp dụng khi dùng CBO
- `spend_cap` — Giới hạn chi tiêu chiến dịch
- `campaign_optimization_type` — `NONE` | `ICO_ONLY`
- `start_time` / `stop_time` — thường để adset quản lý

## Output sinh ra
```
Campaign object với campaign_id
Status: PAUSED
```

---

# BƯỚC 2: TẠO AD SET (Nhóm quảng cáo)

## Mục tiêu
Cấu hình **ai sẽ xem quảng cáo** (targeting), **ở đâu** (placement), **khi nào** (lịch chạy), **bao nhiêu tiền** (budget), **tối ưu cho hành động gì** (optimization_goal). Đây là cấp quan trọng nhất với GoMeta Pro vì AI phân tích insight sẽ tự điền tại đây.

## Các trường dữ liệu

### 2.1. Định danh & Tên

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 2.1.1 | `name` | Tên nhóm quảng cáo | ✅ Required | Text | `[4Q Seafood] Nhóm khách du lịch nội địa` | Tên adset nội bộ |

### 2.2. Lượt chuyển đổi (Conversion Location)

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 2.2.1 | `destination_type` | Vị trí chuyển đổi | ✅ Required | Dropdown | `Đích đến của tin nhắn` (`MESSENGER` family) | Các option phụ thuộc objective. Với ENGAGEMENT: `MESSENGER`, `INSTAGRAM_DIRECT`, `WHATSAPP`, `ON_AD`, `ON_VIDEO`, `ON_EVENT`, `ON_POST` |
| 2.2.2 | `promoted_object.page_id` | Trang Facebook | ✅ Required | Dropdown (page picker) | `4Q Seafood` | Page ID để chạy ads. **PRE-FLIGHT: phải match ad account** |
| 2.2.3 | `messaging_destination_type` | Đích đến của tin nhắn | ✅ Required | Radio (2 options) | `Đích đến thủ công` (manual) | Option 1: `AUTOMATIC` (Meta tự chọn destination tốt nhất). Option 2: `MANUAL` (user chọn checkbox) |
| 2.2.4 | `messenger_enabled` | Messenger | Conditional checkbox | Boolean | `true` | Hiển thị khi manual. Page đã link → tick được |
| 2.2.5 | `instagram_direct_enabled` | Instagram (Direct) | Conditional checkbox | Boolean | `false` (chưa link) | Cần IG account được kết nối với Page |
| 2.2.6 | `whatsapp_enabled` | WhatsApp | Conditional checkbox | Boolean | `false` (chưa link WABA) | Cần WhatsApp Business Account link với Page |

### 2.3. Mục tiêu hiệu quả & Giá thầu

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 2.3.1 | `optimization_goal` | Mục tiêu hiệu quả | ✅ Required | Dropdown | Không hiển thị rõ — suy ra `CONVERSATIONS` | Với destination = Messenger thường là `CONVERSATIONS` (cuộc trò chuyện được kích hoạt). Khác: `LINK_CLICKS`, `REACH`, `IMPRESSIONS`, `THRUPLAY`, `OFFSITE_CONVERSIONS`, `LEAD_GENERATION` |
| 2.3.2 | `bid_amount` | Giới hạn giá thầu | Optional | Number (VND) | Trống (Meta tự tối ưu) | "Không bắt buộc" — Meta dùng `LOWEST_COST_WITHOUT_CAP` mặc định. Nếu nhập → chuyển sang `LOWEST_COST_WITH_BID_CAP` |
| 2.3.3 | — | Áp dụng bộ quy tắc giá trị | Optional | Info banner | "Bạn có thể áp dụng Business Đà Nẵng..." | Value rules (advanced) — **MVP: bỏ qua** |
| 2.3.4 | `bid_strategy` (qua rules) | Bộ quy tắc (value rules) | Optional | Dropdown | `Không có` | Để default. **MVP: không dùng** |

### 2.4. Ngân sách và Lịch chạy

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 2.4.1 | `budget_type` | (Loại ngân sách) | ✅ Required | Dropdown | `Ngân sách hàng ngày` | 2 options: `Ngân sách hàng ngày` (`daily_budget`) hoặc `Ngân sách trọn đời` (`lifetime_budget`) |
| 2.4.2 | `daily_budget` / `lifetime_budget` | (Số tiền) | ✅ Required | Number (VND, đơn vị nhỏ nhất = đồng) | `101.000` VND | API truyền dạng integer minor units (VND không có decimal → giữ nguyên). Meta tự cảnh báo min budget. Daily min ~ 40,000 VND ở VN |
| 2.4.3 | — | (Estimate display) | Auto-generated | Display | `mức chi tiêu hàng ngày tối đa là 176.750đ; mức chi tiêu hàng tuần tối đa là 707.000đ` | Meta tính ceiling 1.75× daily |
| 2.4.4 | `start_time` | Ngày bắt đầu | ✅ Required | DateTime (timezone) | `25 Tháng 6, 2026 - 11:00 GMT+7` | ISO 8601 với timezone offset |
| 2.4.5 | `end_time` | Ngày kết thúc | Conditional | DateTime | Không bật ("Đặt ngày kết thúc" unchecked) | Bắt buộc nếu chọn `lifetime_budget`. Optional với `daily_budget` |
| 2.4.6 | — | Lên lịch tăng ngân sách | Optional | Checkbox + nested config | `false` | Budget scheduling — **MVP: bỏ qua** |
| 2.4.7 | `adset_schedule` | Lên lịch cho quảng cáo (dayparting) | Optional | Checkbox + schedule config | `true` (đã tick) | Khi tick → enable dayparting |
| 2.4.8 | `adset_schedule.timezone_type` | Múi giờ cho schedule | Conditional | Dropdown | `Sử dụng múi giờ của tài khoản quảng cáo này (Giờ TP Hồ Chí Minh)` | `USER` (theo user thấy) hoặc `ADVERTISER` (theo timezone ad account) |
| 2.4.9 | `adset_schedule.days` + `start_minute`/`end_minute` | Khung giờ chạy | Conditional | Multi-select (days × hours) | `Thứ Hai - thứ Bảy, 8 SA - 9 CH` | API truyền array of objects: `[{days:[1,2,3,4,5,6], start_minute:480, end_minute:1260}]`. **CHỈ áp dụng với lifetime_budget** trong nhiều objective — cần kiểm tra constraint |

### 2.5. Đối tượng (Targeting) — **PHẦN AI ĐIỀN TỰ ĐỘNG**

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 2.5.1 | `targeting.custom_audiences` | Đối tượng tùy chỉnh | Optional | Multi-select (search) | Trống | Custom Audience IDs — saved/pixel/customer list |
| 2.5.2 | `targeting.excluded_custom_audiences` | Thêm điều kiện loại trừ | Optional | Multi-select | Trống | Loại trừ audience |
| 2.5.3 | — | (Khuyến nghị Advantage+ Audience) | Info | Banner | Đã có gợi ý "giảm 9.7% chi phí" | **BOD quyết định KHÔNG bật cho budget nhỏ** |
| 2.5.4 | `targeting.geo_locations` | Vị trí | ✅ Required | Object (countries / regions / cities / custom_locations / zips) | `Việt Nam`: 2 custom_locations: (1) `16.06, 108.24` Tra Son, Quang Nam-Da Nang +1km; (2) `16.05, 108.24` Quận Ngũ Hành Sơn +1km. Mặc định radius hiển thị +1.5km cho 4Q Seafood | Hỗ trợ 4 mode: `countries`, `regions`, `cities`, `custom_locations` (lat/lng + radius_km). Có thể mix |
| 2.5.5 | `targeting.location_types` | (Người ở/đi/du lịch tại) | Optional | Multi-select | Mặc định | `["home", "recent"]` (default — ở + gần đây). Khác: `["travel_in"]` (du lịch tới) — phù hợp cho insight "khách du lịch" |
| 2.5.6 | `targeting.age_min` | Độ tuổi (min) | ✅ Required | Number | `22` | Min 18 (Meta policy), max 65 |
| 2.5.7 | `targeting.age_max` | Độ tuổi (max) | ✅ Required | Number | `45` | Max 65 (65+ → 65) |
| 2.5.8 | `targeting.genders` | Giới tính | Optional | Multi-select / Dropdown | `Tất cả giới tính` (`[1,2]` hoặc `[]`) | `[1]` = nam, `[2]` = nữ, `[]` hoặc `[1,2]` = all |
| 2.5.9 | `targeting.flexible_spec` | Nhắm mục tiêu chi tiết Advantage+ | Optional | Array of {interests, behaviors, work_employers...} | `Bao gồm những người khớp: Sở thích bổ sung > Agoda` | **Đây là field AI điền vào**. Cấu trúc: array of inclusion blocks (OR), trong mỗi block các spec là AND. Mỗi spec là array (OR). |
| 2.5.10 | `targeting.exclusions` | (Loại trừ) | Optional | Object cùng schema flexible_spec | Trống | Loại trừ user theo interest/behavior |
| 2.5.11 | `targeting.targeting_relaxation_types.lookalike` | Advantage+ Audience expansion (interests) | Optional | Integer (0/1) | Hiển thị banner gợi ý nhưng chưa bật | **BOD: TẮT** (`0`) cho budget nhỏ |
| 2.5.12 | `targeting.targeting_relaxation_types.custom_audience` | (Expansion với custom audience) | Optional | Integer (0/1) | Không hiển thị | Tương tự |
| 2.5.13 | `targeting.locales` | (Ngôn ngữ) | Optional | Array of locale IDs | Không hiển thị (mặc định = all) | Ví dụ: `[1066]` = Vietnamese |
| 2.5.14 | `targeting.publisher_platforms` | (Nền tảng) | Optional | Multi-select | Không hiển thị (Advantage+ Placements mặc định) | `["facebook", "instagram", "messenger", "audience_network"]`. Khi tắt Advantage Placement mới hiển thị |
| 2.5.15 | `targeting.facebook_positions` | (Vị trí FB) | Optional | Multi-select | Default | `["feed", "right_hand_column", "marketplace", "video_feeds", "story", "search", "instream_video", "facebook_reels"]` |
| 2.5.16 | `targeting.instagram_positions` | (Vị trí IG) | Optional | Multi-select | Default | `["stream", "story", "explore", "reels", "shop", "profile_feed"]` |
| 2.5.17 | `targeting.device_platforms` | (Thiết bị) | Optional | Multi-select | Default `["mobile", "desktop"]` | Mặc định all |

### 2.6. Tóm tắt — các field bị che / không xác định từ ảnh
- `optimization_goal` — không thấy dropdown trực tiếp, suy ra từ context `CONVERSATIONS`
- `billing_event` — không hiển thị, mặc định `IMPRESSIONS` cho hầu hết objective
- `attribution_spec` — không hiển thị
- `pacing_type` — không hiển thị, default `["standard"]`

## Output sinh ra
```
Ad Set object với adset_id
Status: PAUSED
```

---

# BƯỚC 3: TẠO AD (Quảng cáo từ Existing Post)

## Mục tiêu
Liên kết existing Facebook post làm creative, cấu hình CTA, tracking, và conversation flow cho Messenger ads.

## Các trường dữ liệu

### 3.1. Định danh

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 3.1.1 | `name` | Tên quảng cáo | ✅ Required | Text | `[4Q] nội địa - bài viết` | Tên ad nội bộ |
| 3.1.2 | `is_collaborative_ads` | Quảng cáo hợp tác | Optional | Toggle | `false` (Tắt) | Collab ads giữa Page và creator/brand khác. **MVP: bỏ qua** |

### 3.2. Danh tính (Identity)

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 3.2.1 | `creative.object_story_spec.page_id` | Trang Facebook | ✅ Required | Dropdown | `4Q Seafood` | Phải = page_id ở Ad Set + match ad account. **Banner cảnh báo:** "Cần có quyền truy cập để tạo quảng cáo cho Trang này" — đây là lỗi An gặp phải trong demo |
| 3.2.2 | `creative.object_story_spec.instagram_actor_id` | Quảng cáo trên Instagram / Thêm vị trí trên Instagram | Optional | Button → IG account picker | Chưa thêm | Khi link IG → có thể quảng cáo song song trên IG feed |

### 3.3. Thiết lập quảng cáo

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 3.3.1 | `creative_source` | (Nguồn creative) | ✅ Required | Dropdown | `Sử dụng bài viết có sẵn` (`existing_post`) | Options: `Sử dụng bài viết có sẵn` (existing post), `Tạo quảng cáo` (manual upload), `Sử dụng quảng cáo động` (dynamic catalog) |
| 3.3.2 | `is_branded_content` / multi-advertiser | Quảng cáo đa bên | Optional | Checkbox | `false` | **MVP: bỏ qua** |

### 3.4. Nội dung quảng cáo (Creative — Existing Post)

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 3.4.1 | `creative.object_story_id` | (Post chính) | ✅ Required | Object (`{page_id}_{post_id}`) | `1221129076112541189` — "MÙA HÈ NÓNG BỎNG…" — 22/5/2026 | Format: `{page_id}_{post_id}`. Có dropdown "Thay đổi bài viết" / "Tạo bài viết" |
| 3.4.2 | — | Bài viết gợi ý khác | Display only | List | 3 post gợi ý (Hải sản, Tươi ngon, Đà Nẵng lễ) | UI helper — không phải API field |
| 3.4.3 | — | Nhập ID Bài viết | Optional input | Text | Trống | UI shortcut để paste post ID trực tiếp |
| 3.4.4 | — | Văn bản chính | Auto-generated | Display | Text post hiển thị preview | Read-only của post body |
| 3.4.5 | — | Thêm lựa chọn văn bản | Optional | Button | — | Text variations cho Advantage+ Creative. **MVP: bỏ qua** |
| 3.4.6 | `creative.object_story_spec.link_data.call_to_action.type` hoặc `creative.degrees_of_freedom_spec` | Nút kêu gọi hành động | ✅ Required | Dropdown | `Gửi tin nhắn` (`MESSAGE_PAGE`) | Với Messenger ads → `MESSAGE_PAGE`. Khác: `LEARN_MORE`, `SHOP_NOW`, `SIGN_UP`, `BOOK_TRAVEL`, `CONTACT_US`, `ORDER_NOW`, `GET_QUOTE`, `SEND_MESSAGE` |
| 3.4.7 | `creative.degrees_of_freedom_spec` | Điểm cải thiện nội dung Advantage+ (1/1) | Optional | Object | `Đang bật: Điều chỉnh định dạng nhiều hình ảnh` | Advantage+ creative enhancements |
| 3.4.8 | (creative enhancements) | Điểm cải thiện cần thiết (2/3) | Optional | Object | `Tắt: Hiển thị tóm tắt`. `Bật: Bình luận phù hợp, Cải thiện CTA` | Sub-settings của Advantage+ creative |

### 3.5. Thử nghiệm nội dung

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 3.5.1 | — | Thử nghiệm nội dung | Optional | Button | Chưa setup | **MVP: bỏ qua** |

### 3.6. Cuộc trò chuyện (Messenger Conversation Flow)

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 3.6.1 | (Messenger template via `ictwa_action.welcome_message`) | Lời chào | Conditional ✅ | Text (max ~640 chars) | `Chào user_first_name, bạn đã thử Sasimi cực chất tại 4Q Sea Food chưa?` | Token `user_first_name` được Meta thay tên user. Bắt buộc khi destination = Messenger |
| 3.6.2 | `ictwa_action.questions` / quick_replies | Câu hỏi và câu trả lời | Conditional | Array of strings (max 5) | 5 câu Q gợi ý | Quick reply buttons xuất hiện trong Messenger |
| 3.6.3 | — | Thêm câu trả lời / Chỉnh sửa / Tạo mẫu | Optional | Button | — | UI helpers |

### 3.7. Theo dõi (Tracking)

| # | Field (API) | Label hiển thị | Bắt buộc | Kiểu dữ liệu | Giá trị trong ảnh | Mô tả |
|---|---|---|---|---|---|---|
| 3.7.1 | `tracking_specs[].web_event` | Sự kiện trên trang web | Optional | Checkbox + Pixel picker | `false` | Track pixel event |
| 3.7.2 | `tracking_specs[].app_event` | Sự kiện trong ứng dụng | Optional | Checkbox | `false` | App event tracking |
| 3.7.3 | `tracking_specs[].offline_event` | Sự kiện offline | Optional | Checkbox | `false` | Offline conversion tracking |
| 3.7.4 | `creative.url_tags` | Thông số URL | Optional | Text (URL params) | `key1=value1&key2=value2` (placeholder) | UTM params append vào link |
| 3.7.5 | — | Công cụ báo cáo bên thứ ba | Optional | Button (Kết nối) | Chưa kết nối | 3rd-party measurement (Adjust, AppsFlyer...). **MVP: bỏ qua** |

## Output sinh ra
```
1. Ad Creative object (creative_id)
2. Ad object (ad_id) liên kết với creative_id, adset_id
Status: PAUSED
```

---

# TỔNG HỢP INPUT CẦN THIẾT CHO GoMeta Pro AUTO-CREATE

## Phân nhóm Input

### A. User cung cấp trực tiếp (form input)
1. **Insight văn bản** (PDF/text) → AI xử lý
2. **Page ID** chọn từ danh sách Pages có quyền
3. **Post ID** chọn từ Page (existing post)
4. **Ngân sách hàng ngày** (VND)
5. **Tên Campaign / Ad Set / Ad** (có thể auto-gen từ template)
6. **Khung giờ chạy** (dayparting — optional, default 8-21 thứ 2-7)

### B. AI suy luận từ insight
1. **Objective** — từ intent trong insight (`OUTCOME_ENGAGEMENT` cho insight "tin nhắn/tư vấn", `OUTCOME_SALES` cho "mua hàng/đặt phòng", v.v.)
2. **Destination type** — suy từ objective + Page connections
3. **Geo locations** — countries/regions/cities/custom_locations
4. **Location_types** — `home/recent` vs `travel_in` (insight có "du lịch" → `travel_in`)
5. **Age min/max**
6. **Genders**
7. **Interests** (keywords → cần map sang ID qua Targeting Search API)
8. **Behaviors** (keywords → map qua API)
9. **Optimization goal** — phụ thuộc objective + destination
10. **CTA type** — phụ thuộc destination

### C. Validation cứng từ pre-flight (KHÔNG AI)
1. Page có nằm trong ad account không
2. Post có `is_eligible_for_promotion = true` không
3. Objective + post format có khớp không (video → ok cho Awareness/Engagement; image → ok cho hầu hết; carousel → mạnh cho Sales)
4. Page có link Messenger/IG/WhatsApp không (để bật destination tương ứng)

### D. Hardcoded defaults
- `buying_type` = `AUCTION`
- `status` = `PAUSED`
- `budget_level` = `ABO` (ngân sách nhóm quảng cáo)
- `special_ad_categories` = `[]` (F&B/du lịch)
- `targeting_relaxation_types.lookalike` = `0` (BOD: tắt Advantage+ Audience)
- `bid_amount` = không set → `LOWEST_COST_WITHOUT_CAP`
- `billing_event` = `IMPRESSIONS`
- `publisher_platforms` = mặc định Advantage+ Placements (bật)

---

# JSON REQUEST MAPPING SANG META MARKETING API v23

## 1. Create Campaign

**Endpoint:** `POST /act_{ad_account_id}/campaigns`

```json
{
  "name": "[4Q Seafood] chuyển đổi mess",
  "objective": "OUTCOME_ENGAGEMENT",
  "status": "PAUSED",
  "buying_type": "AUCTION",
  "special_ad_categories": [],
  "is_skadnetwork_attribution": false,
  "access_token": "{PAGE_OR_USER_TOKEN}"
}
```

**Response:** `{ "id": "120210000123456789" }` → lưu làm `campaign_id`

**Lưu ý:**
- ABO (ngân sách tại adset) → KHÔNG truyền `daily_budget`/`lifetime_budget` ở campaign
- CBO → truyền `daily_budget` hoặc `lifetime_budget` + `bid_strategy` (`LOWEST_COST_WITHOUT_CAP` | `LOWEST_COST_WITH_BID_CAP` | `COST_CAP`)

---

## 2. Create Ad Set

**Endpoint:** `POST /act_{ad_account_id}/adsets`

```json
{
  "name": "[4Q Seafood] Nhóm khách du lịch nội địa",
  "campaign_id": "120210000123456789",
  "status": "PAUSED",

  "destination_type": "MESSENGER",
  "optimization_goal": "CONVERSATIONS",
  "billing_event": "IMPRESSIONS",

  "daily_budget": 101000,
  "start_time": "2026-06-25T11:00:00+0700",

  "promoted_object": {
    "page_id": "{PAGE_ID}"
  },

  "targeting": {
    "geo_locations": {
      "countries": ["VN"],
      "custom_locations": [
        {
          "name": "Tra Son, Quang Nam-Da Nang",
          "latitude": 16.06,
          "longitude": 108.24,
          "radius": 1,
          "distance_unit": "kilometer"
        },
        {
          "name": "Quận Ngũ Hành Sơn",
          "latitude": 16.05,
          "longitude": 108.24,
          "radius": 1,
          "distance_unit": "kilometer"
        }
      ],
      "location_types": ["home", "recent"]
    },
    "age_min": 22,
    "age_max": 45,
    "genders": [1, 2],
    "flexible_spec": [
      {
        "interests": [
          { "id": "6003348604581", "name": "Agoda" }
        ]
      }
    ],
    "targeting_relaxation_types": {
      "lookalike": 0,
      "custom_audience": 0
    },
    "publisher_platforms": ["facebook", "instagram", "messenger"],
    "facebook_positions": ["feed", "story", "video_feeds"],
    "instagram_positions": ["stream", "story", "reels"],
    "device_platforms": ["mobile", "desktop"]
  },

  "adset_schedule": [
    { "days": [1,2,3,4,5,6], "start_minute": 480, "end_minute": 1260, "timezone_type": "USER" }
  ],

  "access_token": "{PAGE_OR_USER_TOKEN}"
}
```

**Response:** `{ "id": "120210000234567890" }` → lưu làm `adset_id`

**Constraint quan trọng:**
- `adset_schedule` chỉ chạy được với một số `optimization_goal` nhất định. Nếu API reject, fallback: bỏ schedule và cảnh báo user
- `start_minute`/`end_minute` tính bằng phút từ 00:00 (8h = 480, 21h = 1260)

---

## 3. Create Ad Creative (Existing Post)

**Endpoint:** `POST /act_{ad_account_id}/adcreatives`

```json
{
  "name": "[4Q] nội địa - bài viết - creative",
  "object_story_id": "{PAGE_ID}_1221129076112541189",
  "degrees_of_freedom_spec": {
    "creative_features_spec": {
      "image_brightness_and_contrast": { "enroll_status": "OPT_IN" },
      "image_uncrop": { "enroll_status": "OPT_IN" },
      "text_optimizations": { "enroll_status": "OPT_IN" },
      "standard_enhancements": { "enroll_status": "OPT_IN" }
    }
  },
  "url_tags": "utm_source=facebook&utm_medium=cpc&utm_campaign={campaign_name}",
  "access_token": "{PAGE_OR_USER_TOKEN}"
}
```

**Response:** `{ "id": "120210000345678901" }` → lưu làm `creative_id`

**Lưu ý quan trọng cho Messenger ads:**
- Với existing post → CTA và conversation flow được Meta tự xử lý qua `ictwa_action_spec` (Click-to-Messenger). Để config welcome message + quick replies cho Messenger ads, cần dùng endpoint `/page_welcome_messages` hoặc set qua `ad_creative` với `object_story_spec.link_data.message_extensions` (tùy version API).
- Trong UI hiện tại, các template welcome message hiển thị ở Ad level. Cách dev nên làm:
  1. Tạo welcome message template qua `POST /{page_id}/welcome_messages` trước
  2. Reference template ID khi tạo ad creative

---

## 4. Create Ad

**Endpoint:** `POST /act_{ad_account_id}/ads`

```json
{
  "name": "[4Q] nội địa - bài viết",
  "adset_id": "120210000234567890",
  "creative": { "creative_id": "120210000345678901" },
  "status": "PAUSED",
  "tracking_specs": [],
  "access_token": "{PAGE_OR_USER_TOKEN}"
}
```

**Response:** `{ "id": "120210000456789012" }` → `ad_id`

---

# PRE-FLIGHT VALIDATION CHECKLIST (BẮT BUỘC TRƯỚC KHI GỌI API)

Đây là phần tôi đã đề cập ở turn trước — không phải AI, viết logic if-else thuần. Để An build module `preflight-check.js`:

| # | Check | API call | Logic |
|---|---|---|---|
| P1 | Page có thuộc ad account không | `GET /act_{ad_account_id}/promote_pages` | Kiểm tra `page_id` có trong list. Nếu không → block + báo user |
| P2 | Post có promotable không | `GET /{page_id}_{post_id}?fields=is_eligible_for_promotion,promotion_eligibility_status` | `is_eligible_for_promotion = true` → OK |
| P3 | Page có Messenger Connect không (khi destination = Messenger) | `GET /{page_id}?fields=connected_instagram_account,messenger_platform_access` | Check trước khi enable destination |
| P4 | Objective khớp với post format | Hard-coded mapping table | Xem bảng dưới |
| P5 | Budget min | `GET /act_{ad_account_id}?fields=min_daily_budget_low_freq,min_daily_budget_high_freq` | So sánh user input với min của Meta cho từng currency |
| P6 | Ad account còn payment method hoạt động | `GET /act_{ad_account_id}?fields=funding_source_details,account_status` | `account_status = 1` (ACTIVE) |

### Mapping bảng Objective × Post Format

| Post Format | OUTCOME_AWARENESS | OUTCOME_TRAFFIC | OUTCOME_ENGAGEMENT | OUTCOME_LEADS | OUTCOME_SALES |
|---|---|---|---|---|---|
| Single Image | ✅ | ✅ | ✅ | ⚠️ (cần lead form) | ⚠️ (creative yếu) |
| Single Video | ✅ | ✅ | ✅ (Reels +CONVERSATIONS) | ⚠️ | ⚠️ |
| Carousel | ✅ | ✅ | ⚠️ | ✅ | ✅ (mạnh nhất) |
| Link with Image | ✅ | ✅ (mạnh nhất) | ✅ | ✅ | ✅ |
| Status (text-only) | ✅ | ❌ | ✅ | ❌ | ❌ |

---

# CÁC LƯU Ý CRITICAL CHO DEV (AN)

## 1. Lỗi `is_skadnetwork_attribution` & iOS 14+
Với objective `OUTCOME_SALES`/`OUTCOME_APP_PROMOTION` chạy đến iOS, cần config SKAdNetwork. Ở MVP với ENGAGEMENT → Messenger thì không cần.

## 2. Đơn vị tiền tệ VND
Meta dùng "currency minor units". Với VND không có decimal → 101.000 VND truyền API là `101000`. So với USD 5.00 → `500` (cents).

## 3. Permissions cần có
- `ads_management` — tạo/sửa ads
- `ads_read` — đọc audience size, delivery estimate
- `pages_manage_ads` — tạo ads cho Page cụ thể
- `pages_read_engagement` — đọc post của Page
- `business_management` — nếu user có Business Manager

## 4. Rate limit
Meta áp rate limit theo `BUC` (Business Use Case). Bulk tạo ads (>10 ads/phút) sẽ bị throttle. Khi tạo 1 Campaign + 1 Adset + 1 Ad (3 API calls) → an toàn.

## 5. `flexible_spec` semantics
```
flexible_spec[i].interests = [A, B]    → User có interest A OR B
flexible_spec[i].behaviors = [C]       → AND có behavior C
flexible_spec[j] (block khác)          → OR với block i
```
AI prompt phải hiểu logic này để nhóm interest/behavior đúng.

## 6. Delivery Estimate API (đề xuất ở turn trước)
```
POST /act_{ad_account_id}/delivery_estimate
{
  "optimization_goal": "CONVERSATIONS",
  "promoted_object": { "page_id": "..." },
  "targeting_spec": { ... toàn bộ targeting object ... }
}
```
→ trả về `users_lower_bound`, `users_upper_bound`, `estimate_ready` — hiển thị audience size cho user TRƯỚC khi submit.

---

# CHECKLIST FORM FIELDS CẦN BUILD CHO MVP

## Form chính (sau khi AI điền tự động)

```
[Campaign]
☐ Tên chiến dịch ........................ [TEXT, auto-gen từ template]
☐ Mục tiêu ............................... [DROPDOWN, AI suggest]

[Ad Set]
☐ Tên nhóm quảng cáo ..................... [TEXT, auto-gen]
☐ Destination ............................ [DROPDOWN, AI suggest theo objective]
☐ Page ................................... [DROPDOWN, lọc theo ad account]
☐ Ngân sách hàng ngày .................... [NUMBER + VND]
☐ Ngày bắt đầu ........................... [DATETIME PICKER]
☐ Dayparting .............................. [CHECKBOX + WEEK SCHEDULER, mặc định 8-21 T2-T7]

[Targeting — AI điền, user review]
☐ Vị trí ................................. [MAP PICKER + RADIUS]
☐ Location type .......................... [home/recent | travel_in]
☐ Độ tuổi ................................ [RANGE SLIDER 18-65]
☐ Giới tính .............................. [RADIO: All/Nam/Nữ]
☐ Interests .............................. [MULTI-SELECT với audience size + Meta Search API]
☐ Behaviors .............................. [MULTI-SELECT với audience size]
☐ Audience size estimate ................. [DISPLAY (delivery_estimate API)]

[Ad]
☐ Tên quảng cáo .......................... [TEXT]
☐ Post .................................... [DROPDOWN posts của Page, lọc is_eligible_for_promotion]
☐ CTA .................................... [DROPDOWN, AI suggest theo destination]
☐ Lời chào Messenger ...................... [TEXTAREA, AI gen draft]
☐ Quick replies ........................... [REPEATABLE TEXT INPUT, max 5]
☐ URL tags (UTM) .......................... [TEXT, auto-gen từ campaign name]
```

---

# PHỤ LỤC: BẢNG ENUM API VALUES

## `objective`
`OUTCOME_AWARENESS` | `OUTCOME_TRAFFIC` | `OUTCOME_ENGAGEMENT` | `OUTCOME_LEADS` | `OUTCOME_APP_PROMOTION` | `OUTCOME_SALES`

## `destination_type` (theo objective)
- ENGAGEMENT: `MESSENGER`, `INSTAGRAM_DIRECT`, `WHATSAPP`, `ON_AD`, `ON_VIDEO`, `ON_EVENT`, `ON_POST`
- TRAFFIC: `WEBSITE`, `APP`, `MESSENGER`, `WHATSAPP`, `INSTAGRAM_DIRECT`, `FACEBOOK_PAGE`
- SALES: `WEBSITE`, `APP`, `MESSENGER`, `WHATSAPP`, `SHOP_AUTOMATIC`
- LEADS: `ON_AD`, `WEBSITE`, `MESSENGER`, `INSTAGRAM_DIRECT`, `PHONE_CALL`, `APP`

## `optimization_goal` (phổ biến)
`CONVERSATIONS`, `LINK_CLICKS`, `REACH`, `IMPRESSIONS`, `THRUPLAY`, `OFFSITE_CONVERSIONS`, `LEAD_GENERATION`, `POST_ENGAGEMENT`, `PAGE_LIKES`, `VIDEO_VIEWS`, `LANDING_PAGE_VIEWS`

## `billing_event`
`IMPRESSIONS` (default), `LINK_CLICKS`, `THRUPLAY`, `PAGE_LIKES`

## `bid_strategy`
`LOWEST_COST_WITHOUT_CAP`, `LOWEST_COST_WITH_BID_CAP`, `COST_CAP`, `LOWEST_COST_WITH_MIN_ROAS`

## CTA Type (phổ biến)
`MESSAGE_PAGE`, `LEARN_MORE`, `SHOP_NOW`, `SIGN_UP`, `BOOK_TRAVEL`, `CONTACT_US`, `ORDER_NOW`, `GET_QUOTE`, `SEND_MESSAGE`, `WHATSAPP_MESSAGE`, `SUBSCRIBE`, `DOWNLOAD`, `INSTALL_MOBILE_APP`

---

**Hết spec.** File này đủ chi tiết để An build form input và 4 API integration. Khi triển khai cần verify lại endpoint version trên `https://developers.facebook.com/docs/marketing-api` (hiện tại v23, sắp lên v24 cuối 2026).

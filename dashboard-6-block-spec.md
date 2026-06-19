# Spec — Nâng cấp Report thành Dashboard 6 block

> Tài liệu này để paste vào Claude Code làm input cho `/spec` hoặc `/plan`.
> Đọc `CLAUDE.md` + chạy `codegraph_explore` trước khi code.

---

## 1. Mục tiêu

Nâng cấp trang `pages/dashboard/report.jsx` (hiện chỉ 5 thẻ KPI cơ bản) thành **dashboard 6 block** đầy đủ, biến tool từ *"đọc số"* thành *"hiểu chuyện gì đang xảy ra và phải làm gì"*.

Trang đích vẫn là **Report** nhưng đổi vai trò thành **trang chính (overview)** sau khi đăng nhập.

---

## 2. Bối cảnh kỹ thuật

| Hạng mục | Vị trí |
|---|---|
| API endpoint hiện tại | `pages/api/fb/report.js` |
| UI hiện tại | `pages/dashboard/report.jsx` |
| Meta API helper | `lib/metaApi.js` (dùng `callMeta`, `callMetaAll`) |
| Plan limits | `lib/planLimits.js` |
| i18n context | `lib/LangContext.js` (phải thêm vi + en) |
| API Meta version | v21.0 (đang dùng) — không upgrade trong scope này |

**Quy tắc theo `CLAUDE.md`:**
- Không expose `SUPABASE_SERVICE_ROLE_KEY` ra client
- Meta API calls **bắt buộc** đi qua `lib/metaApi.js`
- Thêm UI mới → thêm cả translation `vi` lẫn `en`

---

## 3. ⚠️ Quy tắc thuật ngữ Meta Ads (NON-NEGOTIABLE)

Đây là quy tắc cứng — vi phạm bất kỳ điều nào dưới đây là **lỗi nghiêm trọng**:

### 3.1. Audience terminology
- ✅ Dùng: `"Accounts Center accounts"`
- ❌ Cấm: `"people"`, `"users"`, `"viewers"`, `"unique users"`

Định nghĩa Reach **phải** ghi đúng: *"The number of Accounts Center accounts that saw your ads at least once."*

### 3.2. Clicks
- ✅ Dùng: `"Link clicks"` HOẶC `"Clicks (all)"`
- ❌ Cấm dùng chữ `"Clicks"` đơn lẻ khi hiển thị số liệu

### 3.3. Tên metric chuẩn (sentence case, không prefix)
- ✅ `"Link clicks"`, `"Cost per result"`, `"3-second video plays"`
- ❌ `"Total Impressions"`, `"Overall ROAS"`, `"Video Views"`

### 3.4. Cross-objective aggregation
- Khi tổng hợp campaign có objective khác nhau → `"Cost per result"` và `"Results"` hiển thị `"N/A"`. **Không** tự cộng dồn.

### 3.5. Null data
- API trả `null` → hiển thị `"Không có dữ liệu"` / `"N/A"`. **Không bao giờ** fabricate số.

### 3.6. Partial date
- Nếu khoảng query bao gồm hôm nay → hiển thị nhãn `"Dữ liệu chưa đầy đủ"`.

### 3.7. Currency
- Meta API đã trả về số tiền theo đơn vị thật (VD: VND đã là 12500, không phải 1250000). **Không** nhân/chia 100. *(Đây là bug đã biết ở `budget-update.js:34` — đừng lặp lại pattern này.)*

---

## 4. Spec chi tiết 6 block

### 🔵 Block 1 — KPI tổng quan mở rộng

**Layout:** Grid 2x3 trên mobile, 1x6 trên desktop.

**Mỗi thẻ:** label nhỏ (uppercase, 11px) → số chính (24-28px, weight 500) → so sánh kỳ trước (10-11px, có mũi tên ↑↓).

| Thẻ | Field API (`/insights`) | Format | Ghi chú |
|---|---|---|---|
| Amount spent | `spend` | `12.4M ₫` (rút gọn) | Mũi tên ↑ xanh = chi tăng (không phải tốt/xấu, chỉ là delta) |
| Reach | `reach` | `48.2K` | Tooltip: *"Số Accounts Center accounts đã thấy ads ít nhất 1 lần"* |
| Frequency | `impressions / reach` (tính client) | `3.4` | 🟡 vàng khi > 3, 🔴 đỏ khi > 5 |
| Link clicks | `inline_link_clicks` | `2,847` | **Không** dùng `clicks` |
| CPM | `cpm` | `76K ₫` + dòng phụ `/ 1,000 impr.` | |
| CPC (link) | `cost_per_inline_link_click` | `4.3K ₫` | Dòng phụ `/ link click` |
| Cost per result | `cost_per_result` | hoặc `N/A` | Ẩn nếu mixed objectives |
| Purchase ROAS | `purchase_roas` | `3.2x` | Ẩn khi không có purchase event |

**Comparison kỳ trước:**
- Query 2 lần `/insights`: kỳ chính + kỳ trước cùng độ dài
- Hiển thị `((new - old) / old) * 100` với 1 chữ số thập phân
- Màu: xanh (`--color-text-success`) khi tăng tốt, đỏ khi giảm — *trừ Amount spent là neutral*

---

### 🔵 Block 2 — Xu hướng theo thời gian

**Layout:** Line chart dual-axis, chiều cao ~200px desktop / 100px mobile.

**Data fetch:**
```
GET /{account_id}/insights
  ?fields=spend,actions,purchase_roas
  &time_range={...}
  &time_increment=1
```

**Trục:**
- Trái: `Amount spent` (line màu xanh dương `#378ADD`, solid)
- Phải: `Cost per result` *hoặc* `Purchase ROAS` (line màu xanh teal `#1D9E75`, dashed) — toggle bằng segment control

**Tương tác:**
- Hover point → tooltip 3 dòng (ngày, spend, ROAS/CPA)
- Click point → `sendPrompt` mở dialog drill-down ngày đó (sau, không bắt buộc P1)

**Range selector:** dùng lại các nút có sẵn (Hôm nay/Hôm qua/7 ngày/30 ngày/Tháng này). Riêng **Hôm nay/Hôm qua** không vẽ chart, hiển thị message *"Chọn khoảng ≥ 7 ngày để xem xu hướng"*.

---

### 🔵 Block 3 — Funnel chuyển đổi

**Layout:** 4 thanh ngang thu nhỏ dần (Impressions → Reach → Link clicks → Conversions).

**Data:**
- `impressions`, `reach`, `inline_link_clicks` từ `/insights`
- Conversions từ `actions[type=purchase|lead|complete_registration]` tùy objective

**Hiển thị:**
- Mỗi thanh: tên metric + số tuyệt đối (right-aligned)
- Giữa 2 thanh: dòng nhỏ ghi tỷ lệ chuyển + so kỳ trước
  - VD: `↓ 5.9% CTR (link click-through rate)` + delta vs kỳ trước
- Color code dòng giữa: xanh nếu cải thiện, đỏ nếu xấu đi >20%

**Edge case:**
- Không có conversion event → block 3 chỉ hiển thị 3 thanh đầu + dòng tip *"Kết nối Pixel để thấy bước Conversions"*

---

### 🔵 Block 4 — Bảng campaign + Ad Relevance Diagnostics

**Layout:**
- Desktop: bảng table với cột sortable
- Mobile: card list (mỗi campaign 1 card)

**Data fetch:**
```
GET /{account_id}/campaigns
  ?fields=name,status,effective_status,objective,
          insights{spend,impressions,reach,frequency,
                   inline_link_clicks,cost_per_result,
                   purchase_roas,quality_ranking,
                   engagement_rate_ranking,
                   conversion_rate_ranking}
```

**Mỗi row/card cần:**

| Cột | Logic |
|---|---|
| Tên campaign | `name` |
| Status | `effective_status` → map sang badge: `ACTIVE` xanh, `PAUSED` xám, `IN_PROCESS` (learning) vàng, `LEARNING_LIMITED` cam |
| Spend | `spend` |
| Results | từ `actions[]`, tùy `objective` |
| Cost per result | nếu campaign này — show; nếu summary cross-obj — N/A |
| ROAS | `purchase_roas` hoặc `—` |
| Quality ranking | `quality_ranking` — **chỉ hiển thị khi impressions ≥ 500** |
| Engagement ranking | `engagement_rate_ranking` — same condition |
| Conversion ranking | `conversion_rate_ranking` — same condition |
| Flags | tính client: 🔴 Freq > 5, ⚪ Insufficient data, 🟠 Learning limited |

**Mapping ranking sang badge:**
- `ABOVE_AVERAGE` → `"Trên trung bình"` — màu xanh lá nhạt
- `AVERAGE` → `"Trung bình"` — xám
- `BELOW_AVERAGE_35`, `_20`, `_10` → `"Bottom 35% / 20% / 10%"` — đỏ
- `null` hoặc < 500 impressions → `"Chưa đủ data"` — xám viền

**Hypothesis framing (QUAN TRỌNG):**
Khi campaign có ranking thấp HOẶC Freq cao → hiển thị **gợi ý dạng giả thuyết**, KHÔNG dạng lệnh tắt:

> ❌ Sai: *"Hãy tắt campaign này"*
> ✅ Đúng: *"💡 Giả thuyết: thử refresh creative — Quality ranking ở Bottom 35% có thể do bài cũ"*

Lý do: tránh user tắt nhầm campaign đang ở vùng cao của marginal cost. Xem Block 5 + tài liệu `breakdown_effect.md`.

---

### 🔵 Block 5 — Breakdown phân khúc

**Layout:** Tab/segment chọn breakdown (Placement / Device / Age / Gender / Country) → hiển thị bar chart ngang với CPA mỗi segment.

**Data fetch:**
```
GET /{account_id}/insights
  ?breakdowns=publisher_platform,platform_position    // hoặc impression_device, age, gender, country
  &fields=spend,impressions,actions,cost_per_result
```

**Hiển thị:**
- Sort theo CPA tăng dần (rẻ trên, đắt dưới)
- Bar dài theo CPA tương đối (segment đắt nhất = 100%)

**Callout box BẮT BUỘC (cuối block):**

> ⓘ Average CPA cao chưa chắc là phân khúc xấu. Meta system tối ưu theo *marginal cost* (chi phí kết quả tiếp theo), không phải *average cost*. Phân khúc có CPA cao có thể đang giữ chi phí biên thấp cho toàn campaign. **Không nên tự tắt** chỉ dựa vào CPA trung bình.

**Không** có nút "Pause segment" hoặc "Exclude" trong block này. Mọi action liên quan đến segment phải đi qua trang Quy tắc tự động (`/automated-rules`).

---

### 🔵 Block 6 — Health & Alerts 🚨

**Layout:** Card có badge đỏ tổng số alert ở header. Trong card là list alert items.

**Mỗi alert item:**
- Icon Tabler tương ứng + accent border-left 3px màu theo severity
- Background: lighter tone của semantic color (danger / warning / info)
- Title (12px, weight 500) + sub (10-11px)
- Click → drill-down tới adset/campaign cụ thể

**6 loại alert:**

| Loại | Logic detect | Severity | Source data |
|---|---|---|---|
| **Restriction risk** | Đếm số ads bị `effective_status=DISAPPROVED` trong 7 ngày + check page có flag `restrictions{}` | 🔴 Danger | `/me/ads?fields=effective_status,issues_info` + `/{page_id}?fields=restrictions` |
| **Learning stuck** | Adset có `learning_stage_info.status=LEARNING_LIMITED` HOẶC `LEARNING` đã > 7 ngày | 🟠 Warning | `/{account_id}/adsets?fields=learning_stage_info` |
| **Ad fatigue** | Freq > 3.5 AND `inline_link_click_ctr` tuần này < 70% tuần trước | 🟠 Warning | 2 query `/insights` với 2 time range |
| **Auction overlap** | Detect adset cùng audience targeting + cùng page → có khả năng overlap | 🟡 Info | Phân tích targeting object — algorithm sau |
| **Pacing skew** | `spend / budget` lệch > 20% so với `time_elapsed / total_time` | 🔵 Info | Compare daily_budget vs spend hôm nay |
| **CPM anomaly** | CPM hôm nay > baseline 7 ngày × 1.5 | 🟠 Warning | `/insights` time_increment=1 |

**Plan gating:**
- Trial: ẩn block 6 hoàn toàn
- Personal: 3 alert đầu (Restriction, Learning, Fatigue)
- Business: thêm Auction overlap + Pacing
- Agency: full + multi-account aggregation

---

## 5. UI System

### 5.1. Tham chiếu chung
- Giữ design language hiện tại của `report.jsx` (dark sidebar xanh navy, light content area)
- Card: white bg, border 0.5px, radius 12px, padding 16px
- KPI card: secondary bg, radius 8px, padding 10-12px
- Spacing dọc giữa các block: 12-16px
- Mobile: stack dọc full-width; Desktop ≥1024px: grid 12-col

### 5.2. Color semantics
| Trường hợp | Token |
|---|---|
| Healthy / improvement | `--color-text-success` (xanh lá) |
| Warning (Freq cao, Learning limited) | `--color-text-warning` (vàng cam) |
| Danger (Restriction, Bottom 10%) | `--color-text-danger` (đỏ) |
| Info (Pacing, neutral comparison) | `--color-text-info` (xanh dương) |

### 5.3. Mockup tham khảo
Mockup chi tiết đã có trong chat (artifact `go_meta_ads_dashboard_mockup_6_blocks`). Layout mobile-first, desktop chỉ thay đổi grid template.

---

## 6. Data layer — Endpoint mới

### Endpoint chính
```
GET /api/fb/dashboard?range=7d&account_id=<id>
```

**Response shape:**
```json
{
  "range": { "since": "2026-06-12", "until": "2026-06-18", "isPartial": false },
  "compareRange": { "since": "2026-06-05", "until": "2026-06-11" },
  "currency": "VND",
  "block1_kpi": {
    "spend": { "value": 12400000, "previous": 10500000, "deltaPct": 18.1 },
    "reach": { "value": 48200, "previous": 43000, "deltaPct": 12.1 },
    "frequency": { "value": 3.4, "level": "warning" },
    "linkClicks": { "value": 2847, "previous": 2997, "deltaPct": -5.0 },
    "cpm": { "value": 76000 },
    "cpcLink": { "value": 4350 },
    "costPerResult": { "value": null, "isMixedObjectives": true },
    "purchaseRoas": { "value": 3.2, "previous": 2.9 }
  },
  "block2_trend": { "daily": [ { "date": "2026-06-12", "spend": 1700000, "roas": 2.8 }, ... ] },
  "block3_funnel": { "steps": [ ... ], "dropoffs": [ ... ] },
  "block4_campaigns": [ ... ],
  "block5_breakdown": { "byPlacement": [ ... ] },
  "block6_alerts": { "count": 4, "items": [ ... ] }
}
```

### Strategy fetch
- Gọi `/{account_id}/insights` **1 lần** với `fields` đầy đủ cho cả kỳ chính + so sánh kỳ trước (2 request song song qua `Promise.all`)
- Campaign data: 1 request `/{account_id}/campaigns` với nested insights
- Breakdown: 1 request riêng vì có `breakdowns` param
- Alerts: chạy logic detect sau khi đã có data, không cần API call thêm (trừ Restriction risk cần `/issues_info`)

**Tổng số Meta API call/page load:** mục tiêu ≤ 5.

### Cache
- Result cache theo `{user_id, account_id, range}` trong 60 giây (Redis hoặc memory) — tránh user reload spam API.

---

## 7. Phasing (3 sprint)

### 🟢 Phase 1 (Sprint 1 — 1 tuần)
**Mục tiêu:** Demo được dashboard mới cho sếp Hiền, hoàn thành trước App Review submission.

- Block 1 (KPI mở rộng) — toàn bộ
- Block 2 (Trend chart) — basic, không cần drill-down
- Block 4 (Campaign table) — có status + diagnostics, chưa cần hypothesis framing đầy đủ
- Setup `GET /api/fb/dashboard` skeleton

**Acceptance:**
- Tất cả KPI hiển thị đúng theo terminology rules section 3
- Frequency có warning khi > 3
- Diagnostics chỉ hiện khi impressions ≥ 500
- Mobile + desktop responsive

### 🟡 Phase 2 (Sprint 2 — 1 tuần)
- Block 3 (Funnel) — với drop-off rate
- Block 6 (Health & Alerts) — 3 alert đầu (Restriction / Learning / Fatigue)
- Plan gating theo `lib/planLimits.js`
- i18n vi + en full

### 🔵 Phase 3 (Sprint 3 — 1 tuần)
- Block 5 (Breakdown) + Breakdown Effect callout
- Block 6 — 3 alert còn lại (Overlap / Pacing / Anomaly)
- Drill-down từ Block 2 (click spike)
- Cache layer

---

## 8. Acceptance Criteria tổng

- [ ] Không có chỗ nào dùng từ `"users"` / `"people"` / `"viewers"`
- [ ] Không có chỗ nào dùng `"Clicks"` đơn lẻ khi hiển thị số (phải là `"Link clicks"` hoặc `"Clicks (all)"`)
- [ ] Cross-objective aggregation hiển thị `"N/A"`, không cộng dồn
- [ ] Không có nút *"Tắt"* / *"Exclude"* nào trong Block 5
- [ ] Mọi gợi ý ở Block 4 dùng từ *"Giả thuyết"*, *"Thử"*, không phải lệnh
- [ ] Có callout Breakdown Effect ở cuối Block 5
- [ ] Currency display dùng đúng `currency` field từ ad account, không nhân 100
- [ ] Partial date có nhãn cảnh báo
- [ ] Tất cả string mới có vi + en trong `LangContext.js`
- [ ] Plan gating đúng theo `lib/planLimits.js`
- [ ] Meta API calls ≤ 5 per page load
- [ ] Cron route (nếu thêm cho alerts) verify `Authorization: Bearer` header
- [ ] Service Role Key không leak ra client

---

## 9. Reference docs (đã có trong project)

- `core_concepts.md` — Ad auction, Pacing, Learning phase, Diagnostics
- `breakdown_effect.md` — Marginal vs average cost (BẮT BUỘC đọc trước khi làm Block 5)
- `learning_phase.md` — Detect logic cho Block 6
- `ad_relevance_diagnostics.md` — Logic mapping Quality/Engagement/Conversion ranking
- `pacing.md` — Logic cho Pacing alert
- `auction_overlap.md` — Logic cho Auction overlap alert
- `performance_fluctuations.md` — Logic cho CPM anomaly (baseline window)

---

## 10. Out of scope (KHÔNG làm trong spec này)

- Multi-account aggregation view (để Agency tier dùng)
- Export PDF dashboard
- Schedule report tự động gửi email *(đã có ở Notifications)*
- A/B test setup tool
- Pixel integration troubleshooter

---

## 11. Câu hỏi cần xác nhận trước khi code

1. Block 6 có cần thêm bảng DB mới để store alert state (`dashboard_alerts`)? Hay tính realtime mỗi lần fetch?
2. Drill-down từ Block 2 (click spike) → mở modal hay redirect sang trang campaigns?
3. Mobile có cần hiển thị đủ 6 block không, hay hide một số block nặng (Breakdown)?
4. Range selector — có cần custom date picker (chọn 2 ngày) không, hay chỉ giữ các preset hiện tại?

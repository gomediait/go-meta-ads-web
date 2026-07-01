# Skill: Context Engineering

> Kích hoạt khi: bắt đầu session mới, output AI kém chất lượng, chuyển task lớn.

## Nguyên tắc

**Cung cấp đúng thông tin, đúng lúc. Quá nhiều cũng tệ như quá ít.**

## Context Hierarchy cho dự án này

```
1. CLAUDE.md              → Luôn load, project-wide rules
2. .claude/skills/        → Load theo domain khi relevant
3. Source files liên quan → Load trước khi edit
4. Error output / logs    → Load khi debug
5. Conversation history   → Tích lũy, compact khi dài
```

## Trước mỗi task — Pre-task Context Loading

```
Trước khi edit file X:
  1. Đọc file X (hiểu code hiện tại)
  2. Đọc các file X import hoặc phụ thuộc
  3. Tìm 1 ví dụ pattern tương tự trong codebase
  4. Đọc type definitions / interface liên quan

Trước khi thêm API route mới:
  1. Đọc 1-2 route hiện có cùng domain (e.g., fb/)
  2. Đọc lib/auth.js để biết auth pattern
  3. Đọc lib/supabase.js để biết query pattern
```

## Khi AI output kém chất lượng

Dấu hiệu:
- AI dùng pattern không có trong project
- AI hallucinate API không tồn tại
- AI bỏ qua conventions đã establish

Cách fix:
```
1. Load lại CLAUDE.md + skill liên quan
2. Show AI một ví dụ code hiện có: "Đây là cách project này làm [X]"
3. State rõ: "Dùng pattern như trong lib/auth.js, không tự tạo pattern mới"
4. Nếu task lớn → break ra thành task nhỏ hơn
```

## Khi session context quá dài

- Compact bằng cách tóm tắt những gì đã làm
- Start fresh session cho task mới hoàn toàn không liên quan
- Dùng codegraph_explore để orient lại thay vì đọc lại nhiều files

## Cách cung cấp error context hiệu quả

```
# ✅ Cụ thể — AI có thể act on ngay
"API trả về lỗi này:
{
  error: 'OAuthException',
  error_subcode: 458,
  message: 'User must login again'
}
File: pages/api/fb/campaigns.js line 34"

# ❌ Quá chung chung
"Meta API bị lỗi"
```

## Các file nên đọc trước khi làm từng loại task

| Task type | Files nên đọc trước |
|---|---|
| Thêm API route mới | Route tương tự, `lib/auth.js`, `lib/supabase.js` |
| Sửa Facebook integration | `lib/metaApi.js`, route đang sửa |
| Thêm UI component | Component tương tự trong `components/`, styles |
| Fix bug auth | `lib/auth.js`, `middleware.js`, route liên quan |
| Thêm payment feature | `pages/api/payment/`, `lib/` |
| Sửa cron job | `pages/api/cron/`, `vercel.json` |

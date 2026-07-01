# AI Skills Directory

Thư mục này chứa toàn bộ các Skills, Rules, Instructions dùng chung cho tất cả các AI coding agents trong dự án.

## Cấu trúc thư mục
- `skills/`: Chứa các quy chuẩn code, quy trình làm việc, design patterns, và các instructions chung.
  - Các file bắt đầu bằng `cmd-` là các custom commands được chuyển từ Claude.
  - Các file còn lại là các skills nguyên bản.

## Cách sử dụng

### 1. Cho Claude Code
Claude Code hỗ trợ custom tools/skills từ thư mục `.claude`. Tuy nhiên, bạn có thể thiết lập Claude để tham chiếu nội dung trong `AI/skills/` hoặc chỉ thị trong system prompt:
"Please read and follow all markdown rules defined in AI/skills/ before starting tasks."

### 2. Cho Antigravity
Antigravity tự động phát hiện customizations nếu thư mục nằm trong danh sách định nghĩa. Bạn có thể sử dụng tính năng Global Rules hoặc Project-Scoped Rules bằng cách tạo file `AGENTS.md` và trỏ vào các file trong này, hoặc đơn giản ra lệnh cho Antigravity:
"Đọc toàn bộ file trong AI/skills/ để làm ngữ cảnh trước khi code."

### 3. Cho Cursor / Codex
Cursor hỗ trợ tính năng `@` (mentions). Khi mở Cursor:
- Thêm toàn bộ các file trong `AI/skills/` vào Cursor Rules.
- Hoặc dùng `@AI/skills/...` trong prompt để nhúng nội dung của skill vào context.

## Khuyến nghị
Luôn load toàn bộ `AI/skills` trước khi thực hiện bất kỳ task nào lớn để đảm bảo AI hoạt động nhất quán, tuân thủ đúng coding standards và best practices của dự án.

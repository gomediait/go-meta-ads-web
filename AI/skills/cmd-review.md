# /review — Code Review Checklist

Thực hiện review toàn diện trên code vừa được thay đổi.

## Bước 1: Hiểu context

- Task này giải quyết vấn đề gì?
- Files nào bị thay đổi?
- Có breaking change nào không?

## Bước 2: Five-Axis Review

### ✅ Correctness
- [ ] Logic đúng với yêu cầu?
- [ ] Edge cases được handle (null, empty, 0, undefined)?
- [ ] Error paths có return sớm không?
- [ ] Không có off-by-one, race condition?

### ✅ Readability
- [ ] Tên biến/function tự giải thích?
- [ ] Không có `temp`, `data`, `result`, `x`, `y` vô context?
- [ ] Có thể làm ngắn hơn mà không mất rõ ràng?
- [ ] Dead code (unused vars, imports, commented-out blocks)?

### ✅ Architecture
- [ ] Follow pattern đã có trong project?
- [ ] API route dùng đúng structure chuẩn?
- [ ] Supabase query scope đúng user_id?
- [ ] Không có logic nghiệp vụ ở component UI?

### ✅ Security
- [ ] Input được validate tại API boundary?
- [ ] Auth check có mặt?
- [ ] Không có sensitive data trong response?
- [ ] Webhook có verify signature?
- [ ] Không hardcode secret?

### ✅ Performance
- [ ] Không có N+1 query (loop gọi DB)?
- [ ] List endpoint có limit/pagination?
- [ ] Meta API không bị gọi trong loop?

## Bước 3: Output

Với mỗi issue tìm được:
```
[SEVERITY: critical|major|minor] [AXIS: correctness|readability|arch|security|perf]
File: path/to/file.js:L42
Issue: [mô tả]
Suggestion: [gợi ý sửa]
```

**Severity:**
- `critical` — phải sửa trước khi merge (bug, security hole)
- `major` — nên sửa (bad pattern, performance issue)
- `minor` — tùy chọn (style, naming)

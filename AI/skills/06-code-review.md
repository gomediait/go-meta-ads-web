# Skill: Code Review & Quality

> Kích hoạt khi: review code trước khi merge, sau khi implement feature, sau khi fix bug.

## Tiêu chuẩn approve

Approve khi change **cải thiện** codebase overall, dù không perfect. Đừng block chỉ vì "không phải cách tôi viết". Nếu nó hoạt động đúng và follow conventions → approve.

## 5 Axes Review

### 1. Correctness — Có đúng không?
```
□ Có match spec/task không?
□ Edge cases được handle (null, empty, boundary)?
□ Error paths được handle (không chỉ happy path)?
□ Có race condition hay state inconsistency không?
```

### 2. Readability — Có dễ đọc không?
```
□ Tên biến/function rõ nghĩa? (không có temp, data, result vô context)
□ Control flow straightforward? (không nested ternary, không deep callback)
□ Code có thể làm ít dòng hơn không?
□ Abstraction có xứng độ phức tạp không? (đừng generalize trước use case thứ 3)
□ Dead code: unused variables, removed comments, backward-compat shims?
```

### 3. Architecture — Có fit pattern không?
```
□ Follow existing patterns hay introduce pattern mới (nếu mới, có justified không)?
□ Có duplicate code nên share không?
□ Module boundaries rõ ràng?
□ Dependencies flow đúng chiều không?
```

### 4. Security — Có lỗ hổng không?
```
□ User input được validate tại API boundary?
□ Secrets không hardcode, không log?
□ Auth/authorization check ở đúng chỗ?
□ Webhook được verify signature?
□ Không expose sensitive fields trong response?
```

### 5. Performance — Có vấn đề perf không?
```
□ Có N+1 query pattern không? (loop gọi DB)
□ Có unbounded loop hoặc data fetch không?
□ Có operation sync mà nên async không?
□ Missing pagination ở list endpoint?
```

## Change Size

```
~100 dòng changed  → Tốt. Review được trong 1 lần.
~300 dòng changed  → Chấp nhận nếu 1 logical change duy nhất.
>500 dòng changed  → Quá lớn. Split ra.
```

**Tách refactoring khỏi feature work** — đó là 2 change riêng biệt.

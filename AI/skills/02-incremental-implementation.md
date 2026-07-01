# Skill: Incremental Implementation

> Kích hoạt khi: task chạm vào nhiều hơn 1 file, hoặc sắp viết >100 dòng liên tục.

## Nguyên tắc

Build từng **vertical slice** nhỏ — implement một phần, test, verify, rồi mới expand. Mỗi increment phải để hệ thống ở trạng thái **hoạt động được**.

## Chu trình

```
Implement → Test → Verify → [commit] → Slice tiếp theo
```

## Slicing cho dự án này

### Thêm tính năng mới (ví dụ: 1 dashboard page mới)

```
Slice 1: API route → test bằng curl/Postman
Slice 2: UI component cơ bản → kiểm tra render
Slice 3: Kết nối API vào UI → kiểm tra data flow
Slice 4: Edge cases + loading/error states
Slice 5: i18n (vi/en translations)
```

### Sửa API route hiện có

```
Slice 1: Hiểu contract hiện tại (input/output)
Slice 2: Thêm logic mới, giữ nguyên interface
Slice 3: Test happy path
Slice 4: Test error cases
```

## Simplicity Check (sau mỗi slice)

```
□ Có thể làm ít dòng hơn không?
□ Abstraction này có xứng với độ phức tạp không?
□ Tôi đang build cho yêu cầu thực tế hay tương lai giả định?
□ Senior engineer có nói "sao không làm đơn giản hơn?" không?
```

## KHÔNG làm

- ❌ Viết toàn bộ feature rồi mới test
- ❌ Implement layer này rồi "để sau" mới kết nối layer kia
- ❌ Push qua test/build đang fail để tiếp tục feature mới

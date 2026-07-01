# Skill: Surgical Changes

> Kích hoạt khi: sửa code đã tồn tại.

## Nguyên tắc

**Chỉ chạm vào những gì cần. Dọn rác do chính mình tạo ra.**

## Rules

Khi sửa code hiện có:
- ❌ Không "cải thiện" code, comment, format không liên quan đến task
- ❌ Không refactor những thứ không bị hỏng
- ✅ Match existing style, kể cả khi bạn không thích nó
- ✅ Xóa import, variable, helper do **chính mình** thêm vào nếu không dùng
- ❌ **Không xóa** rác code đã tồn tại từ trước — đó là việc của task riêng

## Phân biệt rõ

| Tình huống | Làm gì |
|---|---|
| Code cũ có bug liên quan đến task | ✅ Sửa luôn, mention trong commit |
| Code cũ có style xấu, không liên quan | ❌ Bỏ qua |
| Import thừa do tôi thêm | ✅ Xóa |
| Import thừa đã có từ trước | ❌ Để nguyên |
| Comment sai liên quan đến logic tôi sửa | ✅ Cập nhật |
| Comment sai không liên quan | ❌ Để nguyên |

## Trước khi commit, kiểm tra

```
□ Diff có chứa thay đổi nào không liên quan đến task không?
□ Tôi có thêm import nào mà không dùng không?
□ Tôi có xóa code nào không phải do tôi viết không?
```

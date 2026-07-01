# /spec — Viết spec trước khi code

Trước khi implement, hãy trả lời các câu hỏi sau theo thứ tự:

## 1. Problem Statement

**Vấn đề đang giải quyết là gì?**
- User đang muốn làm gì?
- Hiện tại họ bị cản trở ở đâu?

## 2. Scope

**Trong scope:**
- [ ] ...

**Ngoài scope (explicitly):**
- [ ] ...

## 3. Acceptance Criteria

Done khi:
- [ ] [điều kiện verify được #1]
- [ ] [điều kiện verify được #2]
- [ ] [điều kiện verify được #3]

## 4. Technical Approach

**Files sẽ thay đổi:**
- `pages/api/...` — [mô tả]
- `pages/dashboard/...` — [mô tả]
- `components/...` — [mô tả]

**Data flow:**
```
User action → API route → Supabase/Meta API → Response → UI update
```

**Risks / Unknowns:**
- [ ] ...

## 5. Implementation Order (Vertical Slices)

```
Slice 1: [mô tả] → verify: [check]
Slice 2: [mô tả] → verify: [check]
Slice 3: [mô tả] → verify: [check]
```

---
*Chờ xác nhận spec trước khi bắt đầu code.*

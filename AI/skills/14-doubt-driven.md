# Skill: Doubt-Driven Development

> Kích hoạt khi: stakes cao, logic phức tạp, security-sensitive, hoặc irreversible operation.

## Nguyên tắc

**Một câu trả lời tự tin ≠ câu trả lời đúng.**

Với mọi quyết định không trivial → materialize một reviewer "adversarial" để disprove trước khi proceed.

## Khi nào áp dụng

Áp dụng khi quyết định có ít nhất 1 trong các dấu hiệu:

- Có branching logic phức tạp
- Cross module/service boundary
- Correctness phụ thuộc context mà future reader không thấy
- Blast radius lớn hoặc irreversible (production deploy, schema change, payment logic)
- Working in code chưa hiểu rõ

**KHÔNG cần áp dụng:**
- Rename variable, format code
- Theo instruction rõ ràng của user
- One-line change với correctness hiển nhiên
- User muốn nhanh hơn verified

## Process — 5 bước

```
Step 1: CLAIM    → Viết quyết định và tại sao nó quan trọng
Step 2: EXTRACT  → Isolate artifact nhỏ nhất để review
Step 3: DOUBT    → Adversarial review prompt
Step 4: RECONCILE → Classify từng finding
Step 5: STOP     → Khi findings trivial hoặc sau 3 cycles
```

### Step 1: CLAIM

```
CLAIM: "Logic check plan limits trong autoset-run.js đúng với tất cả cases"
WHY: Nếu sai, user free plan có thể chạy autoset không giới hạn → revenue loss
```

### Step 2: EXTRACT

Chọn phần nhỏ nhất cần review — diff, function, hoặc decision trong 3-5 câu.

**Strip reasoning.** Chỉ đưa artifact + contract, không đưa conclusion. Nếu đưa conclusion → reviewer sẽ validate, không doubt.

### Step 3: DOUBT — Adversarial prompt

```
Adversarial review. Find what is WRONG with this code.
Assume tôi đã overconfident. Look for:
- Unstated assumptions
- Edge cases không được handle
- Hidden coupling hoặc shared state
- Ways contract có thể bị violated
- Existing conventions code này có thể break
- Failure modes với unexpected input

DO NOT validate. DO NOT summarize. Tìm issues, hoặc state rõ ràng không tìm được sau thorough examination.

ARTIFACT: [paste code]
CONTRACT: [paste what it should do]
```

### Step 4: RECONCILE

Với mỗi finding từ reviewer:
- `confirmed` — Issue thực, cần fix
- `disputed` — Sai/inapplicable, ghi rõ lý do
- `acknowledged` — Valid risk nhưng acceptable, ghi rõ lý do

### Step 5: STOP

Dừng khi:
- Tất cả findings là trivial
- Đã qua 3 cycles
- User nói proceed

## Ví dụ áp dụng cho dự án này

**Tình huống: Viết logic PayOS webhook verification**

```
CLAIM: "Code verify PayOS webhook signature đúng, không thể bị bypass"
WHY: Nếu bypass được, attacker fake payment thành công → plan được cấp miễn phí

EXTRACT:
function verifyWebhook(body, signature) {
  const hash = crypto
    .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
    .update(JSON.stringify(body))
    .digest('hex');
  return hash === signature;
}

CONTRACT: Hàm này phải return false với bất kỳ body/signature nào không đến từ PayOS

DOUBT PROMPT:
Find what is wrong with this webhook verification function.
Assume the author is overconfident about its security.
Look for: timing attacks, encoding issues, JSON serialization order issues,
missing edge cases, ways to bypass it.
```

## KHÔNG áp dụng khi

- Task đơn giản (rename, format, add comment)
- User đã explicit approve approach
- Đang trong subagent context (escalate lên main session)

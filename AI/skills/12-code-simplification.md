# Skill: Code Simplification

> Kích hoạt khi: code đang hoạt động đúng nhưng cảm thấy nặng nề hơn cần thiết.

## Nguyên tắc

**Mục tiêu không phải ít dòng hơn — mà là dễ đọc hơn.**

Chỉ simplify khi feature đã hoạt động và tests pass. Đừng simplify throwaway code.

## Trước khi simplify: Hiểu rõ trước (Chesterton's Fence)

```
□ Code này làm gì?
□ Ai gọi nó? Nó gọi gì?
□ Edge cases và error paths là gì?
□ Tại sao nó được viết thế này? (git blame, xem history)
□ Nếu mình xóa/sửa nó, điều gì sẽ break?
```

Nếu chưa trả lời được → đọc thêm context, không simplify vội.

## 5 Patterns cần simplify

### 1. Nested ternary → if/else rõ ràng

```javascript
// ❌ Khó đọc
const label = isNew ? 'Mới' : isUpdated ? 'Đã cập nhật' : isArchived ? 'Lưu trữ' : 'Hoạt động';

// ✅ Rõ ràng
function getCampaignLabel(campaign) {
  if (campaign.isNew) return 'Mới';
  if (campaign.isUpdated) return 'Đã cập nhật';
  if (campaign.isArchived) return 'Lưu trữ';
  return 'Hoạt động';
}
```

### 2. Hàm dài → Hàm nhỏ có tên rõ nghĩa

```javascript
// ❌ Hàm 80 dòng làm 5 việc
async function handler(req, res) {
  // validate...
  // auth check...
  // fetch meta...
  // update supabase...
  // send email...
}

// ✅ Mỗi việc 1 hàm
async function handler(req, res) {
  const user = await authenticateRequest(req, res);
  if (!user) return;

  const campaigns = await fetchMetaCampaigns(user.meta_token);
  await syncCampaignsToSupabase(user.id, campaigns);
  await notifyUserIfCpaExceeded(user, campaigns);

  return res.status(200).json({ synced: campaigns.length });
}
```

### 3. Magic numbers/strings → Constants có tên

```javascript
// ❌ Magic number
if (cpa > 150000) { ... }
if (plan === 'plan_starter_v2') { ... }

// ✅ Named constant
const CPA_ALERT_THRESHOLD = 150000; // 150,000 VND
const PLAN_STARTER = 'plan_starter_v2';

if (cpa > CPA_ALERT_THRESHOLD) { ... }
if (plan === PLAN_STARTER) { ... }
```

### 4. Chained operations khó đọc → Intermediate variables

```javascript
// ❌ Dense chain
const result = data.filter(x => x.active).map(x => ({ ...x, cpa: x.spend / x.orders })).sort((a, b) => b.cpa - a.cpa);

// ✅ Named steps
const activeCampaigns = data.filter(c => c.active);
const withCpa = activeCampaigns.map(c => ({ ...c, cpa: c.spend / c.orders }));
const sortedByCpa = withCpa.sort((a, b) => b.cpa - a.cpa);
```

### 5. Duplicate code → Extract function

```javascript
// ❌ Copy-paste trong nhiều API routes
const token = req.cookies?.token;
if (!token) return res.status(401).json({ error: 'Unauthorized' });
const user = jwt.verify(token, process.env.JWT_SECRET);

// ✅ Dùng lib/auth.js đã có
const user = verifyToken(req);
if (!user) return res.status(401).json({ error: 'Unauthorized' });
```

## Quy tắc khi simplify

- ✅ Behavior phải giống hệt trước khi simplify
- ✅ Chỉ simplify code liên quan đến task hiện tại
- ❌ Không inlining helper function có tên rõ nghĩa (mất đi cái tên!)
- ❌ Không combine 2 hàm khác nhau thành 1 hàm phức tạp
- ❌ Không optimize cho số dòng — optimize cho clarity

## Self-check sau khi simplify

```
□ Một người mới vào project có hiểu code này không?
□ Behavior giống hệt trước không?
□ Tôi có đang simplify scope nằm ngoài task không?
□ Có abstraction nào tôi xóa mà thực ra có lý do tồn tại không?
```

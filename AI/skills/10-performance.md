# Skill: Performance Optimization

> Kích hoạt khi: có vấn đề perf, page load chậm, API response chậm, hoặc suspect N+1.

## Nguyên tắc vàng

**Measure trước. Optimize sau. Đừng đoán mò.**

```
MEASURE → IDENTIFY → FIX → VERIFY → GUARD
```

## Common Performance Issues trong dự án này

### 1. N+1 Query (Supabase)

```javascript
// ❌ N+1: Loop gọi DB
const campaigns = await getCampaigns(userId);
for (const c of campaigns) {
  c.stats = await getStats(c.id); // 1 query mỗi campaign!
}

// ✅ Batch: 1 query lấy hết
const campaigns = await getCampaigns(userId);
const ids = campaigns.map(c => c.id);
const { data: stats } = await supabase
  .from('campaign_stats')
  .select('*')
  .in('campaign_id', ids); // 1 query duy nhất
```

### 2. Gọi Meta API trong Loop

```javascript
// ❌ Rate limit ngay lập tức
for (const campaign of campaigns) {
  const insights = await fetchMetaInsights(campaign.id); // Bị rate limit!
}

// ✅ Batch request hoặc cache
const insights = await fetchMetaBatchInsights(campaigns.map(c => c.id));
// Hoặc cache kết quả trong Supabase, refresh theo schedule (cron)
```

### 3. Missing Pagination

```javascript
// ❌ Fetch tất cả — chết khi có 10,000 rows
const { data } = await supabase.from('campaigns').select('*');

// ✅ Luôn có limit
const { data } = await supabase
  .from('campaigns')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(page * 20, (page + 1) * 20 - 1); // 20 items mỗi trang
```

### 4. Không cache Meta API response

```javascript
// ✅ Cache insights vào Supabase, không gọi Meta mỗi page load
// Cron job refresh mỗi 15 phút thay vì real-time fetch
```

### 5. Next.js: Render không cần thiết

```jsx
// ❌ Re-render toàn bộ list khi 1 item thay đổi
function CampaignList({ campaigns, selectedId }) {
  return campaigns.map(c => <CampaignCard campaign={c} selected={c.id === selectedId} />);
}

// ✅ Memo hóa nếu list lớn
const CampaignCard = React.memo(({ campaign, selected }) => { ... });
```

## Cách đo performance

### Backend (API routes)

```javascript
// Simple timing để identify bottleneck
export default async function handler(req, res) {
  const t0 = Date.now();

  const userData = await getUser(req);         // ~?ms
  console.log('getUser:', Date.now() - t0);

  const campaigns = await getCampaigns(userData.id); // ~?ms
  console.log('getCampaigns:', Date.now() - t0);

  // Xác định chỗ chậm, rồi optimize chỗ đó
}
```

### Frontend

- Chrome DevTools → Network tab → xem waterfall
- Xem response time của từng API call
- Xem có request nào bị block không

## Optimization Checklist

```
□ Có N+1 query nào trong code mới không?
□ List endpoint có limit/pagination không?
□ Meta API có bị gọi mỗi page load không? (nên cache)
□ Supabase query có chọn đúng fields không? (không select * nếu chỉ cần vài fields)
□ Có operation nặng nào trong main thread không nên chặn response không?
```

## KHÔNG optimize khi

- Chưa có bằng chứng đây là bottleneck
- Code mới chưa hoàn thiện logic
- Optimization làm code khó đọc hơn mà gain không đáng kể

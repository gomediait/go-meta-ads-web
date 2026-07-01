# Skill: API Design — Next.js API Routes

> Kích hoạt khi: tạo hoặc sửa bất kỳ file trong `pages/api/`.

## Structure chuẩn của 1 API Route

```javascript
// pages/api/[domain]/[action].js
import { verifyToken } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // 1. Method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Auth (bỏ nếu route public)
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // 3. Input validation
  const { field } = req.body;
  if (!field) return res.status(400).json({ error: 'Missing: field' });

  // 4. Business logic + error handling
  try {
    const { data, error } = await supabase.from('table').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Response Format

```javascript
// Thành công
res.status(200).json({ data: {...}, message: 'optional' })
res.status(201).json({ data: {...} }) // Created

// Lỗi
res.status(400).json({ error: 'Mô tả lỗi rõ ràng cho client' })
res.status(401).json({ error: 'Unauthorized' })
res.status(403).json({ error: 'Forbidden' })
res.status(404).json({ error: 'Not found' })
res.status(500).json({ error: error.message })
```

## Đặt tên route

```
pages/api/fb/campaigns.js        → GET/POST campaigns
pages/api/fb/campaign-toggle.js  → POST toggle on/off
pages/api/fb/budget-update.js    → POST update budget
pages/api/payment/payos-create.js
pages/api/admin/web-users.js
```

- Dùng kebab-case
- Tên = noun (resource) hoặc verb-noun (action)
- Group theo domain: `fb/`, `payment/`, `admin/`, `user/`, `cron/`

## Supabase Query Conventions

```javascript
// SELECT với filter
const { data, error } = await supabase
  .from('campaigns')
  .select('id, name, status')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// INSERT
const { data, error } = await supabase
  .from('table')
  .insert({ ...fields })
  .select()
  .single();

// UPDATE
const { error } = await supabase
  .from('table')
  .update({ field: value })
  .eq('id', id)
  .eq('user_id', user.id); // luôn scope theo user_id

// Luôn check error trước khi dùng data
if (error) return res.status(500).json({ error: error.message });
```

## Plan Limits Check

```javascript
// Trước khi cho phép action cần check plan
import { checkPlanLimit } from '../../../lib/planLimits';
const allowed = await checkPlanLimit(user.id, 'feature_name');
if (!allowed) return res.status(403).json({ error: 'Upgrade plan to use this feature' });
```

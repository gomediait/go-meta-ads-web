# Skill: Observability & Logging

> Kích hoạt khi: thêm feature mới, thêm API route, thêm cron job, hay debug production.

## Nguyên tắc

**Code không observe được = code không vận hành được.**

Instrument song song với feature — không phải sau khi ship.

## Câu hỏi phải trả lời được từ logs

Trước khi thêm log, hỏi: "On-call engineer sẽ hỏi gì khi có sự cố?"

```
Feature: Cron job tắt chiến dịch ngoài giờ (offhours)
Câu hỏi:
1. Cron có chạy đúng giờ không?
2. Bao nhiêu chiến dịch được tắt/bật mỗi lần?
3. Khi Meta API fail, lý do là gì?
→ Log phải trả lời được 3 câu này
```

## Structured Logging Pattern

```javascript
// ❌ String interpolation — không query được
console.log(`Campaign ${id} paused for user ${userId}`);

// ✅ Structured object — query được trên Vercel logs
console.log(JSON.stringify({
  event: 'campaign_paused',
  campaignId: id,
  userId: userId,
  reason: 'offhours',
  timestamp: new Date().toISOString()
}));
```

## Log Levels

| Level | Khi nào | Action |
|---|---|---|
| `error` | Invariant bị vi phạm, cần xem xét | Investigate ngay |
| `warn` | Degraded nhưng handled (retry OK, fallback) | Monitor trend |
| `info` | Business event quan trọng (payment OK, user registered) | None |
| `debug` | Chi tiết diagnostic (tắt trong production) | None |

## Patterns cho từng layer

### API Routes

```javascript
export default async function handler(req, res) {
  const requestId = req.headers['x-request-id'] ?? crypto.randomUUID();

  try {
    // ... business logic

    console.log(JSON.stringify({
      event: 'api_success',
      route: '/api/fb/campaigns',
      method: req.method,
      userId: user?.id,
      requestId,
      durationMs: Date.now() - startTime
    }));

    return res.status(200).json({ data });

  } catch (err) {
    console.error(JSON.stringify({
      event: 'api_error',
      route: '/api/fb/campaigns',
      error: err.message,
      userId: user?.id,
      requestId
    }));

    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Cron Jobs

```javascript
// pages/api/cron/offhours.js
export default async function handler(req, res) {
  const runId = crypto.randomUUID();
  console.log(JSON.stringify({ event: 'cron_start', job: 'offhours', runId }));

  let paused = 0, errors = 0;

  for (const campaign of campaigns) {
    try {
      await pauseCampaign(campaign.id);
      paused++;
    } catch (err) {
      errors++;
      console.error(JSON.stringify({
        event: 'cron_item_error',
        job: 'offhours',
        campaignId: campaign.id,
        error: err.message,
        runId
      }));
    }
  }

  console.log(JSON.stringify({
    event: 'cron_complete',
    job: 'offhours',
    paused,
    errors,
    runId
  }));
}
```

### Meta API Errors

```javascript
// Luôn log đủ context khi Meta fail
try {
  const result = await callMetaApi(endpoint, token);
  return result;
} catch (err) {
  console.error(JSON.stringify({
    event: 'meta_api_error',
    endpoint,
    errorCode: err.code,        // OAuthException, GraphMethodException...
    errorSubcode: err.error_subcode,
    userId: userId,
    isTokenExpired: err.code === 190
  }));
  throw err;
}
```

## KHÔNG LOG

```javascript
// ❌ KHÔNG bao giờ log sensitive data
console.log('Token:', accessToken);          // Token bị lộ
console.log('Password:', req.body.password); // Password bị lộ
console.log('Request body:', req.body);      // Có thể chứa PII

// ✅ Log identifier, không log value
console.log('Token present:', !!accessToken);
console.log('User:', userId); // ID, không phải email/password
```

## Xem logs production

```bash
# Vercel CLI
vercel logs --follow

# Filter cron errors
vercel logs | grep '"event":"cron_item_error"'

# Filter Meta API errors
vercel logs | grep '"event":"meta_api_error"'
```

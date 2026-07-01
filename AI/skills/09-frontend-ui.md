# Skill: Frontend UI Engineering

> Kích hoạt khi: tạo hoặc sửa bất kỳ component JSX, page, hay UI nào.

## Nguyên tắc

Build UI production-quality — không phải UI trông như AI viết.

## Component Patterns cho dự án này

### Tách data fetching khỏi rendering

```jsx
// ✅ Container handles data
export default function CampaignListPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/fb/campaigns')
      .then(r => r.json())
      .then(d => setCampaigns(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} />;
  if (!campaigns.length) return <EmptyState message="Chưa có chiến dịch" />;

  return <CampaignList campaigns={campaigns} />;
}

// ✅ Presentation chỉ render
function CampaignList({ campaigns }) {
  return (
    <div className="campaign-grid">
      {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
    </div>
  );
}
```

### State management đơn giản nhất có thể

```
useState       → UI state local (modal open, input value)
Props          → Chia sẻ giữa 2-3 component gần nhau
Context        → Auth (AuthContext), Language (LangContext)
URL params     → Filters, pagination
Không dùng Redux/Zustand — chưa cần thiết
```

## Tránh "AI Aesthetic"

| Đừng làm | Vì sao | Làm thay vào |
|---|---|---|
| Gradient tím/indigo khắp nơi | Generic, nhàm | Dùng màu đã có trong project |
| `border-radius: 2rem` khắp nơi | Không nhất quán | Consistent radius từ CSS vars |
| Padding đồng đều quá lớn | Phá visual hierarchy | Spacing scale theo thiết kế |
| Text placeholder "Lorem ipsum" | Che giấu layout bugs | Dùng data thực tế |
| Loading spinner đơn giản | Unpolished | Skeleton loading hoặc LoadingScreen component |

## Các states bắt buộc

Mọi component fetch data phải handle:

```jsx
// ✅ Luôn có đủ 4 states
if (loading) return <LoadingScreen />;
if (error) return <div className="error">{error}</div>;
if (!data || data.length === 0) return <EmptyState />;
return <DataComponent data={data} />;
```

## Animation với GSAP

```jsx
// Pattern chuẩn cho GSAP trong component
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function AnimatedCard({ children }) {
  const ref = useRef();

  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }, []);

  return <div ref={ref}>{children}</div>;
}
```

## i18n trong JSX

```jsx
import { useLang } from '../lib/LangContext';

export default function MyComponent() {
  const { t } = useLang(); // hoặc cách dùng i18n của project

  return <button>{t('save')}</button>; // luôn dùng key, không hardcode text
}
```

## Checklist trước khi hoàn thiện UI

```
□ Loading state có không?
□ Error state có không?
□ Empty state có không?
□ Text đã có translation vi/en chưa?
□ Mobile responsive chưa?
□ Không có hardcode string tiếng Anh/Việt nào?
□ Component có quá nhiều responsibilities không? (nếu > 150 dòng → split)
```

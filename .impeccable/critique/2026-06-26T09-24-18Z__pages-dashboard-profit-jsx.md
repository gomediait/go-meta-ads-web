---
target: pages/dashboard/profit.jsx
total_score: 15
p0_count: 0
p1_count: 1
timestamp: 2026-06-26T09-24-18Z
slug: pages-dashboard-profit-jsx
---
## Audit + Fix Summary — pages/dashboard/profit.jsx

### Detector Findings (3 → 0)
- side-tab on .saved-banner: border-left: 3px solid var(--grn) → replaced with border tint
- side-tab on .info-block: border-left: 3px solid var(--primary) → removed
- layout-transition on margin bar: transition: width .5s → transform: scaleX() with expo easing

### Fixes Applied

**Safety & A11y:**
- Toggle div → button with role="switch", aria-checked, aria-labelledby
- Toast gets role="status" + aria-live="polite"
- Product name input gets aria-label
- Focus-visible indicators on all interactive elements (calc-btn, save-btn, reset-btn, tabs, toggle, qty-btn, name-input)
- Reduced motion media query

**Security:**
- Removed dangerouslySetInnerHTML on advice text — was XSS vector, replaced with plain text rendering

**Theming:**
- Tokenized #f97316 (3 occurrences) → var(--ylw)
- Tokenized #00b4d8 → var(--blue)
- Semantic z-index: 9999 → 50

**Anti-patterns:**
- Removed 2 side-tab accent borders
- Fixed layout property animation → transform: scaleX()

**Responsive:**
- Added @media (max-width: 600px) for mobile (padding, font sizes, card padding, tabs wrap)

### What's Working Well
- calcProfit function is clean and comprehensive
- Multi-product tabs with localStorage settings persistence
- Target profit calculator (orders/month, ads budget, capital needed)
- Progressive disclosure (shipping toggle, extra costs optional)
- Quick-set buttons for common values
- Result card with clear profit/loss visual hierarchy

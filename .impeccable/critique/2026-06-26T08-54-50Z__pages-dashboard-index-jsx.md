---
target: pages/dashboard/index.jsx
total_score: 21
p0_count: 1
p1_count: 2
timestamp: 2026-06-26T08-54-50Z
slug: pages-dashboard-index-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Bulk operations no progress bar, no last-refreshed timestamp |
| 2 | Match System / Real World | 3 | Good Meta Ads terminology, smart currency handling |
| 3 | User Control and Freedom | 2 | Toggle campaign no confirmation — real money at stake. No undo |
| 4 | Consistency and Standards | 2 | AI panel uses indigo, disconnected from brand. Mixed EN/VI status labels |
| 5 | Error Prevention | 1 | Critical: toggle on/off no confirmation. Bulk toggle no confirmation |
| 6 | Recognition Rather Than Recall | 3 | Filter dropdowns show selection. Threshold filters no active indicator |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts. No saved filter presets. Per-page checkbox only |
| 8 | Aesthetic and Minimalist Design | 2 | Stats bar 10 metrics equal weight. Filter bar 10+ controls visible |
| 9 | Error Recovery | 2 | Toast auto-dismiss 3.5s too fast for errors. No retry button |
| 10 | Help and Documentation | 1 | Only 2 tooltips. No ROAS/CPA/CTR explanation. No onboarding |
| **Total** | | **21/40** | **Acceptable** |

## Anti-Patterns Verdict

LLM assessment: Not immediately "AI-made." AI panel indigo palette disconnected from brand is the main tell. Gradient button (.btn-quick-budget) stands out among flat controls. Uppercase tracked labels on 4 element types.

Deterministic scan: 3 findings. 1 false positive (blockquote left-border convention). 2 true positives: bounce easing on AI typing dots (line 1689), layout property animation on budget bar fill (line 1787). Additional: arbitrary z-index values (9999, 1200, 1000, 100, 2) with no semantic scale.

## What's Working

1. BudgetBar: progress bar spend-vs-budget with color transitions, tooltip, click-to-edit.
2. Warning badges: 4 types, color-coded, proactive — real automation value.
3. Multi-currency aggregation: per-currency display, VND_LIKE set for no-decimal currencies.

## Priority Issues

### [P0] Toggle campaign on/off no confirmation — real money action
toggleItem (line 742) fires API immediately. handleBulkToggle (line 800) same. No preview, no confirm, no undo.

### [P1] No accessibility — zero ARIA, no focus trap, no keyboard nav
No aria-label anywhere. Modal no focus trap. Toggle no role="switch". Table no role="grid". WCAG AA not met.

### [P1] Stats bar cognitive overload — 10 metrics, no hierarchy
10 metrics horizontal, equal weight. Exceeds working memory. "Tang NS" button mixed with data.

### [P2] AI panel color scheme brand-inconsistent
Indigo (#6366f1/#8b5cf6) throughout — disconnected from brand orange/blue/navy.

### [P2] Error toast auto-dismisses too fast, no actionable details
3500ms auto-dismiss for errors. Bulk failures don't identify which items failed.

## Persona Red Flags

Alex (Power User): No keyboard shortcuts. No saved filter presets. Per-page checkbox only. No export.
Jordan (First-Timer): Empty state dead end. Acronyms unexplained. Advanced filters visible immediately. Warnings without guidance.

## Minor Observations

- fmtVnd and fmtNum identical (lines 74-81)
- Status labels English "ACTIVE"/"PAUSED" in Vietnamese UI
- .upgrade-btn--soft looks like neutral control, not CTA
- colCount hardcodes +4
- .ai-fab and .ai-panel same z-index 1200
- backdrop-filter blur on modal may lag on low-end machines

## Questions to Consider

1. Why does toggle campaign have fewer guardrails than editing a budget?
2. Is AI chat panel earning its screen real estate, or checkbox feature?
3. Who is the stats bar for? 10 equal-weight metrics serve neither power user nor beginner.

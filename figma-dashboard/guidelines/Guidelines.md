**Add your own guidelines here**
<!--

Marketing Analytics Dashboard – Design System Guidelines

Version: 1.0
Theme: Dark Mode Primary (Light mode optional later)
Target: Automotive Marketing Analytics Dashboard (Channel Performance, KPI Tracking, Multi-channel Reports)
Last Updated: January 7, 2026



General Guidelines





Prefer auto-layout, flexbox-style containers, and component variants. Avoid absolute positioning unless overriding a specific layout edge case.



Keep components modular: one responsibility per component/file.



All text must be selectable and accessible (proper contrast ≥ 4.5:1 on dark background).



Use consistent corner radius and elevation for depth.



Icons: Use simple line icons (24px default). Color them with semantic tokens (success, warning, etc.).



No floating action buttons on desktop views. Actions go in top bars or card headers.



Chips/filters always appear in groups of 3+ when possible. Never use dropdowns for ≤3 options — use radio buttons or chips instead.



Design Tokens

Color Palette

Primary





Primary: #0066CC (Trust Blue – buttons, links, accents)



Primary Hover: #0052A3



Primary Light: #E6F2FF (subtle backgrounds)

Semantic





Success: #10B981 (positive trends, clicks, conversions)



Warning: #F59E0B (attention, moderate performance)



Danger: #EF4444 (negative trends, critical alerts)



Info: #0EA5E9 (impressions, neutral metrics)

Neutral / Background (Dark Mode)





Background: #0F172A (main page)



Surface/Card: #1E293B



Border: #334155



Text Primary: #F1F5F9



Text Secondary: #94A3B8



Text Disabled: #64748B

Chart Colors (sequential for multi-line/channel)





#0EA5E9 (Impressions – cyan/blue)



#10B981 (Clicks – green)



#8B5CF6 (Conversions – purple)



#F59E0B (ROAS/CTR – amber)

Typography

Font Stack
Primary: Inter, -apple-system, system-ui, sans-serif
Mono: "SF Mono", Monaco, monospace

Scale (px / rem)





XS: 12px / Caption, metadata



SM: 14px / Body text, labels



Base: 16px / Primary body



LG: 18px / Section subheadings



XL: 20px / Card titles



2XL: 24px / Page subtitles



3XL: 30px / KPI large numbers



4XL: 36px / Hero/main headings



5XL: 48px / Rare hero titles

Weights
Regular: 400
Medium: 500
Semibold: 600
Bold: 700

Spacing Scale (multiples of 4px)

0: 0px
1: 4px
2: 8px
3: 12px
4: 16px (default padding/gutter)
5: 20px
6: 24px (card padding)
8: 32px
12: 48px
16: 64px

Border Radius





SM: 4px (chips, small elements)



MD: 8px (cards, buttons – default)



LG: 12px (modals, larger containers)



Full: 9999px (circular avatars, badges)

Shadows





SM: 0 1px 3px rgba(0,0,0,0.3)



MD: 0 4px 12px rgba(0,0,0,0.25) (cards on hover)



LG: 0 10px 24px rgba(0,0,0,0.3) (modals)



Core Components

Button

Primary





Background: #0066CC



Text: White



Padding: 12px 24px



Radius: 8px



Hover: #0052A3



Disabled: Opacity 0.4

Secondary (Outline)





Background: Transparent



Border: 1px #334155



Text: #F1F5F9



Hover: Background #1E293B

Tertiary (Text)





Background: Transparent



Text: #0066CC



Hover: Underline or subtle background

Card / KPI Card





Background: #1E293B



Padding: 24px



Radius: 12px



Shadow: MD on hover



Structure:
– Icon + Large number (3XL-5XL)
– Label (SM gray)
– Trend row: arrow icon + percentage (colored) + "vs previous period"
– Optional mini sparkline chart at bottom

Filter Bar / Advanced Filters





Background: #1E293B or transparent on page bg



Dropdowns: full-width on mobile, inline on desktop



Active state: subtle border bottom #0066CC



Reset/Save buttons aligned right

Charts (Line / Bar / Sparkline)





Background: transparent or #1E293B



Grid lines: faint #334155



Tooltips: dark with white text



Legend: below or inline chips



Use chart color sequence above

Tabs





Inactive: Text #94A3B8



Active: Text white + bottom border #0066CC 3px thick



Background: transparent

Table





Header: #1E293B sticky



Rows: alternating subtle stripe (#1E293B / transparent)



Hover row: #334155



Layout Patterns

Main Dashboard Page





Header: Title (4XL) + subtitle (LG gray)



Filter bar (sticky optional)



KPI card grid (3–4 columns desktop, 1–2 mobile)



Chart section with tabs (Campaign / Ad Group / Keyword)



Large combined chart (bar + line overlay)



Bottom table or additional cards

Use plenty of vertical spacing (32–48px) between sections.
-->

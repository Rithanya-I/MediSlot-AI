---
name: MediSlot AI
colors:
  surface: '#f6faff'
  surface-dim: '#d4dbe3'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4fc'
  surface-container: '#e8eff7'
  surface-container-high: '#e2e9f1'
  surface-container-highest: '#dce3eb'
  on-surface: '#151c22'
  on-surface-variant: '#3e4947'
  inverse-surface: '#2a3137'
  inverse-on-surface: '#eaf1f9'
  outline: '#6e7977'
  outline-variant: '#bdc9c7'
  surface-tint: '#006a64'
  primary: '#005f5a'
  on-primary: '#ffffff'
  primary-container: '#0d7a73'
  on-primary-container: '#adfff6'
  inverse-primary: '#7dd6cd'
  secondary: '#49607c'
  on-secondary: '#ffffff'
  secondary-container: '#c7dfff'
  on-secondary-container: '#4b637e'
  tertiary: '#005b7c'
  on-tertiary: '#ffffff'
  tertiary-container: '#00759f'
  on-tertiary-container: '#e1f2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#99f2e9'
  primary-fixed-dim: '#7dd6cd'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#00504b'
  secondary-fixed: '#d1e4ff'
  secondary-fixed-dim: '#b0c9e8'
  on-secondary-fixed: '#011d35'
  on-secondary-fixed-variant: '#314863'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#f6faff'
  on-background: '#151c22'
  surface-variant: '#dce3eb'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.025em
  display-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a clinical yet reassuring digital environment designed for an AI-powered healthcare appointment platform. It balances high-velocity scheduling efficiency with the quiet, empathetic clarity required of patient-facing and provider interfaces. 

### Visual Direction & Aesthetics
The aesthetic embraces modern, high-grade medical SaaS: luminous clinical white canvas tones layered over soft sky-blue diagnostic tints, anchored by deep surgical teal and authoritative navy typography. The interaction model is calm, precise, and friction-free, communicating deep algorithmic intelligence without feeling robotic or impersonal. Visual weight is maintained through subtle, micro-thin structural dividers, soft multi-layered diffused shadows, and rounded container silhouettes.

### Emotional Response & Target Audience
- **Target Audience:** Patients seeking rapid, frictionless specialist consultations, alongside clinical administrators and physicians managing high-density clinic capacity.
- **Emotional Impact:** Absolute confidence, clinical competence, clarity under stress, and intelligent ease. The interface eliminates ambiguity around wait times, provider credentials, and scheduling confirmations.

## Colors

The palette balances therapeutic depth with crisp digital utility, calibrated strictly for WCAG AAA accessibility across text and key interactive triggers.

### Palette Architecture
- **Primary (`#0D7A73`):** Deep surgical teal used for primary action items, booking confirms, AI optimization indicators, and high-priority interactive states.
- **Secondary (`#0F2942`):** Dense clinical navy used for primary structural headers, display typography, and high-contrast navigational frames.
- **Tertiary (`#38BDF8`):** Radiant digital cyan highlighting real-time AI slot matches, predictive schedule insights, and active interactive strokes.
- **Neutral Surface Baseline (`#F0F7FF`):** Tonal secondary canvas backdrop, providing cool ambient separation from pure white elevated card layers (`#FFFFFF`) and deeper structural cards (`#E6F0FA`).

### Functional Healthcare Status Tokens
- **Confirmed / Available (Emerald):** Background `#ECFDF5`, Border `#A7F3D0`, Foreground `#047857`.
- **Pending / In-Review (Amber):** Background `#FFFBEB`, Border `#FDE68A`, Foreground `#B45309`.
- **Cancelled / Unavailable (Rose):** Background `#FFF1F2`, Border `#FECDD3`, Foreground `#BE123C`.
- **Structural Outlines:** `#E2E8F0` on light surfaces; `#CBD5E1` for active interactive controls.

## Typography

Typography relies on a tailored, ultra-legible implementation of Inter. Inter provides technical precision, uniform vertical metrics, and optical legibility for alphanumeric clinical data such as time slots, provider licenses, and diagnostic codes.

### Hierarchy & Scale Rules
- **Headlines & Display:** Set in navy (`#0F2942`) with tight tracking (`-0.025em` to `-0.01em`) to assert composure and authority. Mobile variants cap display titles to maintain structural viewability above the fold.
- **Body Text:** Neutralized to deep slate (`#334155`) to prevent eye fatigue while preserving legibility over stark white backgrounds. 
- **Labels & Microcopy:** Rendered with elevated weights (Medium and Semibold) and tracked slightly positive for rapid glanceability across slot chips, metadata timestamps, and clinical validation states.

## Layout & Spacing

The layout is built upon an 8-point geometric scale, utilizing a responsive 12-column fluid grid system on desktop, an 8-column layout on tablet, and a 4-column layout on mobile devices.

### Form-Factor Adaptations
- **Desktop (1200px+):** Fluid 12-column grid with a maximum content constraint of `1440px`. Gutters remain locked at `1.5rem` (`24px`), with outer canvas padding at `2rem` (`32px`). Split layouts standardise on a 4-column provider sidebar alongside an 8-column calendar booking matrix.
- **Tablet (768px – 1199px):** 8-column grid with `1.25rem` (`20px`) gutters and margins. Doctor profiles collapse into top horizontal summary strips.
- **Mobile (< 768px):** 4-column layout with `1rem` (`16px`) gutters and side margins. Booking slots transform into horizontally swipeable segmented strips to preserve vertical scanning space.

## Elevation & Depth

Visual hierarchy leverages dual-phase elevation: structural tonal backdrops offset by multi-stop, diffused ambient drop shadows to produce an elevated surgical feel without visual clutter.

### Elevation Hierarchy
- **Level 0 (Base Canvas):** Background `#F0F7FF`. Zero shadow. Structural boundaries use crisp 1px borders of `#E2E8F0`.
- **Level 1 (Standard Card):** Surface `#FFFFFF`. Shadow: `0px 1px 3px rgba(15, 41, 66, 0.04), 0px 6px 16px rgba(13, 122, 115, 0.04)`. Border: 1px solid `#E2E8F0`. Used for calendar days, doctor cards, and record blocks.
- **Level 2 (Hover / Active Slot):** Surface `#FFFFFF`. Shadow: `0px 4px 12px rgba(15, 41, 66, 0.06), 0px 12px 24px rgba(13, 122, 115, 0.08)`. Border: 1px solid `#38BDF8`.
- **Level 3 (Modals & Flyouts):** Surface `#FFFFFF`. Shadow: `0px 8px 32px rgba(15, 41, 66, 0.12), 0px 24px 48px rgba(15, 41, 66, 0.06)`. Border: 1px solid `#CBD5E1`. Used for appointment confirmation flows and intelligent triage dialogues.
- **AI Highlight Overlay:** Translucent cyan surface (`rgba(224, 242, 254, 0.5)`) backed by a `backdrop-filter: blur(8px)` border overlay (`1px solid #38BDF8`) to denote real-time AI slot matches.

## Shapes

The interface implements a rounded-2xl geometry (`roundedness: 2`) across major structural surfaces, projecting approachable, non-threatening healthcare warmth while preserving structural alignment.

### Geometric Application
- **Main Cards & Panels:** Styled strictly with `1rem` (`16px`) to `1.5rem` (`24px`) corner radii (`rounded-2xl`). This softens clinical information displays and organizes patient summaries into clear clusters.
- **Buttons, Form Inputs & Date Chips:** Standardize on `0.5rem` (`8px`) radii to retain crisp interactive affordance.
- **Status Badges & AI Tags:** Pill-shaped (`9999px`) to immediately distinguish contextual metadata from interactive containers.

## Components

### Buttons
- **Primary:** Background `#0D7A73`, Text `#FFFFFF`, border: none, radius `0.5rem`. Hover state transitions to `#0A6C74` with subtle translateY(-1px).
- **Secondary:** Background `#FFFFFF`, Text `#0F2942`, border: `1px solid #E2E8F0`. Hover state switches border to `#CBD5E1` and background to `#F8FAFC`.
- **AI Smart Action:** Background `linear-gradient(135deg, #0D7A73 0%, #0A6C74 100%)`, accented with a 1px border of `rgba(56, 189, 248, 0.4)` and a leading radiant cyan spark icon.

### Time Slot Chips
- **Available:** Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#0F2942`.
- **Selected:** Background `#0D7A73`, border `1px solid #0D7A73`, text `#FFFFFF`.
- **AI-Recommended:** Background `#F0F7FF`, border `1.5px solid #38BDF8`, text `#0A6C74`, featuring an upper-right cyan micro-indicator dot.
- **Booked / Inactive:** Background `#F8FAFC`, border `1px solid #F1F5F9`, text `#94A3B8`, cursor `not-allowed`.

### Healthcare Status Badges
- Built as pill-shaped (`rounded-full`) tags using `label-sm` semibold text with a 6px status indicator circle.
- **Confirmed / Open:** `#ECFDF5` background, `#A7F3D0` border, `#047857` foreground.
- **Pending Triage:** `#FFFBEB` background, `#FDE68A` border, `#B45309` foreground.
- **Unavailable / Cancelled:** `#FFF1F2` background, `#FECDD3` border, `#BE123C` foreground.

### Form Inputs
- Baseline height `44px` with `0.5rem` radius. Crisp `1px solid #E2E8F0` border on `#FFFFFF` base fill.
- Focus state: `1px solid #0D7A73` with a `0 0 0 3px rgba(13, 122, 115, 0.15)` optical ring. Error states swap to rose tokens (`#BE123C`).

### Cards & Panels
- Constructed with `#FFFFFF` background, `1.5rem` corner radius, `1px solid #E2E8F0` perimeter border, and Level 1 elevation shadow.
- Inner padding strictly pinned to `space-lg` (`1.5rem`).

### Specialized AI Component: Predictive Slot Matcher
- Container featuring an ultra-subtle diagnostic blue gradient border (`#E0F2FE` to `#38BDF8`), interior background `#FFFFFF`, accompanied by an animated AI badge indicating confidence level (e.g., "98% Optimal Match for Your Routine").
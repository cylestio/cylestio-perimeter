# Agent Inspector Design System - Complete Token Reference

## Version: 1.0.0
## Status: Implementation-Ready

---

## 1. Color System

### 1.1 Core Palette - "The Void"

```css
/* Base Surfaces */
--void:           #000000;     /* True black background */
--surface:        #0a0a0f;     /* Primary surface */
--surface-2:      #12121a;     /* Elevated surface */
--surface-3:      #1a1a24;     /* Card surface */
--surface-4:      #22222e;     /* Hover state surface */

/* Border Colors */
--border-subtle:  rgba(255, 255, 255, 0.06);
--border-medium:  rgba(255, 255, 255, 0.12);
--border-strong:  rgba(255, 255, 255, 0.20);
--border-focus:   var(--cyan);
```

### 1.2 Signal Colors

```css
/* Primary Accent - Cyan (Actions, Links, Primary States) */
--cyan:           #00f0ff;
--cyan-soft:      rgba(0, 240, 255, 0.12);
--cyan-glow:      0 0 20px rgba(0, 240, 255, 0.4);

/* Success - Green (Fixed, Safe, Controlled) */
--green:          #00ff88;
--green-soft:     rgba(0, 255, 136, 0.12);
--green-glow:     0 0 20px rgba(0, 255, 136, 0.4);

/* Warning - Orange (High Severity, Attention) */
--orange:         #ff9f43;
--orange-soft:    rgba(255, 159, 67, 0.12);
--orange-glow:    0 0 20px rgba(255, 159, 67, 0.4);

/* Critical - Red (Danger, Error, Critical) */
--red:            #ff4757;
--red-soft:       rgba(255, 71, 87, 0.12);
--red-glow:       0 0 20px rgba(255, 71, 87, 0.4);

/* AI/Behavioral - Purple (AI insights, Clusters) */
--purple:         #a855f7;
--purple-soft:    rgba(168, 85, 247, 0.12);
--purple-glow:    0 0 20px rgba(168, 85, 247, 0.4);

/* Medium Severity - Yellow/Amber */
--yellow:         #f59e0b;
--yellow-soft:    rgba(245, 158, 11, 0.12);
```

### 1.3 Text Colors

```css
--white:          #ffffff;
--white-90:       rgba(255, 255, 255, 0.90);  /* Primary text */
--white-70:       rgba(255, 255, 255, 0.70);  /* Secondary text */
--white-50:       rgba(255, 255, 255, 0.50);  /* Muted text */
--white-30:       rgba(255, 255, 255, 0.30);  /* Disabled text */
--white-15:       rgba(255, 255, 255, 0.15);  /* Hints */
--white-08:       rgba(255, 255, 255, 0.08);  /* Subtle backgrounds */
--white-04:       rgba(255, 255, 255, 0.04);  /* Hover states */
```

### 1.4 Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--severity-critical` | `#ff4757` | Critical findings, blockers |
| `--severity-high` | `#ff9f43` | High priority findings |
| `--severity-medium` | `#f59e0b` | Medium priority findings |
| `--severity-low` | `#6b7280` | Low/informational |
| `--severity-pass` | `#00ff88` | Passing, safe, controlled |

### 1.5 Correlation Badge Colors

| Status | Background | Border | Text |
|--------|------------|--------|------|
| CONFIRMED | `--green-soft` | `--green` | `--green` |
| CONTROLLED | `--green-soft` with shield | `--green` | `--green` |
| DISCOVERED | `--purple-soft` | `--purple` | `--purple` |
| PENDING | `--white-08` | dashed `--white-30` | `--white-50` |
| TRIGGERED | `--red-soft` | `--red` | `--red` |

---

## 2. Typography

### 2.1 Font Families

```css
/* Display & Body Text */
--font-display:   'Space Grotesk', -apple-system, sans-serif;

/* Code, Data, Metrics */
--font-mono:      'JetBrains Mono', 'SF Mono', monospace;
```

### 2.2 Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--text-xs` | 11px | 1.5 | Labels, meta, badges |
| `--text-sm` | 12px | 1.5 | Secondary text, captions |
| `--text-base` | 13px | 1.6 | Body text |
| `--text-md` | 14px | 1.5 | Emphasized body |
| `--text-lg` | 16px | 1.4 | Section headers |
| `--text-xl` | 18px | 1.4 | Card titles |
| `--text-2xl` | 24px | 1.3 | Page titles |
| `--text-3xl` | 32px | 1.2 | Hero numbers |
| `--text-4xl` | 48px | 1.1 | Risk score hero |
| `--text-5xl` | 64px | 1.0 | Feature highlights |

### 2.3 Font Weights

```css
--weight-normal:    400;
--weight-medium:    500;
--weight-semibold:  600;
--weight-bold:      700;
--weight-extrabold: 800;
```

### 2.4 Letter Spacing

```css
--tracking-tight:   -0.02em;  /* Headlines */
--tracking-normal:  0;         /* Body */
--tracking-wide:    0.05em;    /* Labels, badges */
--tracking-wider:   0.08em;    /* Section headers */
```

---

## 3. Spacing System

### 3.1 Base Unit: 4px

```css
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
--space-20:  80px;
```

### 3.2 Component Spacing

```css
/* Cards */
--card-padding:         24px;
--card-header-padding:  16px 20px;
--card-gap:            16px;

/* Sections */
--section-gap:         32px;

/* Page Layout */
--page-padding:        32px;
--sidebar-width:       240px;
--content-max-width:   1200px;
```

---

## 4. Border Radius

```css
--radius-xs:    2px;    /* Inline badges */
--radius-sm:    4px;    /* Small elements, tags */
--radius-md:    6px;    /* Buttons, inputs */
--radius-lg:    8px;    /* Cards */
--radius-xl:    12px;   /* Large cards, modals */
--radius-2xl:   16px;   /* Hero sections */
--radius-full:  9999px; /* Pills, avatars, orbs */
```

---

## 5. Shadows & Effects

### 5.1 Drop Shadows

```css
--shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md:    0 4px 8px rgba(0, 0, 0, 0.4);
--shadow-lg:    0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-xl:    0 16px 48px rgba(0, 0, 0, 0.6);
```

### 5.2 Glow Effects

```css
--glow-cyan:    0 0 20px rgba(0, 240, 255, 0.3),
                0 0 40px rgba(0, 240, 255, 0.15);
--glow-green:   0 0 20px rgba(0, 255, 136, 0.3),
                0 0 40px rgba(0, 255, 136, 0.15);
--glow-red:     0 0 20px rgba(255, 71, 87, 0.3),
                0 0 40px rgba(255, 71, 87, 0.15);
--glow-orange:  0 0 20px rgba(255, 159, 67, 0.3),
                0 0 40px rgba(255, 159, 67, 0.15);
--glow-purple:  0 0 20px rgba(168, 85, 247, 0.3),
                0 0 40px rgba(168, 85, 247, 0.15);
```

### 5.3 Ambient Background

```css
/* Cosmic gradient backgrounds */
.cosmos-bg {
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(0, 240, 255, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.02) 0%, transparent 50%);
}

/* For danger contexts */
.cosmos-danger {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(255, 71, 87, 0.04) 0%, transparent 60%);
}
```

---

## 6. Animation & Motion

### 6.1 Timing Functions

```css
--ease-default:   ease;
--ease-in:        cubic-bezier(0.4, 0, 1, 1);
--ease-out:       cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 6.2 Duration Tokens

```css
--duration-instant:  0ms;
--duration-fast:     150ms;
--duration-normal:   200ms;
--duration-slow:     300ms;
--duration-slower:   500ms;
```

### 6.3 Standard Transitions

```css
--transition-fast:   150ms ease;
--transition-base:   200ms ease;
--transition-slow:   300ms ease;
--transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 6.4 Animation Presets

```css
/* Pulse for live indicators */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Spin for loading */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Fade in with slide */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Glow pulse for attention */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--glow-color); }
  50% { box-shadow: var(--glow-color); }
}

/* Count up animation for scores */
@keyframes countUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Orb rotation */
@keyframes orbSpin {
  to { transform: rotate(360deg); }
}
```

---

## 7. Layout Grid

### 7.1 Breakpoints

```css
--bp-sm:   640px;   /* Mobile landscape */
--bp-md:   768px;   /* Tablet */
--bp-lg:   1024px;  /* Laptop */
--bp-xl:   1280px;  /* Desktop */
--bp-2xl:  1536px;  /* Large desktop */
```

### 7.2 Container Widths

```css
--container-sm:   640px;
--container-md:   768px;
--container-lg:   1024px;
--container-xl:   1200px;
--container-2xl:  1400px;
```

### 7.3 Standard Grid

| Breakpoint | Sidebar | Main Content | Gutters |
|------------|---------|--------------|---------|
| < 768px | Hidden (hamburger) | 100% | 16px |
| 768-1024px | 64px (collapsed) | Flex | 24px |
| > 1024px | 240px (expanded) | Flex | 32px |

---

## 8. Z-Index Scale

```css
--z-dropdown:     100;
--z-sticky:       200;
--z-fixed:        300;
--z-modal-bg:     400;
--z-modal:        500;
--z-popover:      600;
--z-tooltip:      700;
--z-toast:        800;
```

---

## 9. Component Token Mapping

### 9.1 Buttons

| Variant | Background | Border | Text | Hover |
|---------|------------|--------|------|-------|
| Primary | `--cyan` | none | `--void` | brightness(1.1), translateY(-1px) |
| Secondary | `--white-08` | `--border-medium` | `--white-90` | `--white-15` |
| Ghost | transparent | none | `--white-50` | `--white-90` |
| Danger | `--red` | none | `--white` | brightness(0.9) |
| Success | `--green` | none | `--void` | brightness(1.1) |

### 9.2 Form Inputs

| State | Background | Border | Text |
|-------|------------|--------|------|
| Default | `--surface-2` | `--border-medium` | `--white-90` |
| Focus | `--surface-3` | `--cyan` | `--white` |
| Error | `--red-soft` | `--red` | `--white-90` |
| Disabled | `--surface` | `--border-subtle` | `--white-30` |

### 9.3 Cards

| Variant | Background | Border | Radius |
|---------|------------|--------|--------|
| Standard | `--surface` | `--border-medium` | `--radius-lg` |
| Elevated | `--surface-2` | `--cyan` | `--radius-lg` |
| Interactive | `--surface` | `--border-medium` | `--radius-lg` |
| Status | `--surface` | left 4px severity color | `--radius-lg` |

### 9.4 Badges

| Type | Background | Border | Text Size |
|------|------------|--------|-----------|
| Severity | `--severity-color-soft` | none | `--text-xs` |
| Status | color-soft | none | `--text-xs` |
| Mode Pill | transparent | 1px color | `--text-xs` |
| Validation | `--green-soft` | `--green` | `--text-xs` |

---

## 10. Icon Guidelines

### 10.1 Icon Library
Use **Lucide React** icons consistently throughout the product.

### 10.2 Standard Sizes
| Context | Size | Stroke |
|---------|------|--------|
| Inline text | 14px | 2px |
| Buttons | 16px | 2px |
| Nav items | 18px | 2px |
| Feature icons | 20px | 1.5px |
| Hero icons | 24px | 1.5px |

### 10.3 Icon Color Inheritance
Icons inherit `currentColor` from parent text color.

---

## 11. Accessibility Requirements

### 11.1 Color Contrast
- All text must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
- Interactive elements must have 3:1 contrast

### 11.2 Focus States
- All interactive elements must have visible focus ring
- Focus ring: `0 0 0 2px var(--surface), 0 0 0 4px var(--cyan)`

### 11.3 Motion
- Respect `prefers-reduced-motion`
- Provide static alternatives for animated elements

---

*This token system forms the foundation for all UI implementation. Developers should reference these tokens exclusively rather than hardcoding values.*


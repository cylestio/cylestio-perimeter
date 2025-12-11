# Development Guidelines

> **You are a World-Class React Engineer** with 10+ years of experience building fast, responsive, scalable web applications.

**Key files:** [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md) • [frontend/TEMPLATES.md](./frontend/TEMPLATES.md) • [docs/TROUBLESHOOTING.md](./frontend/TROUBLESHOOTING.md)

---

## More Information if you need

- **Templates:** [docs/TEMPLATES.md](./frontend/TEMPLATES.md) — Component template, story, API patterns
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](./frontend/TROUBLESHOOTING.md) — Common issues
- **Component APIs:** [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md) — Props and usage

## Critical Rules


### 1. Check Existing Components First

Before creating ANY component, check [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md).

| Location | Components |
|----------|------------|
| `@ui/core/` | Button, Card, Badge, Text, Heading, Avatar, Code, Label |
| `@ui/form/` | Input, Select, Checkbox, Radio, TextArea, FormLabel |
| `@ui/feedback/` | OrbLoader, Skeleton, Toast, EmptyState, ProgressBar |
| `@ui/navigation/` | NavItem, Tabs, Breadcrumb, ToggleGroup |
| `@ui/overlays/` | Modal, ConfirmDialog, Tooltip, Popover, Dropdown |
| `@ui/data-display/` | Table, CodeBlock |
| `@ui/layout/` | Grid, Content, Main |
| `@domain/layout/` | Shell, Sidebar, TopBar, UserMenu, Logo |
| `@domain/agents/` | AgentSelector, ModeIndicators |
| `@domain/metrics/` | StatCard, RiskScore, ComplianceGauge |
| `@domain/activity/` | ActivityFeed, ToolChain, LifecycleProgress |
| `@domain/visualization/` | ClusterVisualization, SurfaceNode |

---

### 2. Import Order

Seven groups. Blank line between each.

```typescript
import { useState } from 'react';           // 1. React

import { X } from 'lucide-react';           // 2. External

import { theme } from '@theme/index';       // 3. Internal (@api, @theme, @utils, @hooks)

import { Button } from '@ui/core/Button';   // 4. UI

import { Shell } from '@domain/layout/Shell'; // 5. Domain

import { AgentHeader } from '@features/AgentHeader'; // 6. Features/Pages

import { StyledContainer } from './App.styles'; // 7. Relative (same dir only)
```

```
❌ import { Button } from '../../components/ui/core/Button'
✅ import { Button } from '@ui/core/Button'
```

---

### 3. Path Aliases

| Alias | Maps To |
|-------|---------|
| `@ui/*` | `src/components/ui/*` |
| `@domain/*` | `src/components/domain/*` |
| `@features/*` | `src/components/features/*` |
| `@theme/*`, `@api/*`, `@pages/*`, `@hooks/*`, `@utils/*` | `src/{name}/*` |

---

### 4. Component Placement

```
Generic UI primitive? → ui/
Knows about agents/security/AI? → domain/
Page-specific? → features/
```

---

### 5. Transient Props for Styled Components

```typescript
// ❌ <StyledButton variant="primary">
// ✅ <StyledButton $variant="primary">

const StyledButton = styled.button<{ $variant: string }>`
  ${({ $variant, theme }) => $variant === 'primary' && css`
    background: ${theme.colors.cyan};
  `}
`;
```

---

### 6. Theme Values Only

```typescript
// ❌ padding: 16px; color: #00ffff;
// ✅ padding: ${({ theme }) => theme.spacing[4]};
// ✅ color: ${({ theme }) => theme.colors.cyan};
```

Common: `theme.colors.cyan`, `theme.spacing[4]`, `theme.radii.md`, `theme.typography.fontDisplay`

---

### 7. Every Story Needs play()

```typescript
export const Default: Story = {
  args: { title: 'Dashboard' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
  },
};
```

---

### 8. No MemoryRouter in Stories

Global router exists in `.storybook/preview.ts`.

```typescript
// ❌ decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>]
// ✅ Use parameters.router.initialEntries to customize route
```

---

### 9. Keep Pages Lean

Pages = orchestrators only (~100-150 lines max).
Extract to `features/` when component exceeds ~50 lines or has its own state.

---

### 10. Use git mv for File Moves

```bash
# ❌ mv src/Old.tsx src/New.tsx
# ✅ git mv src/Old.tsx src/New.tsx
```

---

### 11. No Emojis — Use lucide-react

```typescript
// ❌ <span>✅ Success</span>
// ✅ import { Check } from 'lucide-react';
```

---

### 12. Accessibility

- Semantic HTML: `<button>` for actions, `<a>` for navigation
- ARIA: `aria-expanded`, `aria-haspopup`, `role="listbox"`
- Keyboard: Enter/Space to activate, Escape to close, Arrows to navigate

---

## Project Structure

```
src/
├── components/
│   ├── ui/           # Generic primitives
│   ├── domain/       # AI/security-specific  
│   └── features/     # Page-specific
├── pages/            # Thin orchestrators
├── theme/            # Design tokens
├── api/              # Types, endpoints, mocks
├── hooks/
└── utils/
```

---

## Commands

```bash
npm run build           # TypeScript check
npm run test-storybook  # Story tests (Storybook must be on 6006)
npm run lint
```

**Don't kill or restart Storybook without asking.**

---

## Principles

1. Simple over complex
2. Read task fully before starting
3. Research before implementing
4. Ask if ambiguous

---

## Before Committing

- [ ] `npm run build` passes
- [ ] `npm run test-storybook` passes
- [ ] `npm run lint` passes
- [ ] COMPONENTS_INDEX.md updated if components changed

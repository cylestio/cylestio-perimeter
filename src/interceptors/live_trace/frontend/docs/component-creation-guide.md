# Creating a Component

Step-by-step guide for creating new components.

---

## Import Order (7 Groups)

Blank line between each group:

```typescript
import { useState } from 'react';                    // 1. React

import { X } from 'lucide-react';                    // 2. External

import { theme } from '@theme/index';                // 3. Internal (@api, @theme, @utils, @hooks)

import { Button } from '@ui/core/Button';            // 4. UI

import { Shell } from '@domain/layout/Shell';        // 5. Domain

import { AgentHeader } from '@features/AgentHeader'; // 6. Features/Pages

import { StyledContainer } from './App.styles';      // 7. Relative (same dir only)
```

**Always use path aliases:** `@ui/core/Button` not `../../components/ui/core/Button`

---

## Component Placement

```
Generic UI primitive? → ui/
Knows about agents/security/AI? → domain/
Page-specific? → features/
```

**Examples:**
- `Button`, `Card`, `Input` → `@ui/core/`, `@ui/form/`
- `AgentCard`, `RiskScore` → `@domain/agents/`, `@domain/metrics/`
- `AgentHeader`, `SessionDetail` → `@features/`

---

## File Structure

```
ComponentName/
├── ComponentName.tsx         # Component + types
├── ComponentName.styles.ts   # Styled components
└── ComponentName.stories.tsx # Stories + tests
```

---

## ComponentName.tsx

```typescript
import type { FC, ReactNode } from 'react';

import { StyledComponent } from './ComponentName.styles';

// Types at top, exported for external use
export type ComponentVariant = 'primary' | 'secondary';

export interface ComponentNameProps {
  variant?: ComponentVariant;
  children: ReactNode;
  className?: string;
}

export const ComponentName: FC<ComponentNameProps> = ({
  variant = 'primary',
  children,
  className,
}) => (
  <StyledComponent $variant={variant} className={className}>
    {children}
  </StyledComponent>
);
```

---

## ComponentName.styles.ts

```typescript
import styled, { css } from 'styled-components';

interface StyledComponentProps {
  $variant: 'primary' | 'secondary';
  $disabled?: boolean;
}

export const StyledComponent = styled.div<StyledComponentProps>`
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.base};

  ${({ $variant, theme }) =>
    $variant === 'primary' &&
    css`
      background: ${theme.colors.cyan};
      color: ${theme.colors.void};
    `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
    `}
`;
```

**Key points:**
- Use `$` prefix for transient props (prevents DOM warnings)
- Always use theme tokens (see [theme-design-tokens.md](./theme-design-tokens.md))
- Use `css` helper for conditional styles

**Never hardcode values:**
```typescript
// ❌ padding: 16px; color: #00ffff;
// ✅ padding: ${({ theme }) => theme.spacing[4]};
// ✅ color: ${({ theme }) => theme.colors.cyan};
```

---

## Export Pattern

Add to category's `index.ts`:

```typescript
// src/components/ui/core/index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps, ComponentVariant } from './ComponentName';
```

---

## Update components-index.md

After creating a component, update [components-index.md](./components-index.md) with:
- Component location in the appropriate category table

---

## Accessibility

- Semantic HTML: `<button>` for actions, `<a>` for navigation
- ARIA: `aria-expanded`, `aria-haspopup`, `role="listbox"`
- Keyboard: Enter/Space to activate, Escape to close, Arrows to navigate

---

## Icons

**No emojis** — use `lucide-react`:

```typescript
// ❌ <span>✅ Success</span>
// ✅ import { Check } from 'lucide-react';
```

---

## File Operations

**Use `git mv` for renames** to preserve history:

```bash
# ❌ mv src/Old.tsx src/New.tsx
# ✅ git mv src/Old.tsx src/New.tsx
```

---

## Component Size Guidelines

**Keep pages lean:** Pages = orchestrators only (~100-150 lines max).  
**Extract to `features/`** when component exceeds ~50 lines or has its own state.

---

## Next Steps

1. Create story file → See [storybook-best-practices.md](./storybook-best-practices.md)
2. Test in Storybook
3. Update components-index.md


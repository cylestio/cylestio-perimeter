---
name: creating-cylestio-components
description: Use when creating or modifying React components and Storybook stories in the Cylestio frontend. Covers component files (.tsx), styles (.styles.ts), and stories (.stories.tsx) with required interaction tests.
---

# Creating Cylestio Components

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

## File Structure

```
ComponentName/
├── ComponentName.tsx         # Component + types
├── ComponentName.styles.ts   # Styled components
└── ComponentName.stories.tsx # Stories + interaction tests (REQUIRED)
```

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
- Always use theme tokens (see `theme-reference.md`)
- Use `css` helper for conditional styles

**Never hardcode values:**
```typescript
// ❌ padding: 16px; color: #00ffff;
// ✅ padding: ${({ theme }) => theme.spacing[4]};
// ✅ color: ${({ theme }) => theme.colors.cyan};
```

## Export Pattern

Add to category's `index.ts`:

```typescript
// src/components/ui/core/index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps, ComponentVariant } from './ComponentName';
```

## Update COMPONENTS_INDEX.md

After creating a component, update `components-index.md` with:
- Component location
- Props interface
- Usage example

## Accessibility

- Semantic HTML: `<button>` for actions, `<a>` for navigation
- ARIA: `aria-expanded`, `aria-haspopup`, `role="listbox"`
- Keyboard: Enter/Space to activate, Escape to close, Arrows to navigate

## Icons

**No emojis** — use `lucide-react`:

```typescript
// ❌ <span>✅ Success</span>
// ✅ import { Check } from 'lucide-react';
```

## File Operations

**Use `git mv` for renames** to preserve history:

```bash
# ❌ mv src/Old.tsx src/New.tsx
# ✅ git mv src/Old.tsx src/New.tsx
```

## Component Size Guidelines

**Keep pages lean:** Pages = orchestrators only (~100-150 lines max).
**Extract to `features/`** when component exceeds ~50 lines or has its own state.

## Before Creating

Check `components-index.md` for existing components to avoid duplication.

---

# ComponentName.stories.tsx (REQUIRED)

**Every component MUST have a `.stories.tsx` file with interaction tests.**

## Basic Story Template

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'UI/Core/ComponentName',  // UI: 'UI/Category/Name', Domain: 'Domain/Category/Name'
  component: ComponentName,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Click me')).toBeInTheDocument();
  },
};
```

## Story Patterns

### Args-Based (Simple Props)
```typescript
export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary Button' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Primary Button')).toBeInTheDocument();
  },
};
```

### Render-Based (Complex JSX)
```typescript
export const WithIcon: Story = {
  render: () => <ComponentName><Icon /> Label</ComponentName>,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Label')).toBeInTheDocument();
  },
};
```

### Stateful (Interactive)
```typescript
export const Interactive: Story = {
  render: function InteractiveComponent() {
    const [value, setValue] = useState('');
    return <Input value={value} onChange={setValue} />;
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'test');
    await expect(input).toHaveValue('test');
  },
};
```

### Click Interaction
```typescript
export const Clickable: Story = {
  args: { onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

## Required: play() Function

**Every story MUST have a `play()` function** for testing interactions:

```typescript
play: async ({ canvas }) => {
  await expect(canvas.getByText('Dashboard')).toBeInTheDocument();

  const button = canvas.getByRole('button');
  await userEvent.click(button);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
},
```

## Common Queries

```typescript
canvas.getByText('Submit')           // By text
canvas.getByRole('button')           // By role
canvas.getByRole('textbox')          // By role
canvas.getByTestId('submit-button')  // By test ID
```

## Testing Interactions

```typescript
import { userEvent } from 'storybook/test';

play: async ({ canvas }) => {
  const input = canvas.getByRole('textbox');

  // Type text
  await userEvent.type(input, 'Hello');

  // Click button
  await userEvent.click(canvas.getByRole('button'));

  // Check result
  await expect(canvas.getByText('Hello')).toBeInTheDocument();
}
```

## Router Customization

**No MemoryRouter needed** - global router exists in `.storybook/preview.ts`

```typescript
// Custom route
export const WithRoute: Story = {
  parameters: {
    router: { initialEntries: ['/agent-workflow/abc123/agent/xyz'] },
  },
};

// Disable router
export const NoRouter: Story = {
  parameters: { router: { disable: true } },
};
```

## Story Naming

- **Title format:** `Category/Subcategory/ComponentName`
  - UI: `UI/Core/Button`, `UI/Form/Input`
  - Domain: `Domain/Agents/AgentCard`, `Domain/Metrics/RiskScore`
- **Story names:** PascalCase (`Primary`, `WithIcon`, `Disabled`)

## Story Best Practices

1. **Always include `play()`** - Required for all stories
2. **Test user interactions** - Click, type, navigate
3. **Use semantic queries** - `getByRole` > `getByText` > `getByTestId`
4. **No MemoryRouter** - Router is global in preview
5. **Keep stories focused** - One story = one use case

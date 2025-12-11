# Templates

Reference templates for components, stories, and API patterns.

---

## Component File Structure

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

---

## ComponentName.stories.tsx

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

// Args-based (simple)
export const Default: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Click me')).toBeInTheDocument();
  },
};

// Render-based (complex JSX)
export const WithIcon: Story = {
  render: () => (
    <ComponentName>
      <Icon /> Label
    </ComponentName>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Label')).toBeInTheDocument();
  },
};

// Stateful (add useState import at top)
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

// Click interaction
export const Clickable: Story = {
  args: { onClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

---

## Story Router Customization

```typescript
// Custom initial route
export const WithRoute: Story = {
  parameters: {
    router: {
      initialEntries: ['/workflow/abc123/agent/xyz'],
    },
  },
};

// Disable router
export const NoRouter: Story = {
  parameters: {
    router: { disable: true },
  },
};
```

---

## API Layer

### Directory Structure

```
src/api/
├── types/           # Response types
│   ├── dashboard.ts
│   └── index.ts
├── endpoints/       # Fetch functions
│   ├── dashboard.ts
│   └── index.ts
├── mocks/           # Dev data
│   └── index.ts
└── index.ts         # Barrel export
```

### Type Definition

```typescript
// src/api/types/dashboard.ts
export interface APIAgent {
  id: string;
  id_short: string;
  total_sessions: number;
  active_sessions: number;
  risk_status: 'evaluating' | 'ok';
}

export interface DashboardResponse {
  agents: APIAgent[];
  sessions: APISession[];
  last_updated: string;
}
```

### Endpoint Function

```typescript
// src/api/endpoints/dashboard.ts
import type { DashboardResponse } from '../types/dashboard';

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  const response = await fetch('/api/dashboard');
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  return response.json();
};
```

### Usage in Components

```typescript
import { fetchDashboard } from '@api';
import type { APIAgent } from '@api';

const [agents, setAgents] = useState<APIAgent[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchDashboard()
    .then(data => setAgents(data.agents))
    .catch(err => setError(err instanceof Error ? err.message : 'Failed'))
    .finally(() => setLoading(false));
}, []);
```

---

## Exports Pattern

```typescript
// src/components/ui/core/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';

export { Card } from './Card';
export type { CardProps } from './Card';
```

---

## Animations

```typescript
import { pulse, spin, fadeInUp } from '@theme/animations';

const LoadingIcon = styled.div`
  animation: ${spin} 0.8s linear infinite;
`;
```

---

## Theme Tokens Reference

```typescript
// Colors
theme.colors.cyan           // Signal/accent
theme.colors.white90        // Primary text
theme.colors.surface2       // Backgrounds
theme.colors.borderMedium   // Borders
theme.colors.void           // Dark background

// Typography
theme.typography.fontDisplay  // Space Grotesk
theme.typography.fontMono     // JetBrains Mono
theme.typography.textSm       // 12px
theme.typography.textMd       // 14px
theme.typography.textLg       // 16px

// Spacing (4px base)
theme.spacing[1]   // 4px
theme.spacing[2]   // 8px
theme.spacing[4]   // 16px
theme.spacing[6]   // 24px
theme.spacing[8]   // 32px

// Border radius
theme.radii.sm     // 4px
theme.radii.md     // 6px
theme.radii.lg     // 8px
theme.radii.full   // 9999px

// Shadows
theme.shadows.glowCyan
theme.shadows.sm
theme.shadows.md

// Transitions
theme.transitions.base
theme.transitions.fast
```

---

## Commit Messages

```
feat: add new Button variant
fix: correct Badge alignment issue
docs: update development guide
style: format code with prettier
refactor: simplify Card component
test: add Modal interaction tests
chore: update dependencies
```

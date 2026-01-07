# Creating Stories

Step-by-step guide for creating Storybook stories with tests.

---

## File Structure

Stories live alongside components:

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.styles.ts
└── ComponentName.stories.tsx  ← Story file
```

---

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
```

---

## Story Patterns

### Args-Based (Simple Props)

```typescript
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Primary Button')).toBeInTheDocument();
  },
};
```

### Render-Based (Complex JSX)

```typescript
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
```

### Stateful (Interactive)

```typescript
import { useState } from 'react';

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

---

## Router Customization

**No MemoryRouter needed** — global router exists in `.storybook/preview.ts`

### Custom Route

```typescript
export const WithRoute: Story = {
  parameters: {
    router: {
      initialEntries: ['/agent-workflow/abc123/agent/xyz'],
    },
  },
};
```

### Disable Router

```typescript
export const NoRouter: Story = {
  parameters: {
    router: { disable: true },
  },
};
```

---

## Required: play() Function

**Every story MUST have a `play()` function for testing interactions, conditional rendering, states, ...**:

```typescript
export const Default: Story = {
  args: { title: 'Dashboard' },
  play: async ({ canvas }) => {
    // Test that component renders
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
    
    // Test interactions
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};
```

---

## Common Queries

Use appropriate query methods:

```typescript
// By text
canvas.getByText('Submit')

// By role
canvas.getByRole('button')
canvas.getByRole('textbox')

// By test ID (if available)
canvas.getByTestId('submit-button')
```

---

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

---

## Story Naming

- **Title format:** `Category/Subcategory/ComponentName`
  - UI components: `UI/Core/Button`, `UI/Form/Input`
  - Domain components: `Domain/Agents/AgentCard`, `Domain/Metrics/RiskScore`
- **Story names:** Use PascalCase (`Primary`, `WithIcon`, `Disabled`)

---

## Best Practices

1. **Always include `play()`** — Required for all stories
2. **Test user interactions** — Click, type, navigate
3. **Use semantic queries** — `getByRole` > `getByText` > `getByTestId`
4. **No MemoryRouter** — Router is global in preview
5. **Keep stories focused** — One story = one use case


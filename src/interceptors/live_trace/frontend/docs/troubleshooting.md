# Troubleshooting

Common issues and solutions in FAQ format.

---

## Imports & Paths

**Q: Component not found after import?**

Check three things:
1. Path alias exists in `tsconfig.json` and `vite.config.ts`
2. Component is exported from category's `index.ts`
3. Using correct alias (`@ui/core/Button` not `../../components/ui/core/Button`)

---

**Q: "Cannot find module" error but file exists?**

Restart TypeScript server in your editor, or run `npm run build` to see full error.

---

## Styled Components

**Q: Warning about unknown prop passed to DOM?**

Use `$` prefix for transient props:

```typescript
// ❌ Causes warning
<StyledButton variant="primary">

// ✅ Correct
<StyledButton $variant="primary">
```

---

**Q: Theme values not applying?**

Ensure component is inside `ThemeProvider`. Check `theme.ts` for correct token path:

```typescript
// ❌ Wrong path
theme.color.cyan

// ✅ Correct
theme.colors.cyan
```

---

## Storybook

**Q: "Cannot render a Router inside another Router" error?**

Remove `MemoryRouter` from story decorators. Global router is in `.storybook/preview.ts`:

```typescript
// ❌ Don't do this
decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>]

// ✅ Router already exists globally
```

---

**Q: Story tests failing but component works?**

1. Ensure story has `play()` function
2. Check Storybook is running on port 6006
3. Run `npm run build` first to catch TypeScript errors

---

**Q: How to test a specific route in story?**

Use `parameters.router`:

```typescript
export const WithRoute: Story = {
  parameters: {
    router: {
      initialEntries: ['/agents/abc123'],
    },
  },
};
```

---

**Q: Storybook not reflecting changes?**

Don't restart Storybook. Usually hot reload works. If not:
1. Check for TypeScript errors (`npm run build`)
2. Check browser console for errors
3. Ask before killing Storybook process

---

## TypeScript

**Q: Type error but code looks correct?**

1. Run `npm run build` for full error output
2. Check import order (types should come before runtime imports from same module)
3. Ensure `export type` for type-only exports

---

**Q: "Property does not exist on type" for theme?**

Ensure styled-component has correct generic:

```typescript
// ❌ Missing generic
const Button = styled.button`
  color: ${({ theme }) => theme.colors.cyan};
`;

// ✅ Theme type inferred from ThemeProvider
// (usually works automatically with styled-components setup)
```

---

## Component Development

**Q: Where should new component go — ui/, domain/, or features/?**

```
Is it a generic primitive (button, card, input)? → ui/
Does it know about agents/security/AI concepts? → domain/
Is it specific to one page? → features/
```

---

**Q: Component file getting too long?**

Extract when exceeding ~50 lines. Split into:
- Presentation component (stateless)
- Container/hook for logic
- Sub-components in same folder

---

**Q: How to add new component to existing category?**

1. Create `ComponentName/` folder with 3 files (.tsx, .styles.ts, .stories.tsx)
2. Add export to category's `index.ts`
3. Update `components-index.md`

---

## Testing

**Q: test-storybook command fails immediately?**

Storybook must be running on port 6006. Check with:

```bash
lsof -i :6006
```

If not running, ask before starting.

---

**Q: Play function not finding element?**

1. Check element is rendered (not hidden by loading state)
2. Use correct query: `getByRole`, `getByText`, `getByTestId`
3. Add `await` for async operations

```typescript
play: async ({ canvas }) => {
  // Wait for element
  await expect(canvas.getByText('Submit')).toBeInTheDocument();
  
  // Then interact
  await userEvent.click(canvas.getByRole('button'));
};
```

---

## Git

**Q: File history lost after rename?**

Always use `git mv`:

```bash
# ❌ Loses history
mv src/Old.tsx src/New.tsx

# ✅ Preserves history
git mv src/Old.tsx src/New.tsx
```

---

## Build

**Q: Build fails but no clear error?**

Run commands separately:

```bash
npx tsc --noEmit          # TypeScript only
npm run lint              # Lint only
npm run build             # Full build
```

---

**Q: "Module not found" in build but works in dev?**

Check for case sensitivity issues. Mac/Windows are case-insensitive, Linux (CI) is case-sensitive:

```typescript
// ❌ May fail in CI
import { Button } from '@ui/core/button';

// ✅ Correct case
import { Button } from '@ui/core/Button';
```

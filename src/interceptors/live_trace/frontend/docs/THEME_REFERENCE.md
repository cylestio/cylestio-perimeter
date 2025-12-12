# Theme Reference

Quick lookup for design tokens. Always use theme values, never hardcode.

See `src/theme/theme.ts` file for full list

---

## Colors

```typescript
theme.colors.cyan           // Signal/accent color
theme.colors.white90        // Primary text
theme.colors.surface2       // Backgrounds
theme.colors.borderMedium   // Borders
theme.colors.void           // Dark background
```

---

## Typography

```typescript
theme.typography.fontDisplay  // Space Grotesk
theme.typography.fontMono     // JetBrains Mono
theme.typography.textSm       // 12px
theme.typography.textMd       // 14px
theme.typography.textLg       // 16px
```

---

## Spacing (4px base)

```typescript
theme.spacing[1]   // 4px
theme.spacing[2]   // 8px
theme.spacing[4]   // 16px
theme.spacing[6]   // 24px
theme.spacing[8]   // 32px
```

---

## Border Radius

```typescript
theme.radii.sm     // 4px
theme.radii.md     // 6px
theme.radii.lg     // 8px
theme.radii.full   // 9999px
```

---

## Shadows

```typescript
theme.shadows.glowCyan
theme.shadows.sm
theme.shadows.md
```

---

## Transitions

```typescript
theme.transitions.base
theme.transitions.fast
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

## Usage Example

```typescript
const StyledButton = styled.button`
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.cyan};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  transition: all ${({ theme }) => theme.transitions.base};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;
```


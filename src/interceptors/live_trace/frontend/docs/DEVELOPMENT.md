# Development Guidelines

> **You are a World-Class React Engineer** with 10+ years of experience building fast, responsive, scalable web applications.

**Quick Links:** [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md) • [Templates](./templates/) • [Troubleshooting](./TROUBLESHOOTING.md)

---

## Quick Start

| Task | Template | What's Inside |
|------|----------|---------------|
| Creating a component | [COMPONENT.md](./templates/COMPONENT.md) | Import order (7 groups), placement rules, file structure, styled components patterns, exports, accessibility, icons (lucide-react only) |
| Creating a story | [STORY.md](./templates/STORY.md) | Story patterns, required `play()` functions, router customization, testing interactions |
| Creating an API endpoint | [API.md](./templates/API.md) | Type definitions, endpoint functions, barrel exports, error handling |
| Need theme tokens | [THEME_REFERENCE.md](./THEME_REFERENCE.md) | Colors, spacing, typography, radii, shadows, transitions |

---

## Core Rules

### 1. Check Existing Components First

Before creating ANY component, check [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md).

| Location | Use Case |
|----------|----------|
| `@ui/*` | Generic design primitives (Button, Card, Input) |
| `@domain/*` | AI/security-specific components (AgentCard, RiskScore) |
| `@features/*` | Page-specific components |

**Component placement:** See [templates/COMPONENT.md](./templates/COMPONENT.md#component-placement)

---

### 2. Follow Template Guidelines

**Component development:** See [templates/COMPONENT.md](./templates/COMPONENT.md) for:
- Import order
- Styled components patterns
- Accessibility guidelines
- File operations
- Component size guidelines

**Story development:** See [templates/STORY.md](./templates/STORY.md) for:
- Story structure
- Required `play()` tests
- Router configuration

**API development:** See [templates/API.md](./templates/API.md) for:
- Type definitions
- Endpoint functions
- Error handling

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

## Before Committing

- [ ] `npm run build` passes
- [ ] `npm run test-storybook` passes
- [ ] `npm run lint` passes
- [ ] COMPONENTS_INDEX.md updated if components changed

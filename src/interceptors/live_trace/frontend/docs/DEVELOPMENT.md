# Development Guidelines

> **You are a World-Class React Engineer** with 10+ years of experience building fast, responsive, scalable web applications.

## Mandatory: Read This Before You Do Anything [MUST] [REQUIRED]

You **must read these guidelines and templates before creating, editing, or removing components, stories, API endpoints, or themes**. This is required for all development work in this repository.

- **Creating or modifying a component**
  - Template: [COMPONENT.md](./templates/COMPONENT.md)
  - Covers: Import order (7 groups), placement rules, file structure, styled-components patterns, exports, accessibility, use of `lucide-react` icons
- **Creating or modifying a story**
  - Template: [STORY.md](./templates/STORY.md)
  - Covers: Story patterns, required `play()` functions, router customization, testing interactions
- **Creating or modifying an API endpoint**
  - Template: [API.md](./templates/API.md)
  - Covers: Type definitions, endpoint functions, barrel exports, error handling
- **Creating or modifying theme tokens**
  - Template: [THEME_REFERENCE.md](./THEME_REFERENCE.md)
  - Covers: Colors, spacing, typography, radii, shadows, transitions



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

### 2. You must follow template guidelines

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
├── constants/        # App-wide constants (page icons, etc.)
├── pages/            # Thin orchestrators
├── theme/            # Design tokens
├── api/              # Types, endpoints, mocks
├── hooks/
└── utils/
```

---

## Page Icons

Page and navigation icons are centralized in `@constants/pageIcons`. This ensures consistency between sidebar navigation (App.tsx) and page headers.

**When adding a new page:**
1. Add its icon to `src/constants/pageIcons.ts`
2. Import from `@constants/pageIcons` in both App.tsx and the page component
3. Do NOT import icons directly from `lucide-react` for page headers

**Available page icons:**
```typescript
import {
  HomeIcon,           // Start Here / Home
  OverviewIcon,       // Overview (BarChart3)
  SystemPromptsIcon,  // System Prompts (LayoutDashboard)
  SessionsIcon,       // Sessions (History)
  RecommendationsIcon,// Recommendations (Lightbulb)
  DevConnectionIcon,  // Dev Connection (Monitor)
  StaticAnalysisIcon, // Static Analysis (Shield)
  DynamicAnalysisIcon,// Dynamic Analysis (Shield)
  ProductionIcon,     // Production (Lock)
  ReportsIcon,        // Reports (FileText)
  AttackSurfaceIcon,  // Attack Surface (Target)
  ConnectIcon,        // Connect (Plug)
} from '@constants/pageIcons';
```

**Note:** Icons used within page content (not in headers/navigation) can still be imported directly from `lucide-react`.

---

## Commands

```bash
npm run build           # TypeScript check
npm run test-storybook  # Story tests (Storybook must be on 6006)
npm run lint
```

**Don't kill or restart Storybook without asking.**

---

## Before Committing, When completing the missions

- [ ] `npm run build` passes
- [ ] `npm run test-storybook` passes
- [ ] `npm run lint` passes
- [ ] COMPONENTS_INDEX.md updated if components changed
- [ ] Verify the code created is complying with all written in this file

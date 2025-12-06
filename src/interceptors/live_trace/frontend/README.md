# Cylestio UIKit

A React component library implementing the Agent Inspector design system for security monitoring applications.

## Quick Start

```bash
npm install
npm run dev        # Start dev server
npm run storybook  # View component documentation
npm run build      # Build for production
```

## Tech Stack

- React 18 + TypeScript
- Vite 7
- Styled Components
- React Router v7
- Storybook 10
- Lucide React (icons)

## Features

- Dark theme optimized for security dashboards
- 40+ components across 6 categories
- Comprehensive Storybook documentation
- TypeScript strict mode
- Design tokens for consistent theming

## Component Categories

| Category | Components |
|----------|-----------|
| Core | Button, Badge, Card, StatCard, Avatar, Text, Heading, Code, Label |
| Form | Input, Select, Checkbox, Radio, TextArea |
| Navigation | NavItem, Tabs, Breadcrumb, ToggleGroup |
| Feedback | ProgressBar, OrbLoader, Skeleton, EmptyState, Toast |
| Data Display | Table, ActivityFeed, CodeBlock, ToolChain |
| Visualization | RiskScore, LifecycleProgress, ClusterVisualization, SurfaceNode, ComplianceGauge |
| Overlays | Modal, ConfirmDialog, Tooltip, Popover, Dropdown |
| Layout | Shell, Sidebar, Main, Content, TopBar, Grid, AgentSelector, UserMenu |

## Project Structure

```
src/
├── components/          # UI Components by category
│   ├── core/           # Basic building blocks
│   ├── form/           # Form inputs
│   ├── navigation/     # Navigation components
│   ├── feedback/       # Loading & status indicators
│   ├── data-display/   # Tables, lists, code blocks
│   ├── visualization/  # Charts & visual elements
│   ├── overlays/       # Modals, tooltips, dropdowns
│   └── layout/         # Page structure components
├── pages/              # Demo application pages
├── theme/              # Design tokens & theme
└── api/mocks/          # Mock data for demos
```

See [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) for detailed structure.

## Development

```bash
# Start development server
npm run dev

# Start Storybook
npm run storybook

# Run Storybook tests
npm run test-storybook

# Lint code
npm run lint

# Format code
npm run format
```

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for contribution guidelines.

## Documentation

- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)
- [Components Guide](./docs/COMPONENTS.md)
- [API Patterns](./docs/API_PATTERNS.md)

## License

Private - Cylestio

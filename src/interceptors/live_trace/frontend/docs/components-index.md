# Components Index

> **When you add, delete, or update a component, you MUST update this index!**

> For usage examples and props, see the component's Storybook story.

---

## UI Components (`@ui/*`)

Generic design system primitives. These have no knowledge of the application domain.

| Category | Components | Description |
|----------|------------|-------------|
| `ui/core/` | Avatar, Badge, Button, Card, Code, Heading, Label, Text, TimeAgo | Basic building blocks: buttons, typography, badges, cards |
| `ui/form/` | Checkbox, FormLabel, Input, JsonEditor, Radio, RichSelect, Select, TextArea | Form inputs and controls |
| `ui/feedback/` | EmptyState, FullPageLoader, OrbLoader, ProgressBar, Skeleton, Toast | Loading states, progress indicators, notifications |
| `ui/navigation/` | Breadcrumb, NavItem, Pagination, Tabs, ToggleGroup | Navigation and filtering controls |
| `ui/overlays/` | ConfirmDialog, Drawer, Dropdown, Modal, Popover, Tooltip | Floating UI elements and dialogs |
| `ui/data-display/` | Accordion, CodeBlock, KeyValueList, StatsBar, Table, Timeline, TimelineItem | Structured data presentation |
| `ui/layout/` | Content, Main, Page, PageHeader, Section, Stack, StatsRow, ThreeColumn, TwoColumn | Page structure and grid layouts |
| `ui/icons/` | ClaudeCodeIcon, CursorIcon | Custom branded icons |

---

## Domain Components (`@domain/*`)

AI security monitoring specific. These understand application concepts like agents, sessions, security analysis.

| Category | Components | Description |
|----------|------------|-------------|
| `domain/layout/` | LocalModeIndicator, Logo, Shell, Sidebar, TopBar, UserMenu | App shell, navigation, user controls |
| `domain/agents/` | AgentCard, AgentListItem, AgentSelector, ModeIndicators | Agent display and selection |
| `domain/agent-workflows/` | AgentWorkflowCard, AgentWorkflowSelector | Workflow grouping and selection |
| `domain/sessions/` | SessionFilter, SessionsTable, SessionTags, SystemPromptFilter, TagFilter | Session listing and filtering |
| `domain/activity/` | ActivityFeed, SessionItem, ToolChain | Activity timeline and tool usage |
| `domain/analysis/` | AnalysisSessionsTable, AnalysisStatusItem, SecurityCheckItem | Analysis status indicators |
| `domain/correlation/` | CorrelateHintCard, CorrelationBadge, CorrelationSummary | Static/dynamic correlation UI |
| `domain/security/` | DynamicCheckDrawer, DynamicCheckItem, DynamicChecksGrid, FixActionCard, FrameworkBadges, GateProgress, ProductionReadiness, ScanStatusCard, SecurityCheckCard | Security scan results and gates |
| `domain/findings/` | FindingCard, FindingsTab | Security finding display |
| `domain/recommendations/` | AuditTrail, DismissModal, ProgressSummary, RecommendationCard | Security recommendations UI |
| `domain/recommendations/dashboard/` | CategoryDonut, DetectionTimeline, FileTreemap, IssueCard, SeverityProgressBar, SourceDistribution, SummaryStatsBar | Security dashboard visualizations |
| `domain/reports/` | ReportDisplay | Full security report view with tabs |
| `domain/metrics/` | ComplianceGauge, InfoCard, RiskScore, StatCard | Metrics display and gauges |
| `domain/analytics/` | ModelUsageAnalytics, TokenUsageInsights, ToolUsageAnalytics | Usage analytics panels |
| `domain/charts/` | BarChart, DistributionBar, LineChart, PieChart | Data visualization charts |
| `domain/visualization/` | ClusterVisualization, SurfaceNode | Behavioral clustering visualization |

---

## Features Components (`@features/*`)

Page-specific components. Tightly coupled to specific pages or flows.

| Category | Components | Description |
|----------|------------|-------------|
| `features/connect/` | ConnectionSuccess, ConnectIDETab | IDE connection instructions |
| `features/gathering/` | GatheringData | Data collection progress indicator |
| `features/` | SecurityChecksExplorer | Interactive security checks browser |

# Components Index

> **⚠️ IMPORTANT:** When you add, delete, or update a component, you MUST update this index!

> For development guidelines, coding patterns, and how to create new components, see [DEVELOPMENT.md](./DEVELOPMENT.md).

---

## Quick Reference

### UI Components (`@ui/*`) - Generic Design System Primitives

| Category | Components |
|----------|------------|
| `ui/core/` | Button, Card, Badge, Text, Heading, Avatar, Code, Label, TimeAgo |
| `ui/form/` | Input, Select, RichSelect, Checkbox, Radio, TextArea, FormLabel |
| `ui/feedback/` | OrbLoader, Skeleton, Toast, EmptyState, ProgressBar |
| `ui/navigation/` | NavItem, Tabs, Breadcrumb, ToggleGroup, Pagination |
| `ui/overlays/` | Modal, ConfirmDialog, Tooltip, Popover, Dropdown, Drawer |
| `ui/data-display/` | Accordion, KeyValueList, StatsBar, Table, CodeBlock, Timeline, TimelineItem |
| `ui/layout/` | Grid, Content, Main, Page, PageHeader |
| `ui/icons/` | CursorIcon, ClaudeCodeIcon |

### Domain Components (`@domain/*`) - AI Security Monitoring

| Category | Components |
|----------|------------|
| `domain/layout/` | Shell, Sidebar, TopBar, UserMenu, Logo |
| `domain/agents/` | AgentCard, AgentListItem, AgentSelector, ModeIndicators |
| `domain/workflows/` | WorkflowSelector |
| `domain/analysis/` | AnalysisStatusItem, SecurityCheckItem |
| `domain/sessions/` | SessionsTable, SystemPromptFilter |
| `domain/metrics/` | StatCard, RiskScore, ComplianceGauge |
| `domain/analytics/` | TokenUsageInsights, ModelUsageAnalytics, ToolUsageAnalytics |
| `domain/charts/` | LineChart, BarChart, PieChart, DistributionBar |
| `domain/activity/` | ActivityFeed, SessionItem, ToolChain, LifecycleProgress |
| `domain/findings/` | FindingCard, FindingsTab |
| `domain/recommendations/` | RecommendationCard, DismissModal, ProgressSummary, AuditTrail |
| `domain/recommendations/dashboard/` | SummaryStatsBar, SeverityProgressBar, IssueCard, CategoryDonut, SourceDistribution, DetectionTimeline |
| `domain/visualization/` | ClusterVisualization, SurfaceNode |

---

# UI Components

## Core Components

### Button

Primary action component with multiple variants.

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  onClick?: () => void;
}
```

**Usage:**
```tsx
<Button variant="primary" size="md">
  Click Me
</Button>

<Button variant="ghost" icon={<Plus size={16} />}>
  Add Item
</Button>
```

### Badge

Status indicators and labels.

```typescript
type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'info' | 'ai';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  children: ReactNode;
}
```

**Related Components:**
- `SeverityDot` - Colored indicator dot
- `ModePill` - Active mode indicator with pulse
- `CorrelationBadge` - Status badge for correlation states

### Card

Container component with optional header and content sections.

```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'status';
  status?: 'critical' | 'high' | 'success';
  children: ReactNode;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;       // Optional subtitle text
  centered?: boolean;      // Center-align title and subtitle
  actions?: ReactNode;     // Action buttons (hidden when centered)
}

interface CardContentProps {
  noPadding?: boolean;     // Remove default padding
  children: ReactNode;
}
```

**Compound Components:**
```tsx
// Standard header with actions
<Card>
  <Card.Header title="Card Title" actions={<Button>Action</Button>} />
  <Card.Content>
    Card content goes here
  </Card.Content>
</Card>

// Centered header with subtitle
<Card>
  <Card.Header
    title="Connect Your Agent"
    subtitle="Point your client to this URL to start capturing requests"
    centered
  />
  <Card.Content>
    Content goes here
  </Card.Content>
</Card>
```

### StatCard

Metric display card with icon and optional detail text.

```typescript
interface StatCardProps {
  icon: ReactNode;
  iconColor?: 'orange' | 'red' | 'green' | 'purple' | 'cyan';
  label: string;
  value: string | number;
  valueColor?: StatCardColor;
  detail?: string;
  size?: 'sm' | 'md';  // 'sm' = horizontal icon+label, 'md' = vertical (default)
}
```

### Avatar

User or agent avatar with initials and optional status.

```typescript
interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'user';
  status?: 'online' | 'offline' | 'error';
}
```

### Typography

Text components for consistent typography.

**Text:**
```typescript
interface TextProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'default' | 'muted' | 'inherit';
  weight?: 'normal' | 'medium' | 'semibold';
  truncate?: boolean;
  children: ReactNode;
}
```

**Heading:**
```typescript
interface HeadingProps {
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
}
```

### TimeAgo

Displays timestamps in relative format (e.g., "5m ago") with a tooltip showing the absolute date/time.

```typescript
type TimeAgoFormat = 'relative' | 'absolute';

interface TimeAgoProps {
  timestamp: string | Date | number | null | undefined;
  format?: TimeAgoFormat;  // default: 'relative'
  className?: string;
}
```

**Usage:**
```tsx
// Relative time with absolute tooltip
<TimeAgo timestamp="2025-12-11T08:58:32.328911+00:00" />
// Output: "5m ago" (hover shows "Dec 11, 2025, 8:58:32 AM")

// Absolute time with relative tooltip
<TimeAgo timestamp={new Date()} format="absolute" />

// Works with various input formats
<TimeAgo timestamp={Date.now()} />
<TimeAgo timestamp={1733906312000} />
<TimeAgo timestamp={null} />  // Shows "-"
```

---

## Form Components

### Input

Text input with label, icon, and error states.

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  icon?: ReactNode;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: 'text' | 'email' | 'password' | 'search';
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}
```

### Select

Dropdown select with options.

```typescript
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}
```

### Checkbox

Checkbox with label and indeterminate state support.

```typescript
interface CheckboxProps {
  label?: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}
```

### Radio

Radio button group.

```typescript
interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  name: string;
  onChange?: (value: string) => void;
}
```

### RichSelect

Custom dropdown select with support for rich option rendering. Useful when options need to display more than just a label (e.g., pricing, icons, descriptions).

```typescript
interface RichSelectOption<T = unknown> {
  value: string;
  label: string;
  data?: T;           // Custom data for rendering
  disabled?: boolean;
}

interface RichSelectProps<T = unknown> {
  options: RichSelectOption<T>[];
  value?: string;
  onChange?: (value: string, option: RichSelectOption<T>) => void;
  renderOption?: (option: RichSelectOption<T>, isSelected: boolean) => ReactNode;
  renderValue?: (option: RichSelectOption<T>) => ReactNode;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}
```

**Usage:**
```tsx
// Basic usage
<RichSelect
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ]}
  value={selected}
  onChange={setSelected}
/>

// With custom rendering (e.g., model pricing)
interface ModelInfo {
  input: number;
  output: number;
}

<RichSelect<ModelInfo>
  options={[
    { value: 'gpt-4o', label: 'GPT-4o', data: { input: 2.5, output: 10 } },
    { value: 'claude-sonnet', label: 'Claude Sonnet', data: { input: 3, output: 15 } },
  ]}
  value={model}
  onChange={setModel}
  renderOption={(opt) => (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{opt.label}</span>
      <span>${opt.data?.input} / ${opt.data?.output}</span>
    </div>
  )}
/>
```

**Features:**
- Keyboard navigation (Arrow keys, Enter, Escape)
- Click outside to close
- Custom option and value rendering via render props
- Scrollable dropdown for many options
- Disabled state for component and individual options

---

## Navigation Components

### NavItem

Sidebar navigation item with icon, label, and badge.

```typescript
interface NavItemProps {
  icon?: ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  badge?: string | number;
  badgeColor?: 'orange' | 'red' | 'cyan';
  onClick?: () => void;
  disabled?: boolean;
}
```

### Tabs

Tab navigation with counts.

```typescript
interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}
```

### Breadcrumb

Navigation breadcrumb trail.

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}
```

### ToggleGroup

Selectable button group for single or multi-select options.

```typescript
interface ToggleOption {
  id: string;
  label: string;
  active?: boolean;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  onChange: (optionId: string) => void;
  multiSelect?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
// Single select
<ToggleGroup
  options={[
    { id: 'all', label: 'All', active: true },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
  ]}
  onChange={(id) => setActiveFilter(id)}
/>

// Multi select
<ToggleGroup
  options={filters}
  onChange={(id) => toggleFilter(id)}
  multiSelect
/>
```

### Pagination

Page navigation controls with previous/next buttons.

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}
```

**Usage:**
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

**Notes:**
- Returns `null` if `totalPages <= 1` (nothing to paginate)
- Previous button disabled on page 1
- Next button disabled on last page

---

## Feedback Components

### OrbLoader

Animated loading indicator based on the Agent Inspector logo orb.

```typescript
type OrbLoaderSize = 'sm' | 'md' | 'lg' | 'xl';
type OrbLoaderVariant = 'morph' | 'whip';

interface OrbLoaderProps {
  size?: OrbLoaderSize;
  variant?: OrbLoaderVariant;
  className?: string;
}

interface FullPageLoaderProps {
  text?: string;
  variant?: OrbLoaderVariant;
}
```

**Variants:**
- `morph` (default): Circle transforms to square and back while spinning
- `whip`: Circle accelerates rapidly then decelerates

**Usage:**
```tsx
<OrbLoader size="md" />
<OrbLoader size="lg" variant="whip" />
<FullPageLoader text="Loading..." />
```

### Skeleton

Content placeholder during loading.

```typescript
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}
```

### ProgressBar

Progress indicator with percentage.

```typescript
interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}
```

### Toast

Notification toast messages.

```typescript
interface ToastProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  onClose?: () => void;
}
```

---

## Data Display Components

### Accordion

Collapsible content section with icon and chevron indicator.

```typescript
interface AccordionProps {
  title: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
<Accordion
  title="System Prompt"
  icon={<Bot size={14} />}
  defaultOpen={false}
>
  You are a helpful assistant...
</Accordion>
```

### KeyValueList

Displays a list of key-value pairs with consistent styling. Useful for metadata, configuration details, or any labeled information.

```typescript
interface KeyValuePair {
  key: string;
  value: ReactNode;
  mono?: boolean;  // Use monospace font for value
}

interface KeyValueListProps {
  items: KeyValuePair[];
  size?: 'sm' | 'md';
  className?: string;
}
```

**Usage:**
```tsx
// Basic metadata display
<KeyValueList
  items={[
    { key: 'Session ID', value: 'sess_a7f3b291c4e8d5f6', mono: true },
    { key: 'Model', value: 'claude-sonnet-4-20250514', mono: true },
    { key: 'Provider', value: 'Anthropic' },
  ]}
/>

// With badges as values
<KeyValueList
  items={[
    { key: 'Session ID', value: 'sess_abc123', mono: true },
    {
      key: 'Status',
      value: (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="success">ACTIVE</Badge>
          <Badge variant="info">ANTHROPIC</Badge>
        </div>
      ),
    },
  ]}
  size="sm"
/>
```

### StatsBar

Horizontal bar displaying summary statistics with icons, values, and labels. Supports dividers to group related stats.

```typescript
type StatColor = 'cyan' | 'green' | 'orange' | 'red' | 'purple';

interface Stat {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconColor?: StatColor;
  valueColor?: StatColor;
}

interface StatsBarProps {
  stats: (Stat | 'divider')[];
  className?: string;
}
```

**Usage:**
```tsx
// Basic stats bar
<StatsBar
  stats={[
    { icon: <Zap size={18} />, value: '1,234', label: 'Total Executions', iconColor: 'cyan' },
    { icon: <Clock size={18} />, value: '150ms', label: 'Avg Duration', iconColor: 'orange' },
    { icon: <CheckCircle size={18} />, value: '98.5%', label: 'Success Rate', iconColor: 'green' },
  ]}
/>

// With dividers to group stats
<StatsBar
  stats={[
    { icon: <Coins size={18} />, value: '45.2K', label: 'Total Tokens', iconColor: 'cyan' },
    { icon: <TrendingUp size={18} />, value: '$12.50', label: 'Total Cost', iconColor: 'orange', valueColor: 'orange' },
    'divider',
    { icon: <Layers size={18} />, value: '3', label: 'Models Used', iconColor: 'purple', valueColor: 'purple' },
  ]}
/>
```

### Table

Data table with sorting and row selection.

```typescript
interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRow?: T;
  loading?: boolean;
  emptyState?: ReactNode;
  keyExtractor?: (row: T) => string;
}
```

### ActivityFeed

List of activity events.

```typescript
interface ActivityItem {
  id: string;
  type: 'fixed' | 'found' | 'session' | 'scan';
  title: string;
  detail?: string;
  timestamp: Date | string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  onItemClick?: (item: ActivityItem) => void;
}
```

### SessionItem

Individual session display with active state highlighting.

```typescript
type SessionStatus = 'ACTIVE' | 'COMPLETE' | 'ERROR';

interface SessionItemProps {
  agentId: string;           // Agent ID for avatar color hash
  agentName: string;         // Display name for the agent
  sessionId: string;         // Session ID (usually truncated)
  status: SessionStatus;     // Session status
  isActive: boolean;         // Highlights with cyan border when true
  duration: string;          // Formatted duration (e.g., "1h 30m")
  lastActivity: string;      // Relative time (e.g., "2d ago")
  hasErrors?: boolean;       // Shows error state
  onClick?: () => void;      // Click handler
}
```

**Usage:**
```tsx
<SessionItem
  agentId="prompt-a8b9ef35309f"
  agentName="Prompt A8b9ef35309f"
  sessionId="f4f68af8"
  status="ACTIVE"
  isActive={true}
  duration="<1m"
  lastActivity="just now"
/>
```

### CodeBlock

Syntax-highlighted code display.

```typescript
interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  highlightLines?: number[];
  showLineNumbers?: boolean;
}
```

### Timeline

Event timeline container that renders a list of events with system prompt accordion.

```typescript
interface TimelineProps {
  events: TimelineEvent[];
  sessionId?: string;
  systemPrompt?: string | null;
  onReplay?: (eventId: string) => void;
  className?: string;
}
```

**Usage:**
```tsx
<Timeline
  events={events}
  sessionId="session-123"
  systemPrompt="You are a helpful assistant"
  onReplay={(eventId) => openReplayPanel(eventId)}
/>
```

### TimelineItem

Individual timeline event bubble with content rendering for different event types (llm.call.start, llm.call.finish, tool.execution, tool.result). Supports a `response` variant for displaying replay responses.

```typescript
interface TimelineEvent {
  id?: string;
  event_type: string;
  timestamp: string;
  level?: string;
  description?: string;
  details?: Record<string, unknown>;
}

interface TimelineItemProps {
  event: TimelineEvent;
  sessionId?: string;
  onReplay?: (eventId: string) => void;
  startTime?: Date;
  durationMs?: number;
  isFirstEvent?: boolean;
  variant?: 'default' | 'response';
  showRawToggle?: boolean;
}
```

**Usage:**
```tsx
// Default variant (full timeline item with time gutter)
<TimelineItem
  event={event}
  sessionId="session-123"
  onReplay={(id) => openReplayPanel(id)}
  startTime={startTime}
  durationMs={5000}
  isFirstEvent={false}
/>

// Response variant (simplified, for displaying replay responses)
<TimelineItem
  event={responseEvent}
  variant="response"
  showRawToggle={true}
/>
```

**Variants:**
- `default`: Full timeline item with time gutter, replay button, direction icons
- `response`: Simplified layout for response display, no time gutter or replay button

**Note:** Metadata badges (model, tokens, cost, elapsed time) should be rendered separately outside of TimelineItem using the Badge component.

---

## Icons

### CursorIcon

Cursor IDE logo icon as an image component.

```typescript
interface CursorIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  size?: number;  // Width and height in pixels (default: 24)
}
```

**Usage:**
```tsx
<CursorIcon size={24} />
<CursorIcon size={48} style={{ opacity: 0.8 }} />
```

### ClaudeCodeIcon

Claude Code logo icon as an image component.

```typescript
interface ClaudeCodeIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  size?: number;  // Width and height in pixels (default: 24)
}
```

**Usage:**
```tsx
<ClaudeCodeIcon size={24} />
<ClaudeCodeIcon size={32} />
```

---

## Findings Components

### FindingCard

Expandable card displaying a security finding with severity, status, and details.

```typescript
interface FindingCardProps {
  finding: Finding;           // Finding object with all details
  defaultExpanded?: boolean;  // Start expanded (default: false)
  className?: string;
}

// Finding type (from @api/types/findings)
interface Finding {
  finding_id: string;
  session_id: string;
  agent_id: string;
  file_path: string;
  line_start?: number;
  line_end?: number;
  finding_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description?: string;
  evidence: { code_snippet?: string; context?: string };
  owasp_mapping: string[];
  status: 'OPEN' | 'FIXED' | 'IGNORED';
  created_at: string;
  updated_at: string;
}
```

**Usage:**
```tsx
<FindingCard
  finding={{
    finding_id: 'find_001',
    title: 'Potential prompt injection vulnerability',
    severity: 'HIGH',
    status: 'OPEN',
    file_path: 'src/handlers/auth.py',
    line_start: 42,
    // ...other fields
  }}
  defaultExpanded={false}
/>
```

### FindingsTab

Complete findings view with summary, filters, and list of FindingCards.

```typescript
interface FindingsTabProps {
  findings: Finding[];          // Array of findings to display
  summary?: FindingsSummary;    // Summary with counts by severity/status
  isLoading?: boolean;          // Show loading state
  error?: string;               // Show error message
  className?: string;
}

interface FindingsSummary {
  agent_id: string;
  total_findings: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  open_count: number;
  fixed_count: number;
  ignored_count: number;
}
```

**Usage:**
```tsx
<FindingsTab
  findings={findings}
  summary={{
    total_findings: 10,
    by_severity: { CRITICAL: 2, HIGH: 3, MEDIUM: 4, LOW: 1 },
    open_count: 6,
    fixed_count: 3,
    ignored_count: 1,
  }}
/>
```

---

## Workflows Components

### WorkflowSelector

Dropdown selector for filtering by workflow/project. Shows "All Workflows" option plus individual workflows with agent counts.

```typescript
interface Workflow {
  id: string | null;  // null = "Unassigned"
  name: string;
  agentCount: number;
}

interface WorkflowSelectorProps {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;  // null = show all
  onSelect: (workflow: Workflow | null) => void;
  label?: string;      // Default: "Workflow"
  collapsed?: boolean; // Show icon only
}
```

**Usage:**
```tsx
<WorkflowSelector
  workflows={[
    { id: 'ecommerce', name: 'E-Commerce Agents', agentCount: 5 },
    { id: null, name: 'Unassigned', agentCount: 2 },
  ]}
  selectedWorkflow={selectedWorkflow}
  onSelect={setSelectedWorkflow}
/>
```

---

## Analysis Components

### AnalysisStatusItem

Sidebar navigation item for analysis status (Static Scan, Dynamic Scan, Recommendations). Shows a ring indicator with an icon inside, with spinning animation for running state. Supports React Router navigation via `to` prop.

```typescript
type AnalysisStatus = 'ok' | 'warning' | 'critical' | 'inactive' | 'running';

interface AnalysisStatusItemProps {
  label: string;              // Display label (e.g., "Static Scan")
  status: AnalysisStatus;     // Status determines color and icon
  count?: number;             // Optional issue count shown as badge
  stat?: string;              // Optional stat text (e.g., "2 issues")
  collapsed?: boolean;        // Show only ring when sidebar collapsed
  isRecommendation?: boolean; // Use purple styling for recommendations
  active?: boolean;           // Whether this item is currently active/selected
  disabled?: boolean;         // Disable interaction (grays out)
  to?: string;                // React Router navigation path
  onClick?: () => void;       // Click handler (fallback when no `to`)
}
```

**Status Colors:**
- `ok` - Green ring with check icon
- `warning` - Orange ring with alert icon
- `critical` - Red ring with X icon
- `inactive` - Gray ring with minus icon
- `running` - Gray spinning ring with loader icon

**Usage:**
```tsx
// Static analysis with navigation
<AnalysisStatusItem
  label="Static Analysis"
  status="ok"
  collapsed={sidebarCollapsed}
  to={`/agent-workflow/${agentWorkflowId}/static-analysis`}
  active={location.pathname === `/agent-workflow/${agentWorkflowId}/static-analysis`}
/>

// Dynamic scan with warnings
<AnalysisStatusItem
  label="Dynamic Scan"
  status="warning"
  count={3}
  stat="3 issues"
  collapsed={sidebarCollapsed}
/>

// Recommendations (purple styling)
<AnalysisStatusItem
  label="Recommendations"
  status="ok"
  count={5}
  isRecommendation
  collapsed={sidebarCollapsed}
/>

// Running analysis
<AnalysisStatusItem
  label="Static Scan"
  status="running"
  collapsed={sidebarCollapsed}
/>

// Disabled (e.g., for unassigned workflows)
<AnalysisStatusItem
  label="Static Analysis"
  status="inactive"
  disabled
  collapsed={sidebarCollapsed}
/>
```

### SecurityCheckItem

Sidebar navigation item for security check timeline (Dev Connection, Static Analysis, Dynamic Analysis, Production). Shows a ring indicator with status icon, optional timeline connectors, and supports locked/premium states. Uses React Router navigation via `to` prop.

```typescript
type SecurityCheckStatus = 'ok' | 'warning' | 'critical' | 'inactive' | 'running' | 'locked' | 'premium';

interface SecurityCheckItemProps {
  label: string;                // Display label (e.g., "Static Analysis")
  status: SecurityCheckStatus;  // Status determines color and icon
  count?: number;               // Optional issue count shown as badge
  stat?: string;                // Optional stat text (e.g., "2 issues")
  collapsed?: boolean;          // Show only ring when sidebar collapsed
  active?: boolean;             // Whether this item is currently active/selected
  disabled?: boolean;           // Disable interaction (grays out)
  to?: string;                  // React Router navigation path
  onClick?: () => void;         // Click handler (fallback when no `to`)
  showConnectorAbove?: boolean; // Show timeline connector above
  showConnectorBelow?: boolean; // Show timeline connector below
  isFirst?: boolean;            // First item in timeline (hides top connector)
  isLast?: boolean;             // Last item in timeline (hides bottom connector)
  isLocked?: boolean;           // Shows locked state with tooltip
  icon?: ReactNode;             // Custom icon override
  lockedTooltip?: string;       // Tooltip content when locked
}
```

**Status Colors:**
- `ok` - Green ring with check icon
- `warning` - Orange ring with alert icon
- `critical` - Red ring with X icon
- `inactive` - Gray ring with minus icon
- `running` - Cyan spinning ring (animated)
- `locked` - Gray ring with lock icon
- `premium` - Gold ring with lock icon (glowing animation)

**Usage:**
```tsx
// Security checks timeline
<SecurityCheckItem
  label="Dev"
  status="ok"
  isFirst
  showConnectorBelow
/>
<SecurityCheckItem
  label="Static Analysis"
  status="ok"
  showConnectorAbove
  showConnectorBelow
  to={`/agent/${agentId}/static-analysis`}
  active={location.pathname === `/agent/${agentId}/static-analysis`}
/>
<SecurityCheckItem
  label="Dynamic Analysis"
  status="warning"
  count={3}
  showConnectorAbove
  showConnectorBelow
/>
<SecurityCheckItem
  label="Production"
  status="locked"
  isLocked
  isLast
  showConnectorAbove
  lockedTooltip="Complete all security checks to unlock"
/>

// Premium unlocked state
<SecurityCheckItem
  label="Production"
  status="premium"
  stat="Ready to deploy"
  isLast
  showConnectorAbove
/>
```

---

## Sessions Components

### SessionsTable

Reusable data table for displaying session lists with status, metrics, and navigation.

```typescript
interface SessionsTableProps {
  sessions: SessionListItem[];  // Session data from API
  workflowId: string;           // For generating session links
  loading?: boolean;            // Show loading state
  emptyMessage?: string;        // Custom empty state message
  showAgentColumn?: boolean;    // Show agent ID column (default: false)
}

// SessionListItem (from @api/types/session)
interface SessionListItem {
  id: string;
  id_short: string;
  agent_id: string;
  agent_id_short: string | null;
  workflow_id: string | null;
  created_at: string;
  last_activity: string;
  last_activity_relative: string;
  duration_minutes: number;
  is_active: boolean;
  is_completed: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  message_count: number;
  tool_uses: number;
  errors: number;
  total_tokens: number;
  error_rate: number;
}
```

**Columns:**
- ID - Session ID (short) with link to session detail
- Agent (optional) - Agent ID with link to agent detail
- Status - Badge showing ACTIVE/INACTIVE/COMPLETED
- Duration - Session duration in minutes
- Messages - Message count
- Tokens - Total token usage
- Tools - Tool call count
- Error Rate - Percentage of errors
- Last Activity - Relative timestamp

**Usage:**
```tsx
// Basic usage
<SessionsTable
  sessions={sessions}
  workflowId={workflowId}
  emptyMessage="No sessions found."
/>

// With agent column (for workflow-level views)
<SessionsTable
  sessions={sessions}
  workflowId={workflowId}
  showAgentColumn
  loading={isLoading}
/>
```

### SystemPromptFilter

Filter toggle group for selecting sessions by system prompt. Uses ToggleGroup internally.

```typescript
interface SystemPromptOption {
  id: string;
  id_short: string;
  sessionCount: number;
}

interface SystemPromptFilterProps {
  systemPrompts: SystemPromptOption[];  // List of system prompts with counts
  selectedId: string | null;            // Selected ID or null for "All"
  onSelect: (id: string | null) => void;
  className?: string;
}
```

**Usage:**
```tsx
<SystemPromptFilter
  systemPrompts={[
    { id: 'sp-abc123', id_short: 'abc123def456', sessionCount: 42 },
    { id: 'sp-xyz789', id_short: 'xyz789ghi012', sessionCount: 18 },
  ]}
  selectedId={selectedSystemPrompt}
  onSelect={setSelectedSystemPrompt}
/>
```

**Notes:**
- Returns `null` when there's 0 or 1 system prompt (no filtering needed)
- Shows "All (N)" option plus one option per system prompt with session counts
- Selecting "All" calls `onSelect(null)`

---

## Visualization Components

### RiskScore

Circular risk score indicator.

```typescript
interface RiskScoreProps {
  value: number; // 0-100
  variant?: 'hero' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  change?: number;
}
```

---

## Chart Components

### LineChart

Time-series line chart using Recharts. Displays data points connected by a smooth line with interactive tooltips.

```typescript
type ChartColor = 'cyan' | 'purple' | 'red' | 'green' | 'orange';

interface LineChartDataPoint {
  date: string;      // Date string (e.g., "2025-12-12")
  value: number;     // Numeric value for the Y-axis
  label?: string;    // Optional label for tooltip
}

interface LineChartProps {
  data: LineChartDataPoint[];
  color?: ChartColor;                    // Line color (default: 'cyan')
  height?: number;                       // Chart height in pixels (default: 200)
  formatValue?: (value: number) => string;  // Y-axis value formatter
  formatDate?: (date: string) => string;    // X-axis date formatter
  emptyMessage?: string;                 // Message when no data
  className?: string;
}
```

**Usage:**
```tsx
// Sessions over time chart
<LineChart
  data={[
    { date: '2025-12-10', value: 15 },
    { date: '2025-12-11', value: 23 },
    { date: '2025-12-12', value: 18 },
  ]}
  color="purple"
  height={200}
  formatValue={(v) => `${v} sessions`}
  emptyMessage="No session data yet"
/>

// Error rate trend
<LineChart
  data={errorRateData}
  color="red"
  formatValue={(v) => `${v.toFixed(1)}%`}
/>
```

### BarChart

Horizontal or vertical bar chart using Recharts. Displays categorical data with interactive tooltips.

```typescript
type BarChartColor = 'cyan' | 'purple' | 'red' | 'green' | 'orange';

interface BarChartDataPoint {
  name: string;           // Category label
  value: number;          // Numeric value
  color?: BarChartColor;  // Per-bar color override
}

interface BarChartProps {
  data: BarChartDataPoint[];
  color?: BarChartColor;                    // Default bar color (default: 'cyan')
  height?: number;                          // Chart height in pixels (default: 200)
  horizontal?: boolean;                     // Horizontal bars (default: false)
  formatValue?: (value: number) => string;  // Value formatter for tooltips
  emptyMessage?: string;                    // Message when no data
  maxBars?: number;                         // Limit number of bars (default: 10)
  className?: string;
}
```

**Usage:**
```tsx
// Horizontal tool usage chart
<BarChart
  data={[
    { name: 'web_search', value: 42 },
    { name: 'code_editor', value: 28 },
    { name: 'file_reader', value: 15 },
  ]}
  color="green"
  height={200}
  horizontal
  maxBars={10}
  formatValue={(v) => `${v} calls`}
  emptyMessage="No tool usage data"
/>

// Vertical chart with custom colors per bar
<BarChart
  data={[
    { name: 'Critical', value: 3, color: 'red' },
    { name: 'High', value: 8, color: 'orange' },
    { name: 'Medium', value: 15, color: 'purple' },
    { name: 'Low', value: 25, color: 'cyan' },
  ]}
  height={250}
/>
```

### DistributionBar

Horizontal stacked bar showing distribution of segments with labels and percentages. Useful for showing proportional breakdowns (e.g., input vs output tokens, request distribution by model).

```typescript
type DistributionColor = 'cyan' | 'purple' | 'green' | 'orange' | 'red';

interface DistributionSegment {
  name: string;
  value: number;
  color: DistributionColor;
}

interface DistributionBarProps {
  segments: DistributionSegment[];
  formatValue?: (value: number) => string;
  showPercent?: boolean;    // Show percentage labels (default: true)
  className?: string;
}
```

**Usage:**
```tsx
// Token distribution (input vs output)
<DistributionBar
  segments={[
    { name: 'Input', value: 45000, color: 'cyan' },
    { name: 'Output', value: 15000, color: 'purple' },
  ]}
  formatValue={(v) => `${(v / 1000).toFixed(1)}K`}
/>

// Model request distribution
<DistributionBar
  segments={[
    { name: 'claude-sonnet-4', value: 150, color: 'cyan' },
    { name: 'gpt-4o', value: 80, color: 'purple' },
    { name: 'claude-haiku', value: 45, color: 'green' },
  ]}
  formatValue={(v) => `${v}`}
/>
```

**Notes:**
- LineChart and BarChart show an empty state with icon when `data` is empty
- Charts are responsive and fill their container width
- Tooltips show formatted values and labels
- Data is automatically sorted by value (descending) for BarChart

### LifecycleProgress

Security lifecycle stage indicator.

```typescript
interface LifecycleStage {
  id: string;
  label: string;
  icon: ReactNode;
  status: 'pending' | 'active' | 'completed';
  stat?: string;
}

interface LifecycleProgressProps {
  stages: LifecycleStage[];
}
```

### ComplianceGauge

Compliance percentage gauge.

```typescript
interface ComplianceGaugeProps {
  value: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

---

## Overlay Components

### Modal

Dialog modal with header, content, and footer.

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
}
```

### ConfirmDialog

Confirmation dialog for destructive actions.

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'default' | 'danger' | 'warning';
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}
```

### Tooltip

Hover tooltip.

```typescript
interface TooltipProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactElement;
}
```

### Dropdown

Dropdown menu with items.

```typescript
interface DropdownItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
}
```

### Drawer

Slide-out panel (sideover) from any edge of the screen with optional overlay and click-outside-to-close support.

```typescript
type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  position?: DrawerPosition;       // default: 'right'
  size?: DrawerSize;               // default: 'md'
  showOverlay?: boolean;           // default: true
  closeOnOverlayClick?: boolean;   // default: true
  closeOnEsc?: boolean;            // default: true
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}
```

**Sizes:**
- `sm` - 320px (horizontal) / 200px (vertical)
- `md` - 400px (horizontal) / 300px (vertical)
- `lg` - 500px (horizontal) / 400px (vertical)
- `xl` - 640px (horizontal) / 500px (vertical)

**Usage:**
```tsx
// Basic drawer from right
<Drawer
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Settings"
>
  <p>Drawer content goes here</p>
</Drawer>

// Drawer with footer and custom options
<Drawer
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  position="left"
  size="lg"
  closeOnOverlayClick={false}
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save</Button>
    </>
  }
>
  <Form>...</Form>
</Drawer>

// Drawer without overlay (content behind is visible)
<Drawer
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Preview"
  showOverlay={false}
>
  <Preview />
</Drawer>
```

---

## Layout Components

### Page

Page layout wrapper that provides consistent max-width (1400px) and padding across all pages.

```typescript
interface PageProps {
  children: ReactNode;
  fullWidth?: boolean;  // When true, removes max-width constraint
  className?: string;
}
```

**Usage:**
```tsx
// Standard page (1400px max-width with padding)
<Page>
  <PageHeader title="Dashboard" />
  <Section>...</Section>
</Page>

// Full-width page (e.g., SessionDetail with sidebar)
<Page fullWidth>
  <SessionLayout>
    <Sidebar>...</Sidebar>
    <Main>...</Main>
  </SessionLayout>
</Page>
```

**Notes:**
- All pages should use `<Page>` as their top-level wrapper
- Default: 1400px max-width, centered, with `spacing[6]` (24px) padding
- `fullWidth={true}`: No max-width constraint, no padding (for custom layouts)

### PageHeader

Page header with title, optional icon, description, and actions.

```typescript
interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  actions?: ReactNode;
}
```

**Usage:**
```tsx
// Simple header
<PageHeader
  title="Dashboard"
  description="Overview of agent security monitoring"
/>

// With icon
<PageHeader
  icon={<FileText size={24} />}
  title="Reports"
  description="Generate and view security reports"
/>

// With icon and actions
<PageHeader
  icon={<Target size={24} />}
  title="Attack Surface"
  description="Analyze potential attack vectors"
  actions={
    <>
      <Badge variant="medium">12 vectors</Badge>
      <Button icon={<Shield size={16} />}>Scan Now</Button>
    </>
  }
/>
```

### Shell

Root layout container.

```tsx
<Shell>
  <Sidebar>...</Sidebar>
  <Main>
    {/* Single item = title, multiple items = breadcrumb trail */}
    <TopBar breadcrumb={[{ label: 'Page Title' }]} />
    <Content>...</Content>
  </Main>
</Shell>
```

### AgentListItem

Individual agent display for sidebar list.

```typescript
interface AgentListItemProps {
  agent: APIAgent;          // Agent data from dashboard API
  active?: boolean;         // Highlights when on agent's detail page
  collapsed?: boolean;      // Show only avatar when sidebar collapsed
  onClick?: () => void;     // Click handler for navigation
}
```

**Usage:**
```tsx
<AgentListItem
  agent={agent}
  active={currentAgentId === agent.id}
  collapsed={sidebarCollapsed}
  onClick={() => navigate(`/dashboard/agent/${agent.id}`)}
/>
```

### AgentSelector

Agent selection dropdown in sidebar.

```typescript
interface Agent {
  id: string;
  name: string;
  initials: string;
  status: 'online' | 'offline' | 'error';
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent;
  onSelect: (agent: Agent) => void;
  collapsed?: boolean;
}
```

### UserMenu

User profile menu in sidebar.

```typescript
interface User {
  name: string;
  initials: string;
  role: string;
}

interface UserMenuProps {
  user: User;
  onLogout?: () => void;
  onSettings?: () => void;
  collapsed?: boolean;
}
```

---

# Features Components


## GatheringData

Progress indicator shown when waiting for more session data before analysis can be performed.

```typescript
interface GatheringDataProps {
  /** Current number of sessions collected */
  currentSessions: number;
  /** Minimum sessions required for analysis */
  minSessionsRequired: number;
  /** Title text (default: "Analyzing Agent Behavior") */
  title?: string;
  /** Description text */
  description?: string;
  /** Hint text shown below progress bar (default: "More sessions improve accuracy") */
  hint?: string;
}
```

**Usage:**
```tsx
// Default - analyzing agent behavior
<GatheringData
  currentSessions={2}
  minSessionsRequired={5}
/>

// Custom content
<GatheringData
  currentSessions={3}
  minSessionsRequired={5}
  title="Building Behavioral Profile"
  description="Behavioral analysis requires session data to identify patterns."
  hint="Analysis improves with more data"
/>
```


## Recommendations Components

### DismissModal

Modal dialog for dismissing security recommendations with reason tracking.

```typescript
type DismissType = 'DISMISSED' | 'IGNORED';

interface DismissModalProps {
  recommendationId: string;
  defaultType?: DismissType;  // Pre-select dismiss type (default: 'DISMISSED')
  onConfirm: (type: DismissType, reason: string) => void;
  onCancel: () => void;
}
```

**Dismiss Types:**
- `DISMISSED` - Risk Accepted: User acknowledges the risk but chooses not to fix
- `IGNORED` - False Positive: Issue is not actually a security concern in context

**Usage:**
```tsx
<DismissModal
  recommendationId="REC-12345"
  defaultType="IGNORED"  // Pre-select "False Positive"
  onConfirm={(type, reason) => dismissRecommendation(id, type, reason)}
  onCancel={() => setModalOpen(false)}
/>
```

---

## Recommendations Dashboard Components

Components for the Security Dashboard that visualizes and manages security recommendations.

### SummaryStatsBar

Displays gate statuses and severity counts in a grid layout.

```typescript
interface SummaryStatsBarProps {
  recommendations: Recommendation[];
  gateStatus: GateStatus;
  blockingCritical: number;
  blockingHigh: number;
}
```

**Features:**
- Shows Static Analysis Gate and Dynamic Analysis Gate status separately
- Displays counts for Critical, High, Medium, Low severities
- Color-coded severity indicators

### SeverityProgressBar

Multi-segment progress bar showing resolution progress by severity.

```typescript
interface SeverityProgressBarProps {
  recommendations: Recommendation[];
}
```

**Features:**
- Single progress track with colored segments for resolved issues
- Grid showing resolved/total counts per severity
- Status text showing completion or remaining count

### IssueCard

Expandable card for displaying a security issue with inline details.

```typescript
interface IssueCardProps {
  recommendation: Recommendation;
  onCopyCommand?: () => void;
  onMarkFixed?: () => void;
  onDismiss?: (type: 'DISMISSED' | 'IGNORED') => void;
  defaultExpanded?: boolean;
}
```

**Features:**
- Collapsible with inline details (no navigation away)
- Shows severity, source type (Static/Dynamic), CVSS score
- Resolution status badge for resolved issues (Fixed, Risk Accepted, False Positive)
- Resolution timestamp
- Code snippet with copy button
- Fix command copy button

**Usage:**
```tsx
<IssueCard
  recommendation={rec}
  onMarkFixed={() => markFixed(rec.id)}
  onDismiss={(type) => openDismissModal(rec.id, type)}
/>
```

### CategoryDonut

SVG donut chart showing issue distribution by security category.

```typescript
interface CategoryDonutProps {
  recommendations: Recommendation[];
  selectedCategory?: SecurityCheckCategory | null;
  onCategoryClick?: (category: SecurityCheckCategory | null) => void;
}
```

**Features:**
- Interactive segments with hover effects
- Click to filter issues by category
- Synchronized hover between chart and legend
- Center displays total issue count

### SourceDistribution

Two-column layout showing issues grouped by Static and Dynamic analysis sources.

```typescript
interface SourceDistributionProps {
  recommendations: Recommendation[];
  selectedSource?: string | null;
  onSourceClick?: (source: string | null, type: 'STATIC' | 'DYNAMIC') => void;
}
```

**Features:**
- Separates Static Analysis (by file) and Dynamic Analysis (by agent/endpoint)
- Severity badges per source showing Critical/High/Medium/Low counts
- Click to filter issues by source

### DetectionTimeline

SVG line chart showing issues detected vs resolved over time.

```typescript
interface DetectionTimelineProps {
  recommendations: Recommendation[];
}
```

**Features:**
- Shows last 7 days of activity
- Two lines: Detected (orange) and Resolved (green)
- Proper axis labels and legend

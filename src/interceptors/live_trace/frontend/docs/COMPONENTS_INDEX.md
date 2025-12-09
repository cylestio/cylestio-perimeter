# Components Index

> **⚠️ IMPORTANT:** When you add, delete, or update a component, you MUST update this index!

> For development guidelines, coding patterns, and how to create new components, see [DEVELOPMENT.md](./DEVELOPMENT.md).

---

## Quick Reference

### UI Components (`@ui/*`) - Generic Design System Primitives

| Category | Components |
|----------|------------|
| `ui/core/` | Button, Card, Badge, Text, Heading, Avatar, Code, Label |
| `ui/form/` | Input, Select, Checkbox, Radio, TextArea, FormLabel |
| `ui/feedback/` | OrbLoader, Skeleton, Toast, EmptyState, ProgressBar |
| `ui/navigation/` | NavItem, Tabs, Breadcrumb, ToggleGroup |
| `ui/overlays/` | Modal, ConfirmDialog, Tooltip, Popover, Dropdown |
| `ui/data-display/` | Table, CodeBlock |
| `ui/layout/` | Grid, Content, Main, PageHeader |

### Domain Components (`@domain/*`) - AI Security Monitoring

| Category | Components |
|----------|------------|
| `domain/layout/` | Shell, Sidebar, TopBar, UserMenu, Logo |
| `domain/agents/` | AgentCard, AgentListItem, AgentSelector, ModeIndicators |
| `domain/workflows/` | WorkflowSelector |
| `domain/analysis/` | AnalysisStatusItem |
| `domain/sessions/` | SessionsTable |
| `domain/metrics/` | StatCard, RiskScore, ComplianceGauge |
| `domain/activity/` | ActivityFeed, SessionItem, ToolChain, LifecycleProgress |
| `domain/findings/` | FindingCard, FindingsTab |
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

Sidebar navigation item for analysis status (Static Scan, Dynamic Scan, Recommendations). Shows a ring indicator with an icon inside, with spinning animation for running state.

```typescript
type AnalysisStatus = 'ok' | 'warning' | 'critical' | 'inactive' | 'running';

interface AnalysisStatusItemProps {
  label: string;              // Display label (e.g., "Static Scan")
  status: AnalysisStatus;     // Status determines color and icon
  count?: number;             // Optional issue count shown as badge
  stat?: string;              // Optional stat text (e.g., "2 issues")
  collapsed?: boolean;        // Show only ring when sidebar collapsed
  isRecommendation?: boolean; // Use purple styling for recommendations
  onClick?: () => void;       // Click handler
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
// Static scan completed OK
<AnalysisStatusItem
  label="Static Scan"
  status="ok"
  collapsed={sidebarCollapsed}
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

---

## Layout Components

### PageHeader

Page header with title, optional description, and actions.

```typescript
interface PageHeaderProps {
  title: string;
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

// With actions
<PageHeader
  title="Findings"
  description="Security vulnerabilities detected"
  actions={
    <Button icon={<Plus size={16} />}>New Scan</Button>
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

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';

import type { DynamicSecurityCheck } from '@api/types/security';

import { DynamicCheckItem } from './DynamicCheckItem';

const meta: Meta<typeof DynamicCheckItem> = {
  title: 'Domain/Security/DynamicCheckItem',
  component: DynamicCheckItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DynamicCheckItem>;

// Mock data
const passedCheck: DynamicSecurityCheck = {
  check_id: 'RESOURCE_001_TOKEN_BOUNDS',
  agent_id: 'agent-123',
  category_id: 'RESOURCE_MANAGEMENT',
  check_type: 'token_bounds',
  status: 'passed',
  title: 'Token Budget Usage',
  value: '12,500 / 50,000',
  description: 'Validates that per-session token usage stays within the allowed range.',
};

const warningCheck: DynamicSecurityCheck = {
  check_id: 'BEHAV_002_OUTLIER_RATE',
  agent_id: 'agent-123',
  category_id: 'BEHAVIORAL',
  check_type: 'outlier_rate',
  status: 'warning',
  title: 'Behavioral Outlier Rate',
  value: '15%',
  description: 'Tracks the share of sessions that diverge from established behavioral patterns.',
};

const criticalCheck: DynamicSecurityCheck = {
  check_id: 'PII_001_DETECTION',
  agent_id: 'agent-123',
  category_id: 'PRIVACY_COMPLIANCE',
  check_type: 'pii_detection',
  status: 'critical',
  title: 'PII Detection',
  value: '3 entities found',
  description: 'Scans message content for personally identifiable information across entity types.',
};

const analyzingCheck: DynamicSecurityCheck = {
  check_id: 'PII_003_EXPOSURE_RATE',
  agent_id: 'agent-123',
  category_id: 'PRIVACY_COMPLIANCE',
  check_type: 'pii_exposure',
  status: 'analyzing',
  title: 'PII Exposure Rate',
  description: 'Measures the proportion of sessions that contain any PII.',
};

// Stories
export const Passed: Story = {
  args: {
    check: passedCheck,
    variant: 'compact',
    clickable: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Token Budget Usage')).toBeInTheDocument();
    await expect(canvas.getByText('OK')).toBeInTheDocument();
  },
};

export const Warning: Story = {
  args: {
    check: warningCheck,
    variant: 'compact',
    clickable: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Behavioral Outlier Rate')).toBeInTheDocument();
    await expect(canvas.getByText('WARN')).toBeInTheDocument();
  },
};

export const Critical: Story = {
  args: {
    check: criticalCheck,
    variant: 'compact',
    clickable: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('PII Detection')).toBeInTheDocument();
    await expect(canvas.getByText('FAIL')).toBeInTheDocument();
  },
};

export const Analyzing: Story = {
  args: {
    check: analyzingCheck,
    variant: 'compact',
    clickable: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('PII Exposure Rate')).toBeInTheDocument();
    await expect(canvas.getByText('ANALYZING')).toBeInTheDocument();
  },
};

export const Detailed: Story = {
  args: {
    check: warningCheck,
    variant: 'detailed',
    showDescription: true,
    clickable: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Behavioral Outlier Rate')).toBeInTheDocument();
    await expect(canvas.getByText(/Tracks the share of sessions/)).toBeInTheDocument();
  },
};

export const WithCategory: Story = {
  args: {
    check: passedCheck,
    variant: 'compact',
    showCategory: true,
    clickable: false,
  },
};

export const Clickable: Story = {
  args: {
    check: warningCheck,
    variant: 'compact',
    clickable: true,
    onClick: () => console.log('Clicked!'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const item = canvas.getByRole('button');
    await expect(item).toBeInTheDocument();
    await userEvent.click(item);
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <DynamicCheckItem check={passedCheck} />
      <DynamicCheckItem check={warningCheck} />
      <DynamicCheckItem check={criticalCheck} />
      <DynamicCheckItem check={analyzingCheck} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('OK')).toBeInTheDocument();
    await expect(canvas.getByText('WARN')).toBeInTheDocument();
    await expect(canvas.getByText('FAIL')).toBeInTheDocument();
    await expect(canvas.getByText('ANALYZING')).toBeInTheDocument();
  },
};

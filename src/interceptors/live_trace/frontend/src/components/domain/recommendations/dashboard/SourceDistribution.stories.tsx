import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { SourceDistribution } from './SourceDistribution';
import type { Recommendation } from '@api/types/findings';

const meta: Meta<typeof SourceDistribution> = {
  title: 'Domain/Recommendations/Dashboard/SourceDistribution',
  component: SourceDistribution,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onSourceClick: { action: 'source clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof SourceDistribution>;

const createRecommendation = (
  sourceType: 'STATIC' | 'DYNAMIC',
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  filePath?: string
): Recommendation => ({
  recommendation_id: `REC-${Math.random().toString(36).slice(2, 10)}`,
  workflow_id: 'test-workflow',
  source_type: sourceType,
  source_finding_id: 'FND-001',
  category: 'PROMPT',
  severity,
  cvss_score: severity === 'CRITICAL' ? 9.5 : severity === 'HIGH' ? 7.5 : severity === 'MEDIUM' ? 5.0 : 2.0,
  title: `${severity} Issue`,
  description: 'Test description',
  status: 'PENDING',
  file_path: filePath,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const Default: Story = {
  args: {
    recommendations: [
      createRecommendation('STATIC', 'CRITICAL', 'src/agent.py'),
      createRecommendation('STATIC', 'HIGH', 'src/agent.py'),
      createRecommendation('STATIC', 'MEDIUM', 'src/tools.py'),
      createRecommendation('STATIC', 'LOW', 'src/config.py'),
      createRecommendation('DYNAMIC', 'HIGH'),
      createRecommendation('DYNAMIC', 'MEDIUM'),
      createRecommendation('DYNAMIC', 'LOW'),
    ],
    onSourceClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click static source item
    const agentItem = canvas.getByTitle('src/agent.py');
    await user.click(agentItem);
    await expect(args.onSourceClick).toHaveBeenCalledWith('src/agent.py', 'STATIC');

    // Click different source item
    const toolsItem = canvas.getByTitle('src/tools.py');
    await user.click(toolsItem);
    await expect(args.onSourceClick).toHaveBeenCalledWith('src/tools.py', 'STATIC');
  },
};

export const OnlyStatic: Story = {
  args: {
    recommendations: [
      createRecommendation('STATIC', 'CRITICAL', 'src/agent.py'),
      createRecommendation('STATIC', 'HIGH', 'src/agent.py'),
      createRecommendation('STATIC', 'MEDIUM', 'src/tools.py'),
    ],
    onSourceClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click static source item
    const toolsItem = canvas.getByTitle('src/tools.py');
    await user.click(toolsItem);
    await expect(args.onSourceClick).toHaveBeenCalledWith('src/tools.py', 'STATIC');
  },
};

export const OnlyDynamic: Story = {
  args: {
    recommendations: [
      createRecommendation('DYNAMIC', 'HIGH', 'Runtime Detection'),
      createRecommendation('DYNAMIC', 'MEDIUM', 'Runtime Detection'),
      createRecommendation('DYNAMIC', 'LOW', 'Runtime Detection'),
    ],
    onSourceClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click dynamic source item
    const runtimeItem = canvas.getByTitle('Runtime Detection');
    await user.click(runtimeItem);
    await expect(args.onSourceClick).toHaveBeenCalledWith('Runtime Detection', 'DYNAMIC');
  },
};

export const WithSelectedSource: Story = {
  args: {
    recommendations: [
      createRecommendation('STATIC', 'CRITICAL', 'src/agent.py'),
      createRecommendation('STATIC', 'HIGH', 'src/tools.py'),
      createRecommendation('DYNAMIC', 'MEDIUM', 'Runtime Detection'),
    ],
    selectedSource: 'src/agent.py',
    onSourceClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click selected item to deselect
    const agentItem = canvas.getByTitle('src/agent.py');
    await user.click(agentItem);
    await expect(args.onSourceClick).toHaveBeenCalledWith(null, 'STATIC');

    // Click different source item
    const toolsItem = canvas.getByTitle('src/tools.py');
    await user.click(toolsItem);
    await expect(args.onSourceClick).toHaveBeenCalledWith('src/tools.py', 'STATIC');
  },
};

export const Empty: Story = {
  args: {
    recommendations: [],
    onSourceClick: fn(),
  },
};

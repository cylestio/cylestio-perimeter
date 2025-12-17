import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { ProductionGateCard } from './ProductionGateCard';

const meta: Meta<typeof ProductionGateCard> = {
  title: 'Domain/Security/ProductionGateCard',
  component: ProductionGateCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onFixIssue: { action: 'fix issue' },
    onViewAll: { action: 'view all' },
  },
};

export default meta;
type Story = StoryObj<typeof ProductionGateCard>;

export const ProductionReady: Story = {
  args: {
    isBlocked: false,
    blockingCount: 0,
    blockingCritical: 0,
    blockingHigh: 0,
    blockingItems: [],
  },
};

export const FixButtonCallback: Story = {
  args: {
    isBlocked: true,
    blockingCount: 2,
    blockingCritical: 1,
    blockingHigh: 1,
    blockingItems: [
      {
        recommendation_id: 'REC-001',
        title: 'Direct Prompt Injection',
        severity: 'CRITICAL',
        category: 'PROMPT',
        source_type: 'STATIC',
        file_path: 'src/agent.py',
      },
    ],
    onFixIssue: fn(),
  },
  play: async ({ canvas, args }) => {
    // Click Fix button on first item
    const fixButton = canvas.getByRole('button', { name: /Fix/i });
    await userEvent.click(fixButton);
    await expect(args.onFixIssue).toHaveBeenCalledWith('REC-001');
  },
};

export const ViewAllCallback: Story = {
  args: {
    isBlocked: true,
    blockingCount: 3,
    blockingCritical: 2,
    blockingHigh: 1,
    blockingItems: [
      {
        recommendation_id: 'REC-001',
        title: 'Issue 1',
        severity: 'CRITICAL',
        category: 'PROMPT',
        source_type: 'STATIC',
      },
    ],
    onViewAll: fn(),
  },
  play: async ({ canvas, args }) => {
    // Click View All Blocking Issues button
    const viewAllButton = canvas.getByRole('button', { name: /View All Blocking Issues/i });
    await userEvent.click(viewAllButton);
    await expect(args.onViewAll).toHaveBeenCalled();
  },
};

export const ManyBlockingItems: Story = {
  args: {
    isBlocked: true,
    blockingCount: 8,
    blockingCritical: 4,
    blockingHigh: 4,
    blockingItems: Array.from({ length: 8 }, (_, i) => ({
      recommendation_id: `REC-00${i + 1}`,
      title: `Blocking Issue ${i + 1}`,
      severity: i < 4 ? 'CRITICAL' as const : 'HIGH' as const,
      category: 'PROMPT',
      source_type: 'STATIC',
      file_path: `src/file${i + 1}.py`,
    })),
  },
  play: async ({ canvas }) => {
    // Verify only 5 items shown with "+3 more" text
    await expect(canvas.getByText(/\+3 more/i)).toBeInTheDocument();
  },
};

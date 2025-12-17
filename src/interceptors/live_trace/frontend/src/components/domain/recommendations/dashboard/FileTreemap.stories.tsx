import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { FileTreemap } from './FileTreemap';
import type { Recommendation } from '@api/types/findings';

const meta: Meta<typeof FileTreemap> = {
  title: 'Domain/Recommendations/Dashboard/FileTreemap',
  component: FileTreemap,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onFileClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof FileTreemap>;

const createRecommendation = (
  filePath: string,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
): Recommendation => ({
  recommendation_id: `REC-${Math.random().toString(36).slice(2, 10)}`,
  workflow_id: 'test-workflow',
  source_type: 'STATIC',
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
      createRecommendation('src/agent.py', 'CRITICAL'),
      createRecommendation('src/agent.py', 'CRITICAL'),
      createRecommendation('src/agent.py', 'HIGH'),
      createRecommendation('src/tools.py', 'HIGH'),
      createRecommendation('src/tools.py', 'MEDIUM'),
      createRecommendation('src/config.py', 'MEDIUM'),
      createRecommendation('src/utils/helpers.py', 'LOW'),
      createRecommendation('src/utils/helpers.py', 'LOW'),
      createRecommendation('tests/test_agent.py', 'LOW'),
    ],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click a treemap rectangle
    const agentRect = canvas.getByTitle(/src\/agent\.py: 3 issues/i);
    await user.click(agentRect);

    // Verify onFileClick was called with the file path (select)
    await expect(args.onFileClick).toHaveBeenCalledWith('src/agent.py');
    await expect(args.onFileClick).toHaveBeenCalledTimes(1);
  },
};

export const SingleFile: Story = {
  args: {
    recommendations: [
      createRecommendation('src/main.py', 'CRITICAL'),
      createRecommendation('src/main.py', 'HIGH'),
      createRecommendation('src/main.py', 'MEDIUM'),
    ],
  },
};

export const ManyFiles: Story = {
  args: {
    recommendations: [
      createRecommendation('src/agent.py', 'CRITICAL'),
      createRecommendation('src/agent.py', 'CRITICAL'),
      createRecommendation('src/tools/shell.py', 'HIGH'),
      createRecommendation('src/tools/file.py', 'HIGH'),
      createRecommendation('src/tools/http.py', 'MEDIUM'),
      createRecommendation('src/config.py', 'MEDIUM'),
      createRecommendation('src/utils/logger.py', 'LOW'),
      createRecommendation('src/utils/helpers.py', 'LOW'),
      createRecommendation('src/models/user.py', 'LOW'),
      createRecommendation('src/models/session.py', 'LOW'),
    ],
  },
};

export const WithSelectedFile: Story = {
  args: {
    recommendations: [
      createRecommendation('src/agent.py', 'CRITICAL'),
      createRecommendation('src/agent.py', 'HIGH'),
      createRecommendation('src/tools.py', 'MEDIUM'),
    ],
    selectedFile: 'src/agent.py',
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click the selected file to deselect it
    const agentRect = canvas.getByTitle(/src\/agent\.py: 2 issues/i);
    await user.click(agentRect);

    // Verify onFileClick was called with null (deselect)
    await expect(args.onFileClick).toHaveBeenCalledWith(null);
    await expect(args.onFileClick).toHaveBeenCalledTimes(1);

    // Click a different file (tools.py)
    const toolsRect = canvas.getByTitle(/src\/tools\.py: 1 issue/i);
    await user.click(toolsRect);

    // Verify onFileClick was called with the new file path
    await expect(args.onFileClick).toHaveBeenCalledWith('src/tools.py');
    await expect(args.onFileClick).toHaveBeenCalledTimes(2);
  },
};

export const DynamicRuntime: Story = {
  args: {
    recommendations: [
      { ...createRecommendation('', 'HIGH'), source_type: 'DYNAMIC' as const, file_path: undefined },
      { ...createRecommendation('', 'MEDIUM'), source_type: 'DYNAMIC' as const, file_path: undefined },
    ],
  },
};

export const Empty: Story = {
  args: {
    recommendations: [],
  },
};

export const AllResolved: Story = {
  args: {
    recommendations: [
      { ...createRecommendation('src/agent.py', 'CRITICAL'), status: 'FIXED' as const },
      { ...createRecommendation('src/tools.py', 'HIGH'), status: 'VERIFIED' as const },
    ],
  },
};

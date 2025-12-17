import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { CategoryDonut } from './CategoryDonut';
import type { Recommendation, SecurityCheckCategory } from '@api/types/findings';

const meta: Meta<typeof CategoryDonut> = {
  title: 'Domain/Recommendations/Dashboard/CategoryDonut',
  component: CategoryDonut,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CategoryDonut>;

const categories: SecurityCheckCategory[] = ['PROMPT', 'TOOL', 'DATA', 'BEHAVIOR', 'SUPPLY', 'OUTPUT'];

const createRecommendation = (
  category: SecurityCheckCategory,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
): Recommendation => ({
  recommendation_id: `REC-${Math.random().toString(36).slice(2, 10)}`,
  workflow_id: 'test-workflow',
  source_type: 'STATIC',
  source_finding_id: 'FND-001',
  category,
  severity,
  cvss_score: 5.0,
  title: `${category} Issue`,
  description: 'Test description',
  status: 'PENDING',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const Default: Story = {
  args: {
    recommendations: [
      createRecommendation('PROMPT', 'CRITICAL'),
      createRecommendation('PROMPT', 'HIGH'),
      createRecommendation('TOOL', 'HIGH'),
      createRecommendation('TOOL', 'MEDIUM'),
      createRecommendation('TOOL', 'LOW'),
      createRecommendation('DATA', 'MEDIUM'),
      createRecommendation('DATA', 'LOW'),
      createRecommendation('BEHAVIOR', 'MEDIUM'),
    ],
    onCategoryClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click on a legend item to select it
    const promptLegend = canvas.getByText(/Prompt Security/i).closest('button');
    await user.click(promptLegend!);
    await expect(args.onCategoryClick).toHaveBeenCalledWith('PROMPT');

    // Click on a different category
    const toolLegend = canvas.getByText(/Tool Security/i).closest('button');
    await user.click(toolLegend!);
    await expect(args.onCategoryClick).toHaveBeenCalledWith('TOOL');
  },
};

export const SingleCategory: Story = {
  args: {
    recommendations: [
      createRecommendation('PROMPT', 'CRITICAL'),
      createRecommendation('PROMPT', 'HIGH'),
      createRecommendation('PROMPT', 'MEDIUM'),
    ],
    onCategoryClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click on the single category
    const promptLegend = canvas.getByText(/Prompt Security/i).closest('button');
    await user.click(promptLegend!);
    await expect(args.onCategoryClick).toHaveBeenCalledWith('PROMPT');
  },
};

export const AllCategories: Story = {
  args: {
    recommendations: categories.map((cat) => createRecommendation(cat)),
    onCategoryClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click on different categories
    const toolLegend = canvas.getByText(/Tool Security/i).closest('button');
    await user.click(toolLegend!);
    await expect(args.onCategoryClick).toHaveBeenCalledWith('TOOL');

    const dataLegend = canvas.getByText(/Data & Secrets/i).closest('button');
    await user.click(dataLegend!);
    await expect(args.onCategoryClick).toHaveBeenCalledWith('DATA');
  },
};

export const WithSelectedCategory: Story = {
  args: {
    recommendations: [
      createRecommendation('PROMPT', 'CRITICAL'),
      createRecommendation('TOOL', 'HIGH'),
      createRecommendation('DATA', 'MEDIUM'),
    ],
    selectedCategory: 'PROMPT',
    onCategoryClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click on the already selected category to deselect it
    const promptLegend = canvas.getByText(/Prompt Security/i).closest('button');
    await user.click(promptLegend!);
    await expect(args.onCategoryClick).toHaveBeenCalledWith(null);

    // Click on a different category
    const toolLegend = canvas.getByText(/Tool Security/i).closest('button');
    await user.click(toolLegend!);
    await expect(args.onCategoryClick).toHaveBeenCalledWith('TOOL');
  },
};

export const Empty: Story = {
  args: {
    recommendations: [],
  },
};

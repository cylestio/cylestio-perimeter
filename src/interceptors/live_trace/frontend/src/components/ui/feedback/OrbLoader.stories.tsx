import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import styled from 'styled-components';
import { OrbLoader, FullPageLoader } from './OrbLoader';

const Row = styled.div<{ $gap?: number }>`
  display: flex;
  align-items: center;
  gap: ${({ $gap = 16 }) => $gap}px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.white70};
  font-size: 14px;
  margin-bottom: 16px;
  font-weight: 500;
`;

const DemoCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 100px;
`;

const meta: Meta<typeof OrbLoader> = {
  title: 'UI/Feedback/OrbLoader',
  component: OrbLoader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A loader based on the Agent Inspector logo orb. Features two animation variants: "morph" (circle-to-square transformation) and "whip" (acceleration/deceleration spin).',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the loader',
    },
    variant: {
      control: 'select',
      options: ['morph', 'whip'],
      description: 'Animation variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrbLoader>;

export const Default: Story = {
  args: {
    size: 'md',
    variant: 'morph',
  },
  play: async ({ canvasElement }) => {
    // OrbLoader renders as divs - verify the container exists
    await expect(canvasElement.querySelector('div')).toBeInTheDocument();
  },
};

export const Variants: Story = {
  render: () => (
    <Row $gap={32}>
      <DemoCard>
        <SectionTitle>Morph</SectionTitle>
        <OrbLoader size="lg" variant="morph" />
      </DemoCard>
      <DemoCard>
        <SectionTitle>Whip</SectionTitle>
        <OrbLoader size="lg" variant="whip" />
      </DemoCard>
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Morph')).toBeInTheDocument();
    await expect(canvas.getByText('Whip')).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Morph**: Circle transforms to square and back while spinning. **Whip**: Circle accelerates rapidly then decelerates, creating a satisfying "wind-up" effect.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <Row $gap={32}>
      <DemoCard>
        <SectionTitle>Small</SectionTitle>
        <OrbLoader size="sm" />
      </DemoCard>
      <DemoCard>
        <SectionTitle>Medium</SectionTitle>
        <OrbLoader size="md" />
      </DemoCard>
      <DemoCard>
        <SectionTitle>Large</SectionTitle>
        <OrbLoader size="lg" />
      </DemoCard>
      <DemoCard>
        <SectionTitle>XL</SectionTitle>
        <OrbLoader size="xl" />
      </DemoCard>
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Small')).toBeInTheDocument();
    await expect(canvas.getByText('Medium')).toBeInTheDocument();
    await expect(canvas.getByText('Large')).toBeInTheDocument();
    await expect(canvas.getByText('XL')).toBeInTheDocument();
  },
};

export const InlineUsage: Story = {
  args: {
    variant: 'whip',
  },
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <OrbLoader size="sm" />
      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>Processing request...</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Processing request...')).toBeInTheDocument();
  },
};

export const FullPage: StoryObj<typeof FullPageLoader> = {
  render: () => (
    <div style={{ position: 'relative', height: 400, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <FullPageLoader text="Initializing" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Initializing')).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-page loader variant for page transitions or initial app loading states.',
      },
    },
  },
};

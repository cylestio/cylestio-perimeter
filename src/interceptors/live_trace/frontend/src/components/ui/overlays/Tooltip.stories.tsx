import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Info } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Button } from '../core/Button';

const Container = styled.div`
  padding: 100px 24px;
  background: #0a0a0f;
  display: flex;
  gap: 24px;
  justify-content: center;
`;

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'This is a helpful tooltip',
    position: 'top',
    children: <Button variant="secondary">Hover me</Button>,
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByText('Hover me');
    await expect(trigger).toBeInTheDocument();
  },
};

export const Positions: Story = {
  render: () => (
    <Container style={{ flexWrap: 'wrap', gap: 48 }}>
      <Tooltip content="Top tooltip" position="top">
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" position="bottom">
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left tooltip" position="left">
        <Button variant="secondary">Left</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" position="right">
        <Button variant="secondary">Right</Button>
      </Tooltip>
    </Container>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Top')).toBeInTheDocument();
    await expect(canvas.getByText('Bottom')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  args: {
    content: 'Click for more information',
    position: 'top',
    children: (
      <span style={{ color: '#ffffff50', cursor: 'help' }}>
        <Info size={16} />
      </span>
    ),
  },
  play: async ({ canvasElement }) => {
    // The SVG icon should be present
    await expect(canvasElement.querySelector('svg')).toBeInTheDocument();
  },
};

export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip with more detailed information about the feature. It should wrap properly within the max-width constraint.',
    position: 'top',
    children: <Button variant="secondary">Long tooltip</Button>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Long tooltip')).toBeInTheDocument();
  },
};

export const CustomDelay: Story = {
  args: {
    content: 'This tooltip has a 500ms delay',
    position: 'top',
    delay: 500,
    children: <Button variant="secondary">Slow tooltip</Button>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Slow tooltip')).toBeInTheDocument();
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { ModeIndicators } from './ModeIndicators';

const Container = styled.div`
  width: 260px;
  background: #0a0a0f;
`;

const CollapsedContainer = styled.div`
  width: 64px;
  background: #0a0a0f;
`;

const meta: Meta<typeof ModeIndicators> = {
  title: 'Domain/Agents/ModeIndicators',
  component: ModeIndicators,
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
type Story = StoryObj<typeof ModeIndicators>;

export const Default: Story = {
  args: {
    autoFix: true,
    staticMode: true,
    dynamicMode: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Auto-Fix')).toBeInTheDocument();
    await expect(canvas.getByText('Static')).toBeInTheDocument();
    await expect(canvas.getByText('Dynamic')).toBeInTheDocument();
  },
};

export const AutoFixOnly: Story = {
  args: {
    autoFix: true,
  },
};

export const StaticOnly: Story = {
  args: {
    staticMode: true,
  },
};

export const DynamicOnly: Story = {
  args: {
    dynamicMode: true,
  },
};

export const NoModes: Story = {
  args: {
    autoFix: false,
    staticMode: false,
    dynamicMode: false,
  },
};

export const Collapsed: Story = {
  args: {
    autoFix: true,
    staticMode: true,
    dynamicMode: true,
    collapsed: true,
  },
  decorators: [
    (Story) => (
      <CollapsedContainer>
        <Story />
      </CollapsedContainer>
    ),
  ],
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import styled from 'styled-components';
import { LocalModeIndicator } from './LocalModeIndicator';

const Container = styled.div`
  width: 260px;
  padding: 12px;
  background: #0a0a0f;
  position: relative;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const CollapsedContainer = styled.div`
  width: 64px;
  padding: 8px;
  background: #0a0a0f;
  position: relative;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
`;

const meta: Meta<typeof LocalModeIndicator> = {
  title: 'Domain/Layout/LocalModeIndicator',
  component: LocalModeIndicator,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
  argTypes: {
    storageMode: {
      control: 'radio',
      options: ['memory', 'sqlite'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocalModeIndicator>;

export const Default: Story = {
  args: {
    storageMode: 'memory',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Local Mode')).toBeInTheDocument();
    await expect(canvas.getByText('In-memory')).toBeInTheDocument();
  },
};

export const InMemory: Story = {
  args: {
    storageMode: 'memory',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Local Mode')).toBeInTheDocument();
    await expect(canvas.getByText('In-memory')).toBeInTheDocument();
  },
};

export const SavedToDisk: Story = {
  args: {
    storageMode: 'sqlite',
    storagePath: '/var/data/inspector',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Local Mode')).toBeInTheDocument();
    await expect(canvas.getByText('Saved to disk')).toBeInTheDocument();
  },
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
    storageMode: 'memory',
  },
  decorators: [
    (Story) => (
      <CollapsedContainer>
        <Story />
      </CollapsedContainer>
    ),
  ],
  play: async ({ canvas }) => {
    // In collapsed mode, text should not be visible
    expect(canvas.queryByText('Local Mode')).not.toBeInTheDocument();
    expect(canvas.queryByText('In-memory')).not.toBeInTheDocument();
  },
};

export const TooltipInMemory: Story = {
  args: {
    storageMode: 'memory',
  },
  play: async ({ canvas }) => {
    const localModeText = canvas.getByText('Local Mode');
    await userEvent.hover(localModeText);

    await waitFor(
      () => {
        const tooltip = document.querySelector('[role="tooltip"]');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip?.textContent).toContain('stored in memory');
      },
      { timeout: 1000 }
    );
  },
};

export const TooltipDisk: Story = {
  args: {
    storageMode: 'sqlite',
    storagePath: '/var/data/inspector',
  },
  play: async ({ canvas }) => {
    const localModeText = canvas.getByText('Local Mode');
    await userEvent.hover(localModeText);

    await waitFor(
      () => {
        const tooltip = document.querySelector('[role="tooltip"]');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip?.textContent).toContain('/var/data/inspector');
      },
      { timeout: 1000 }
    );
  },
};

export const TooltipLongPath: Story = {
  args: {
    storageMode: 'sqlite',
    storagePath: '/Users/developer/Projects/cylestio/cylestio-perimeter/trace_data/live_trace.db',
  },
  play: async ({ canvas }) => {
    const localModeText = canvas.getByText('Local Mode');
    await userEvent.hover(localModeText);

    await waitFor(
      () => {
        const tooltip = document.querySelector('[role="tooltip"]');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip?.textContent).toContain('Data is saved to');
        // The path should be displayed with Code component (monospace)
        const codeElement = tooltip?.querySelector('code');
        expect(codeElement).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  },
};

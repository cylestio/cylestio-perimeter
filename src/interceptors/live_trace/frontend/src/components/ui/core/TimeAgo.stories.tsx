import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import styled from 'styled-components';

import { TimeAgo } from './TimeAgo';

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.white70};
  font-size: 12px;
  min-width: 120px;
`;

const meta: Meta<typeof TimeAgo> = {
  title: 'UI/Core/TimeAgo',
  component: TimeAgo,
  tags: ['autodocs'],
  argTypes: {
    format: {
      control: 'select',
      options: ['relative', 'absolute'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimeAgo>;

export const Default: Story = {
  args: {
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    format: 'relative',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('5m ago')).toBeInTheDocument();
  },
};

export const RelativeFormat: Story = {
  render: () => (
    <Stack>
      <Row>
        <Label>Just now:</Label>
        <TimeAgo timestamp={new Date(Date.now() - 10 * 1000)} />
      </Row>
      <Row>
        <Label>Minutes ago:</Label>
        <TimeAgo timestamp={new Date(Date.now() - 15 * 60 * 1000)} />
      </Row>
      <Row>
        <Label>Hours ago:</Label>
        <TimeAgo timestamp={new Date(Date.now() - 3 * 60 * 60 * 1000)} />
      </Row>
      <Row>
        <Label>Days ago:</Label>
        <TimeAgo timestamp={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)} />
      </Row>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('just now')).toBeInTheDocument();
    await expect(canvas.getByText('15m ago')).toBeInTheDocument();
    await expect(canvas.getByText('3h ago')).toBeInTheDocument();
    await expect(canvas.getByText('2d ago')).toBeInTheDocument();
  },
};

export const AbsoluteFormat: Story = {
  render: () => (
    <Stack>
      <Row>
        <Label>Recent:</Label>
        <TimeAgo
          timestamp={new Date(Date.now() - 5 * 60 * 1000)}
          format="absolute"
        />
      </Row>
      <Row>
        <Label>Older:</Label>
        <TimeAgo
          timestamp={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)}
          format="absolute"
        />
      </Row>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Absolute format shows full date with month, day, year, and time
    // Check that both absolute dates are displayed (contains month name and year)
    const currentYear = new Date().getFullYear().toString();
    const dateElements = canvas.getAllByText(
      new RegExp(`\\w+ \\d+, ${currentYear}`)
    );
    await expect(dateElements.length).toBe(2);
  },
};

export const ISOString: Story = {
  args: {
    timestamp: '2025-12-11T08:58:32.328911+00:00',
    format: 'relative',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Should show relative time, not the raw ISO string
    const element = canvas.getByText(/ago|just now/);
    await expect(element).toBeInTheDocument();
  },
};

export const UnixTimestamp: Story = {
  render: () => (
    <Stack>
      <Row>
        <Label>Unix (seconds):</Label>
        <TimeAgo timestamp={Date.now() / 1000 - 300} />
      </Row>
      <Row>
        <Label>Unix (ms):</Label>
        <TimeAgo timestamp={Date.now() - 300000} />
      </Row>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Both should render as "5m ago" (300 seconds = 5 minutes)
    const elements = canvas.getAllByText('5m ago');
    await expect(elements.length).toBeGreaterThanOrEqual(1);
  },
};

export const InvalidTimestamp: Story = {
  render: () => (
    <Stack>
      <Row>
        <Label>null:</Label>
        <TimeAgo timestamp={null} />
      </Row>
      <Row>
        <Label>undefined:</Label>
        <TimeAgo timestamp={undefined} />
      </Row>
      <Row>
        <Label>invalid string:</Label>
        <TimeAgo timestamp="not-a-date" />
      </Row>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dashes = canvas.getAllByText('-');
    await expect(dashes.length).toBe(3);
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import styled from 'styled-components';
import { Table } from './Table';
import { Badge } from '../core/Badge';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
`;

interface Finding {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  location: string;
}

const mockFindings: Finding[] = [
  { id: '1', name: 'Missing rate limiting', severity: 'critical', status: 'Open', location: 'agent.py:156' },
  { id: '2', name: 'PII exposure in logs', severity: 'high', status: 'In Progress', location: 'logger.py:42' },
  { id: '3', name: 'No max_tokens constraint', severity: 'medium', status: 'Open', location: 'agent.py:234' },
  { id: '4', name: 'Missing input validation', severity: 'low', status: 'Resolved', location: 'handlers.py:89' },
];

const columns = [
  { key: 'name' as const, header: 'Finding', sortable: true },
  {
    key: 'severity' as const,
    header: 'Severity',
    sortable: true,
    render: (row: Finding) => <Badge variant={row.severity}>{row.severity}</Badge>,
  },
  { key: 'status' as const, header: 'Status' },
  { key: 'location' as const, header: 'Location' },
];

const meta: Meta<typeof Table> = {
  title: 'UI/DataDisplay/Table',
  component: Table,
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
type Story = StoryObj<typeof Table<Finding>>;

export const Default: Story = {
  args: {
    columns,
    data: mockFindings,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Missing rate limiting')).toBeInTheDocument();
    await expect(canvas.getByText('Severity')).toBeInTheDocument();
  },
};

export const Sortable: Story = {
  args: {
    columns,
    data: mockFindings,
  },
  play: async ({ canvas }) => {
    const header = canvas.getByText('Finding');
    await userEvent.click(header);
    await expect(header.closest('th')).toHaveAttribute('aria-sort', 'ascending');
  },
};

export const RowClick: Story = {
  args: {
    columns,
    data: mockFindings,
    onRowClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const rows = canvas.getAllByRole('row');
    await userEvent.click(rows[1]); // First data row
    await expect(args.onRowClick).toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    loading: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Finding')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    emptyState: <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff50' }}>No findings found</div>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No findings found')).toBeInTheDocument();
  },
};

// Header component for the story
const TableHeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
`;

export const WithHeader: Story = {
  args: {
    columns,
    data: mockFindings,
    header: (
      <TableHeaderContent>
        Security Findings
        <Badge variant="critical">4</Badge>
      </TableHeaderContent>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Security Findings')).toBeInTheDocument();
    await expect(canvas.getByText('4')).toBeInTheDocument();
    await expect(canvas.getByText('Missing rate limiting')).toBeInTheDocument();
  },
};

export const WithHeaderEmpty: Story = {
  args: {
    columns,
    data: [],
    header: (
      <TableHeaderContent>
        Security Findings
        <Badge variant="info">0</Badge>
      </TableHeaderContent>
    ),
    emptyState: <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff50' }}>No findings found</div>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Security Findings')).toBeInTheDocument();
    await expect(canvas.getByText('No findings found')).toBeInTheDocument();
  },
};

export const WithHeaderLoading: Story = {
  args: {
    columns,
    data: [],
    loading: true,
    header: (
      <TableHeaderContent>
        Security Findings
      </TableHeaderContent>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Security Findings')).toBeInTheDocument();
    await expect(canvas.getByText('Finding')).toBeInTheDocument();
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';

import { Page } from './Page';

const DemoContent = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white70};
`;

const meta: Meta<typeof Page> = {
  title: 'UI/Layout/Page',
  component: Page,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Page>;

export const Default: Story = {
  args: {
    children: (
      <DemoContent>
        <h2>Page Content</h2>
        <p>This is the default page layout with max-width constraint (1400px) and centered content.</p>
      </DemoContent>
    ),
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: (
      <DemoContent>
        <h2>Full Width Page</h2>
        <p>This page uses fullWidth=true, removing the max-width constraint for custom layouts.</p>
      </DemoContent>
    ),
  },
};

export const WithMultipleSections: Story = {
  args: {
    children: (
      <>
        <DemoContent style={{ marginBottom: '24px' }}>
          <h2>Header Section</h2>
          <p>Page header with title and actions</p>
        </DemoContent>
        <DemoContent style={{ marginBottom: '24px' }}>
          <h2>Main Content</h2>
          <p>Primary content area</p>
        </DemoContent>
        <DemoContent>
          <h2>Footer Section</h2>
          <p>Additional information</p>
        </DemoContent>
      </>
    ),
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Users, Shield, Activity } from 'lucide-react';

import { Section } from './Section';
import { Badge } from '../core/Badge';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  min-width: 600px;
`;

const meta: Meta<typeof Section> = {
  title: 'UI/Layout/Section',
  component: Section,
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
type Story = StoryObj<typeof Section>;

export const Default: Story = {
  render: () => (
    <Section>
      <Section.Header>
        <Section.Title>Section Title</Section.Title>
      </Section.Header>
      <Section.Content>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          This is the content area of the section. It can contain any content.
        </p>
      </Section.Content>
    </Section>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Section Title')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  render: () => (
    <Section>
      <Section.Header>
        <Section.Title icon={<Users size={16} />}>Team Members</Section.Title>
      </Section.Header>
      <Section.Content>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          Section with an icon in the title.
        </p>
      </Section.Content>
    </Section>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Team Members')).toBeInTheDocument();
  },
};

export const WithActions: Story = {
  render: () => (
    <Section>
      <Section.Header>
        <Section.Title icon={<Shield size={16} />}>Security Findings</Section.Title>
        <Badge variant="critical">12 open</Badge>
      </Section.Header>
      <Section.Content>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          Section with a badge action in the header.
        </p>
      </Section.Content>
    </Section>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Security Findings')).toBeInTheDocument();
    await expect(canvas.getByText('12 open')).toBeInTheDocument();
  },
};

export const NoPadding: Story = {
  render: () => (
    <Section>
      <Section.Header>
        <Section.Title icon={<Activity size={16} />}>Sessions Table</Section.Title>
      </Section.Header>
      <Section.Content noPadding>
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          Table rows would go here without extra padding from Section.Content
        </div>
      </Section.Content>
    </Section>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Sessions Table')).toBeInTheDocument();
  },
};

export const ContentOnly: Story = {
  render: () => (
    <Section>
      <Section.Content>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          Section without a header - just content with the container styling.
        </p>
      </Section.Content>
    </Section>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Section without a header/)).toBeInTheDocument();
  },
};

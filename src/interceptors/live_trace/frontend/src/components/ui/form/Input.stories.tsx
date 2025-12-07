import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Search, Mail, Lock } from 'lucide-react';
import styled from 'styled-components';
import { Input } from './Input';

const Row = styled.div<{ $gap?: number }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ $gap = 16 }) => $gap}px;
  flex-wrap: wrap;
`;

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.white70};
  font-size: 14px;
  margin-bottom: 16px;
  font-weight: 500;
`;

const InputContainer = styled.div`
  width: 280px;
`;

const meta: Meta<typeof Input> = {
  title: 'UI/Form/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search'],
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter value...',
  },
  play: async ({ canvas }) => {
    const input = canvas.getByPlaceholderText('Enter value...');
    await expect(input).toBeInTheDocument();
  },
};

export const WithLabel: Story = {
  render: () => (
    <InputContainer>
      <Input label="Email Address" type="email" placeholder="you@example.com" />
    </InputContainer>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Stack>
      <Section>
        <SectionTitle>Left Icon</SectionTitle>
        <Row>
          <InputContainer>
            <Input icon={<Search />} placeholder="Search sessions..." />
          </InputContainer>
          <InputContainer>
            <Input icon={<Mail />} label="Email" placeholder="you@example.com" />
          </InputContainer>
        </Row>
      </Section>

      <Section>
        <SectionTitle>Right Icon</SectionTitle>
        <Row>
          <InputContainer>
            <Input
              icon={<Lock />}
              iconPosition="right"
              type="password"
              label="Password"
              placeholder="Enter password..."
            />
          </InputContainer>
        </Row>
      </Section>
    </Stack>
  ),
};

export const Monospace: Story = {
  render: () => (
    <Row>
      <InputContainer>
        <Input mono label="Session ID" placeholder="sess_abc123def456" />
      </InputContainer>
      <InputContainer>
        <Input mono label="API Key" placeholder="sk-..." />
      </InputContainer>
    </Row>
  ),
};

export const Error: Story = {
  render: () => (
    <Row>
      <InputContainer>
        <Input
          label="Email"
          type="email"
          defaultValue="invalid-email"
          error="Please enter a valid email address"
        />
      </InputContainer>
      <InputContainer>
        <Input
          label="Password"
          type="password"
          defaultValue="123"
          error="Password must be at least 8 characters"
        />
      </InputContainer>
    </Row>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Row>
      <InputContainer>
        <Input label="Disabled Input" placeholder="Cannot edit..." disabled />
      </InputContainer>
      <InputContainer>
        <Input label="Disabled with Value" defaultValue="Read only value" disabled />
      </InputContainer>
    </Row>
  ),
};

export const WithHint: Story = {
  render: () => (
    <InputContainer>
      <Input
        label="API Key"
        mono
        placeholder="sk-..."
        hint="Your API key can be found in the dashboard"
      />
    </InputContainer>
  ),
};

export const Required: Story = {
  render: () => (
    <InputContainer>
      <Input label="Required Field" required placeholder="This field is required" />
    </InputContainer>
  ),
};

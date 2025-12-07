import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Input } from '@ui/form/Input';

import { FormLabel, FormError, FormHint } from './FormLabel';

const meta: Meta<typeof FormLabel> = {
  title: 'UI/Form/FormLabel',
  component: FormLabel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof FormLabel>;

export const Default: Story = {
  args: {
    children: 'Email Address',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Email Address')).toBeInTheDocument();
  },
};

export const Required: Story = {
  args: {
    children: 'Username',
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Username')).toBeInTheDocument();
    await expect(canvas.getByText('*')).toBeInTheDocument();
  },
};

export const WithInput: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <FormLabel htmlFor="email" required>
        Email Address
      </FormLabel>
      <Input id="email" type="email" placeholder="Enter your email" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Email Address')).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  },
};

export const FormErrorStory: Story = {
  name: 'FormError',
  render: () => <FormError>This field is required</FormError>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('This field is required')).toBeInTheDocument();
  },
};

export const FormHintStory: Story = {
  name: 'FormHint',
  render: () => <FormHint>Enter a valid email address</FormHint>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Enter a valid email address')).toBeInTheDocument();
  },
};

export const CompleteFormField: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
      <FormLabel htmlFor="password" required>
        Password
      </FormLabel>
      <Input id="password" type="password" placeholder="Enter password" />
      <FormHint>Must be at least 8 characters</FormHint>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Password')).toBeInTheDocument();
    await expect(canvas.getByText('*')).toBeInTheDocument();
    await expect(canvas.getByText('Must be at least 8 characters')).toBeInTheDocument();
  },
};

export const WithError: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
      <FormLabel htmlFor="username" required>
        Username
      </FormLabel>
      <Input id="username" placeholder="Enter username" />
      <FormError>Username is already taken</FormError>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Username')).toBeInTheDocument();
    await expect(canvas.getByText('Username is already taken')).toBeInTheDocument();
  },
};

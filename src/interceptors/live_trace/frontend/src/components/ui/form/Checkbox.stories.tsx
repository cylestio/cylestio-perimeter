import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';
import { Checkbox } from './Checkbox';

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
`;

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Form/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: function CheckboxDefaultStory() {
    const [checked, setChecked] = useState(false);
    return <Checkbox checked={checked} onChange={setChecked} label="Enable notifications" />;
  },
};

export const Checked: Story = {
  render: function CheckboxCheckedStory() {
    const [checked, setChecked] = useState(true);
    return <Checkbox checked={checked} onChange={setChecked} label="Auto-scan on commit" />;
  },
};

export const Indeterminate: Story = {
  render: () => (
    <Stack>
      <Checkbox indeterminate label="Select all (indeterminate)" />
      <Checkbox checked label="Item 1" />
      <Checkbox checked label="Item 2" />
      <Checkbox checked={false} label="Item 3" />
    </Stack>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Stack>
      <Checkbox disabled label="Disabled unchecked" />
      <Checkbox disabled checked label="Disabled checked" />
    </Stack>
  ),
};

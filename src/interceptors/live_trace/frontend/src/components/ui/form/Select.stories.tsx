import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';
import { Select } from './Select';

const InputContainer = styled.div`
  width: 280px;
`;

const severityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const meta: Meta<typeof Select> = {
  title: 'UI/Form/Select',
  component: Select,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <InputContainer>
      <Select label="Severity" options={severityOptions} placeholder="Select severity..." />
    </InputContainer>
  ),
};

export const WithValue: Story = {
  render: function SelectWithValueStory() {
    const [value, setValue] = useState('high');
    return (
      <InputContainer>
        <Select
          label="Severity"
          options={severityOptions}
          value={value}
          onChange={setValue}
        />
      </InputContainer>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <InputContainer>
      <Select label="Disabled Select" options={severityOptions} disabled />
    </InputContainer>
  ),
};

export const Error: Story = {
  render: () => (
    <InputContainer>
      <Select
        label="Status"
        options={[]}
        placeholder="Select status..."
        error="Please select a status"
      />
    </InputContainer>
  ),
};

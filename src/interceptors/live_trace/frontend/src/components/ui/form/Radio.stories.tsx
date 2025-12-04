import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';
import { Radio, RadioGroup } from './Radio';

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.white70};
  font-size: 14px;
  margin-bottom: 16px;
  font-weight: 500;
`;

const scanOptions = [
  { value: 'static', label: 'Static Analysis' },
  { value: 'dynamic', label: 'Dynamic Analysis' },
  { value: 'both', label: 'Both' },
];

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/Form/Radio',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: function RadioGroupDefaultStory() {
    const [value, setValue] = useState('static');
    return (
      <RadioGroup
        name="scan-type-default"
        options={scanOptions}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const Vertical: Story = {
  render: function RadioGroupVerticalStory() {
    const [value, setValue] = useState('static');
    return (
      <Section>
        <SectionTitle>Scan Type</SectionTitle>
        <RadioGroup
          name="scan-type-vertical"
          options={scanOptions}
          value={value}
          onChange={setValue}
          direction="vertical"
        />
      </Section>
    );
  },
};

export const Horizontal: Story = {
  render: function RadioGroupHorizontalStory() {
    const [value, setValue] = useState('static');
    return (
      <Section>
        <SectionTitle>Scan Type</SectionTitle>
        <RadioGroup
          name="scan-type-horizontal"
          options={scanOptions}
          value={value}
          onChange={setValue}
          direction="horizontal"
        />
      </Section>
    );
  },
};

export const SingleRadio: Story = {
  render: function RadioSingleStory() {
    const [checked, setChecked] = useState(false);
    return <Radio checked={checked} onChange={setChecked} label="Single radio option" />;
  },
};

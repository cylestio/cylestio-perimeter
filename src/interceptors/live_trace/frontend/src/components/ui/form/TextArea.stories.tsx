import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';
import { TextArea } from './TextArea';

const Container = styled.div`
  width: 400px;
`;

const WideContainer = styled.div`
  width: 500px;
`;

const meta: Meta<typeof TextArea> = {
  title: 'UI/Form/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  argTypes: {
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  render: () => (
    <Container>
      <TextArea label="Description" placeholder="Enter description..." />
    </Container>
  ),
};

export const Monospace: Story = {
  render: () => (
    <WideContainer>
      <TextArea
        label="Code Snippet"
        mono
        placeholder="// Enter code here..."
        hint="Paste your code snippet for analysis"
      />
    </WideContainer>
  ),
};

export const Error: Story = {
  render: () => (
    <Container>
      <TextArea label="Notes" error="Notes cannot be empty" />
    </Container>
  ),
};

export const NoResize: Story = {
  render: () => (
    <Container>
      <TextArea label="Fixed Size" resize="none" placeholder="Cannot be resized..." />
    </Container>
  ),
};

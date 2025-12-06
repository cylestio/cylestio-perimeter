import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { CodeBlock } from './CodeBlock';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
  max-width: 600px;
`;

const meta: Meta<typeof CodeBlock> = {
  title: 'UI/DataDisplay/CodeBlock',
  component: CodeBlock,
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
type Story = StoryObj<typeof CodeBlock>;

export const Default: Story = {
  args: {
    filename: 'agent.py',
    language: 'python',
    lines: [
      { content: 'class Agent:' },
      { content: '    def __init__(self):' },
      { content: '        self.name = "CustomerAgent"' },
      { content: '        self.limiter = RateLimiter()' },
    ],
    showLineNumbers: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('agent.py')).toBeInTheDocument();
    await expect(canvas.getByText('class Agent:')).toBeInTheDocument();
  },
};

export const WithHighlight: Story = {
  args: {
    filename: 'agent.py',
    lines: [
      { number: 21, content: 'class Agent:' },
      { number: 22, content: '    def __init__(self):', highlight: true },
      { number: 23, content: '        self.name = "CustomerAgent"' },
    ],
    showLineNumbers: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('def __init__(self):')).toBeInTheDocument();
  },
};

export const DiffView: Story = {
  args: {
    filename: 'agent.py',
    lines: [
      { content: 'class Agent:' },
      { content: '    def process(self, data):', removed: true },
      { content: '    def process(self, data, validate=True):', added: true },
      { content: '        return self.handler(data)' },
    ],
    showLineNumbers: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/def process\(self, data\):/)).toBeInTheDocument();
    await expect(canvas.getByText(/def process\(self, data, validate=True\):/)).toBeInTheDocument();
  },
};

export const CopyButton: Story = {
  args: {
    filename: 'example.py',
    lines: [
      { content: 'print("Hello, World!")' },
    ],
  },
  play: async ({ canvas }) => {
    const copyButton = canvas.getByRole('button', { name: 'Copy code' });
    await expect(copyButton).toBeInTheDocument();
    // Note: Cannot test clipboard in this environment
  },
};

export const NoHeader: Story = {
  args: {
    lines: [
      { content: '$ npm install @cylestio/uikit' },
      { content: '$ npm run build' },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('$ npm install @cylestio/uikit')).toBeInTheDocument();
  },
};

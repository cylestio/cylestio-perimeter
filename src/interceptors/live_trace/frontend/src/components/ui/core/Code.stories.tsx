import type { Meta, StoryObj } from '@storybook/react-vite';
import { Code } from './Code';
import { Text } from './Text';

const meta: Meta<typeof Code> = {
  title: 'UI/Core/Code',
  component: Code,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['inline', 'block'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Code>;

export const Default: Story = {
  args: {
    children: 'const x = 42;',
  },
};

export const Inline: Story = {
  render: () => (
    <Text>
      Run <Code>npm install</Code> to install dependencies
    </Text>
  ),
};

export const Block: Story = {
  render: () => (
    <Code variant="block">
      {`const agent = new AgentInspector();
agent.analyze(session);
console.log(agent.findings);`}
    </Code>
  ),
};

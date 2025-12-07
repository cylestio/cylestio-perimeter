import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { Timeline, type TimelineEvent } from './Timeline';

const meta: Meta<typeof Timeline> = {
  title: 'UI/Data Display/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

const mockEvents: TimelineEvent[] = [
  {
    id: 'event-1',
    event_type: 'llm.call.start',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    level: 'INFO',
    description: 'LLM call initiated',
    details: {
      'llm.request.data': {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, can you help me with a coding task? I need to write a function that calculates the fibonacci sequence.' },
        ],
      },
    },
  },
  {
    id: 'event-2',
    event_type: 'llm.call.finish',
    timestamp: new Date(Date.now() - 55000).toISOString(),
    level: 'INFO',
    description: 'LLM response received',
    details: {
      'llm.response.content': [
        { text: 'Of course! I can help you write a fibonacci function. Here\'s a simple recursive implementation in Python:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n```' },
      ],
    },
  },
  {
    id: 'event-3',
    event_type: 'tool.execution',
    timestamp: new Date(Date.now() - 50000).toISOString(),
    level: 'INFO',
    description: 'Tool execution started',
    details: {
      'tool.name': 'code_executor',
      'tool.params': {
        language: 'python',
        code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint([fibonacci(i) for i in range(10)])',
      },
    },
  },
  {
    id: 'event-4',
    event_type: 'tool.result',
    timestamp: new Date(Date.now() - 45000).toISOString(),
    level: 'INFO',
    description: 'Tool execution completed',
    details: {
      'tool.result': '[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]',
    },
  },
];

const errorEvent: TimelineEvent = {
  id: 'event-error',
  event_type: 'llm.call.finish',
  timestamp: new Date(Date.now() - 30000).toISOString(),
  level: 'ERROR',
  description: 'LLM call failed',
  details: {
    'error.message': 'Rate limit exceeded. Please try again in 60 seconds.',
    'error.code': 'rate_limit_exceeded',
  },
};

export const Default: Story = {
  args: {
    events: mockEvents,
    sessionId: 'session-123',
    onReplay: fn(),
  },
};

export const WithReplayButton: Story = {
  args: {
    events: mockEvents.slice(0, 1),
    sessionId: 'session-123',
    onReplay: fn(),
  },
  play: async ({ args, canvas }) => {
    const replayButton = canvas.getByText('Edit & Replay');
    await expect(replayButton).toBeInTheDocument();

    await userEvent.click(replayButton);
    await expect(args.onReplay).toHaveBeenCalledWith('event-1');
  },
};

export const WithError: Story = {
  args: {
    events: [...mockEvents, errorEvent],
    sessionId: 'session-123',
  },
};

export const SingleEvent: Story = {
  args: {
    events: [mockEvents[0]],
    sessionId: 'session-123',
  },
};

export const ToolExecutionOnly: Story = {
  args: {
    events: mockEvents.filter(e => e.event_type.startsWith('tool.')),
  },
};

export const EmptyTimeline: Story = {
  args: {
    events: [],
  },
  play: async ({ canvas }) => {
    // Timeline should render but be empty
    const container = canvas.queryByText('llm.call.start');
    await expect(container).not.toBeInTheDocument();
  },
};

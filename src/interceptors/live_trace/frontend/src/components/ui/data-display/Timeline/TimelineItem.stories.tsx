import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { TimelineItem, type TimelineEvent } from './TimelineItem';

const meta: Meta<typeof TimelineItem> = {
  title: 'UI/Data Display/TimelineItem',
  component: TimelineItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof TimelineItem>;

// Mock data
const llmCallStartEvent: TimelineEvent = {
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
};

const llmCallFinishEvent: TimelineEvent = {
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
};

const toolExecutionEvent: TimelineEvent = {
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
};

const toolResultEvent: TimelineEvent = {
  id: 'event-4',
  event_type: 'tool.result',
  timestamp: new Date(Date.now() - 45000).toISOString(),
  level: 'INFO',
  description: 'Tool execution completed',
  details: {
    'tool.result': '[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]',
  },
};

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

const responseWithToolUseEvent: TimelineEvent = {
  id: 'event-tool-use',
  event_type: 'llm.call.finish',
  timestamp: new Date().toISOString(),
  level: 'INFO',
  details: {
    'llm.response.content': [
      { type: 'text', text: 'I\'ll help you search for that information.' },
      {
        type: 'tool_use',
        name: 'web_search',
        input: { query: 'latest news on AI safety' },
      },
    ],
    raw_response: {
      id: 'msg_123',
      model: 'claude-3-opus',
      content: [
        { type: 'text', text: 'I\'ll help you search for that information.' },
        { type: 'tool_use', id: 'tool_1', name: 'web_search', input: { query: 'latest news on AI safety' } },
      ],
    },
  },
};

// Default variant stories
export const Default: Story = {
  args: {
    event: llmCallStartEvent,
    sessionId: 'session-123',
    isFirstEvent: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('llm.call.start')).toBeInTheDocument();
    await expect(canvas.getByText(/Hello, can you help me/)).toBeInTheDocument();
  },
};

export const LLMCallFinish: Story = {
  args: {
    event: llmCallFinishEvent,
    startTime: new Date(Date.now() - 60000),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('llm.call.finish')).toBeInTheDocument();
    await expect(canvas.getByText(/fibonacci function/)).toBeInTheDocument();
  },
};

export const ToolExecution: Story = {
  args: {
    event: toolExecutionEvent,
    startTime: new Date(Date.now() - 60000),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('tool.execution')).toBeInTheDocument();
    await expect(canvas.getByText('code_executor')).toBeInTheDocument();
  },
};

export const ToolResult: Story = {
  args: {
    event: toolResultEvent,
    startTime: new Date(Date.now() - 60000),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('tool.result')).toBeInTheDocument();
    await expect(canvas.getByText(/0, 1, 1, 2, 3, 5/)).toBeInTheDocument();
  },
};

export const WithReplayButton: Story = {
  args: {
    event: llmCallStartEvent,
    sessionId: 'session-123',
    onReplay: fn(),
    isFirstEvent: true,
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
    event: errorEvent,
    startTime: new Date(Date.now() - 60000),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('llm.call.finish')).toBeInTheDocument();
    await expect(canvas.getByText(/Rate limit exceeded/)).toBeInTheDocument();
  },
};

export const WithDuration: Story = {
  args: {
    event: llmCallFinishEvent,
    startTime: new Date(Date.now() - 60000),
    durationMs: 5200,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('llm.call.finish')).toBeInTheDocument();
    await expect(canvas.getByText('5.2s')).toBeInTheDocument();
  },
};

export const WithRawToggle: Story = {
  args: {
    event: llmCallStartEvent,
    sessionId: 'session-123',
    isFirstEvent: true,
  },
  play: async ({ canvas }) => {
    const toggleSummary = canvas.getByText('Show raw event');
    await expect(toggleSummary).toBeInTheDocument();

    await userEvent.click(toggleSummary);
    await expect(canvas.getByText(/Event Type:/)).toBeInTheDocument();
    await expect(canvas.getByText(/llm.request.data/)).toBeInTheDocument();
  },
};

// Response variant stories
export const ResponseVariant: Story = {
  args: {
    event: llmCallFinishEvent,
    variant: 'response',
  },
  play: async ({ canvas }) => {
    // Should show event type badge
    await expect(canvas.getByText('llm.call.finish')).toBeInTheDocument();
    // Should show content
    await expect(canvas.getByText(/fibonacci function/)).toBeInTheDocument();
  },
};

export const ResponseWithToolUse: Story = {
  args: {
    event: responseWithToolUseEvent,
    variant: 'response',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/I'll help you search/)).toBeInTheDocument();
    await expect(canvas.getByText('web_search')).toBeInTheDocument();
  },
};

export const ResponseWithRawToggle: Story = {
  args: {
    event: responseWithToolUseEvent,
    variant: 'response',
    showRawToggle: true,
  },
  play: async ({ canvas }) => {
    const toggleSummary = canvas.getByText('Show raw response');
    await expect(toggleSummary).toBeInTheDocument();

    await userEvent.click(toggleSummary);
    // Raw response should be visible after clicking
    await expect(canvas.getByText(/msg_123/)).toBeInTheDocument();
  },
};

export const ResponseNoRawToggle: Story = {
  args: {
    event: llmCallFinishEvent,
    variant: 'response',
    showRawToggle: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/fibonacci function/)).toBeInTheDocument();
    // Raw toggle should not be present
    const toggleSummary = canvas.queryByText('Show raw response');
    await expect(toggleSummary).not.toBeInTheDocument();
  },
};

export const ResponseErrorState: Story = {
  args: {
    event: errorEvent,
    variant: 'response',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Rate limit exceeded/)).toBeInTheDocument();
  },
};

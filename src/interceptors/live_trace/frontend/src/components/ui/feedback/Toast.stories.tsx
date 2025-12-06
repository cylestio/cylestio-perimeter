import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Toast } from './Toast';

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
`;

const meta: Meta<typeof Toast> = {
  title: 'UI/Feedback/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    description: 'This is an informational message.',
  },
};

export const Variants: Story = {
  render: () => (
    <Stack $gap={16}>
      <Toast variant="info" title="Information" description="This is an informational message." />
      <Toast
        variant="success"
        title="Finding fixed"
        description="SQL injection vulnerability has been patched."
      />
      <Toast
        variant="warning"
        title="Session expiring"
        description="Your session will expire in 5 minutes."
      />
      <Toast
        variant="error"
        title="Scan failed"
        description="Unable to complete the security scan. Please try again."
      />
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Information')).toBeInTheDocument();
    await expect(canvas.getByText('Finding fixed')).toBeInTheDocument();
  },
};

export const WithClose: Story = {
  render: function ToastWithCloseStory() {
    const [show, setShow] = useState(true);
    return show ? (
      <Toast
        variant="success"
        title="Changes saved"
        description="Your settings have been updated successfully."
        onClose={() => setShow(false)}
      />
    ) : (
      <button onClick={() => setShow(true)}>Show Toast</button>
    );
  },
};

export const AutoDismiss: Story = {
  render: function ToastAutoDismissStory() {
    const [show, setShow] = useState(true);
    const [key, setKey] = useState(0);

    useEffect(() => {
      if (!show) {
        const timer = setTimeout(() => {
          setShow(true);
          setKey((k) => k + 1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [show]);

    return show ? (
      <Toast
        key={key}
        variant="info"
        title="Auto-dismissing toast"
        description="This toast will disappear in 3 seconds."
        duration={3000}
        onClose={() => setShow(false)}
      />
    ) : (
      <div style={{ color: 'rgba(255,255,255,0.5)' }}>Toast dismissed. Showing again in 1s...</div>
    );
  },
};

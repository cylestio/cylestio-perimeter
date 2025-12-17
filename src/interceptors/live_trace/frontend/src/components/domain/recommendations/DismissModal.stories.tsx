import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';

import { DismissModal } from './DismissModal';

const meta: Meta<typeof DismissModal> = {
  title: 'Domain/Recommendations/DismissModal',
  component: DismissModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'confirmed' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof DismissModal>;

export const Default: Story = {
  args: {
    recommendationId: 'REC-12345678',
    onConfirm: fn(),
    onCancel: fn(),
  },
  play: async ({ args }) => {
    // Modal renders via portal - verify submit button is disabled without reason
    const submitButton = document.body.querySelector('button[disabled]');
    await expect(submitButton).toBeTruthy();

    // Type reason to enable submit
    const textarea = document.body.querySelector('textarea');
    if (textarea) {
      await userEvent.type(textarea, 'Test reason for compliance');
    }

    // Submit button should now be enabled
    const enabledSubmit = document.body.querySelector('button:not([disabled])');
    await expect(enabledSubmit).toBeTruthy();

    // Click submit
    if (enabledSubmit && enabledSubmit.textContent?.includes('Accept Risk')) {
      await userEvent.click(enabledSubmit);
      await expect(args.onConfirm).toHaveBeenCalledWith('DISMISSED', 'Test reason for compliance');
    }
  },
};

export const CancelButton: Story = {
  args: {
    recommendationId: 'REC-CANCEL',
    onConfirm: fn(),
    onCancel: fn(),
  },
  play: async ({ args }) => {
    // Find and click Cancel button
    const cancelButton = Array.from(document.body.querySelectorAll('button'))
      .find(btn => btn.textContent === 'Cancel');

    if (cancelButton) {
      await userEvent.click(cancelButton);
      await expect(args.onCancel).toHaveBeenCalled();
    }
  },
};

export const SwitchToFalsePositive: Story = {
  args: {
    recommendationId: 'REC-SWITCH',
    defaultType: 'DISMISSED',
    onConfirm: fn(),
    onCancel: fn(),
  },
  play: async ({ args }) => {
    // Click False Positive radio option
    const falsePositiveRadio = document.body.querySelector('input[value="IGNORED"]') as HTMLInputElement;
    if (falsePositiveRadio) {
      await userEvent.click(falsePositiveRadio);
      await expect(falsePositiveRadio.checked).toBe(true);
    }

    // Add reason and submit
    const textarea = document.body.querySelector('textarea');
    if (textarea) {
      await userEvent.type(textarea, 'Not a real issue');
    }

    const submitButton = Array.from(document.body.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('False Positive'));

    if (submitButton) {
      await userEvent.click(submitButton);
      await expect(args.onConfirm).toHaveBeenCalledWith('IGNORED', 'Not a real issue');
    }
  },
};

export const PreselectedIgnored: Story = {
  args: {
    recommendationId: 'REC-XYZ98765',
    defaultType: 'IGNORED',
    onConfirm: fn(),
    onCancel: fn(),
  },
  play: async () => {
    // Verify IGNORED radio is pre-selected
    const ignoredRadio = document.body.querySelector('input[value="IGNORED"]') as HTMLInputElement;
    await expect(ignoredRadio?.checked).toBe(true);
  },
};

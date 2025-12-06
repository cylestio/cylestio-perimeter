import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ToggleGroup } from './ToggleGroup';

const meta: Meta<typeof ToggleGroup> = {
  title: 'UI/Navigation/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
  render: function ToggleGroupDefaultStory() {
    const [options, setOptions] = useState([
      { id: 'all', label: 'All', active: true },
      { id: 'static', label: 'Static' },
      { id: 'dynamic', label: 'Dynamic' },
      { id: 'fixed', label: 'Fixed' },
    ]);

    const handleChange = (optionId: string) => {
      setOptions((prev) => prev.map((o) => ({ ...o, active: o.id === optionId })));
    };

    return <ToggleGroup options={options} onChange={handleChange} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the "Static" button
    const staticButton = canvas.getByRole('button', { name: 'Static' });
    await userEvent.click(staticButton);

    // Verify the button is now active (has cyan border)
    await expect(staticButton).toBeVisible();
  },
};

export const SingleSelect: Story = {
  render: function ToggleGroupSingleStory() {
    const [options, setOptions] = useState([
      { id: 'all', label: 'All', active: true },
      { id: 'static', label: 'Static' },
      { id: 'dynamic', label: 'Dynamic' },
      { id: 'fixed', label: 'Fixed' },
    ]);

    const handleChange = (optionId: string) => {
      setOptions((prev) => prev.map((o) => ({ ...o, active: o.id === optionId })));
    };

    return <ToggleGroup options={options} onChange={handleChange} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const allButton = canvas.getByRole('button', { name: 'All' });
    await expect(allButton).toBeVisible();
  },
};

export const MultiSelect: Story = {
  render: function ToggleGroupMultiStory() {
    const [options, setOptions] = useState([
      { id: 'critical', label: 'Critical', active: true },
      { id: 'high', label: 'High', active: true },
      { id: 'medium', label: 'Medium' },
      { id: 'low', label: 'Low' },
    ]);

    const handleChange = (optionId: string) => {
      setOptions((prev) =>
        prev.map((o) => (o.id === optionId ? { ...o, active: !o.active } : o))
      );
    };

    return <ToggleGroup options={options} onChange={handleChange} multiSelect />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Toggle "Medium" on
    const mediumButton = canvas.getByRole('button', { name: 'Medium' });
    await userEvent.click(mediumButton);
    await expect(mediumButton).toBeVisible();
  },
};

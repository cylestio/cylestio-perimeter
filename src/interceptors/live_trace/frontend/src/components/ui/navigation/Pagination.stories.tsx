import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'UI/Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: function PaginationDefaultStory() {
    const [currentPage, setCurrentPage] = useState(1);
    return (
      <Pagination
        currentPage={currentPage}
        totalPages={5}
        onPageChange={setCurrentPage}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify initial state
    const pageInfo = canvas.getByText('Page 1 of 5');
    await expect(pageInfo).toBeVisible();

    // Click next button
    const nextButton = canvas.getByRole('button', { name: 'Next page' });
    await userEvent.click(nextButton);

    // Verify page changed
    await expect(canvas.getByText('Page 2 of 5')).toBeVisible();
  },
};

export const MiddlePage: Story = {
  render: function PaginationMiddleStory() {
    const [currentPage, setCurrentPage] = useState(3);
    return (
      <Pagination
        currentPage={currentPage}
        totalPages={5}
        onPageChange={setCurrentPage}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Both buttons should be enabled
    const prevButton = canvas.getByRole('button', { name: 'Previous page' });
    const nextButton = canvas.getByRole('button', { name: 'Next page' });

    await expect(prevButton).not.toBeDisabled();
    await expect(nextButton).not.toBeDisabled();

    // Click previous
    await userEvent.click(prevButton);
    await expect(canvas.getByText('Page 2 of 5')).toBeVisible();
  },
};

export const LastPage: Story = {
  render: function PaginationLastStory() {
    const [currentPage, setCurrentPage] = useState(5);
    return (
      <Pagination
        currentPage={currentPage}
        totalPages={5}
        onPageChange={setCurrentPage}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Next button should be disabled
    const nextButton = canvas.getByRole('button', { name: 'Next page' });
    await expect(nextButton).toBeDisabled();

    // Previous should work
    const prevButton = canvas.getByRole('button', { name: 'Previous page' });
    await userEvent.click(prevButton);
    await expect(canvas.getByText('Page 4 of 5')).toBeVisible();
  },
};

export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    onPageChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should not render anything when there's only one page
    const buttons = canvas.queryAllByRole('button');
    await expect(buttons.length).toBe(0);
  },
};

export const ManyPages: Story = {
  render: function PaginationManyStory() {
    const [currentPage, setCurrentPage] = useState(50);
    return (
      <Pagination
        currentPage={currentPage}
        totalPages={100}
        onPageChange={setCurrentPage}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Page 50 of 100')).toBeVisible();
  },
};


import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Shell } from './Shell';
import { Sidebar } from './Sidebar';
import { Main } from '@ui/layout/Main';
import { Content } from '@ui/layout/Content';
import { Logo } from './Logo';

const meta: Meta<typeof Shell> = {
  title: 'Domain/Layout/Shell',
  component: Shell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Shell>;

export const Default: Story = {
  render: () => (
    <Shell>
      <Sidebar>
        <Sidebar.Header>
          <Logo />
        </Sidebar.Header>
        <Sidebar.Section>
          <div style={{ padding: '16px', color: 'rgba(255,255,255,0.5)' }}>
            Navigation content
          </div>
        </Sidebar.Section>
        <Sidebar.Footer>
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>Footer content</div>
        </Sidebar.Footer>
      </Sidebar>
      <Main>
        <Content>
          <div style={{ color: 'rgba(255,255,255,0.9)' }}>Main content area</div>
        </Content>
      </Main>
    </Shell>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Agent Inspector')).toBeInTheDocument();
    await expect(canvas.getByText('Main content area')).toBeInTheDocument();
  },
};

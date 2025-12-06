import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Main } from './Main';
import { TopBar } from '@domain/layout/TopBar';
import { Content } from './Content';
import { Card } from '../core/Card';

const Container = styled.div`
  height: 400px;
  display: flex;
  background: #000;
`;

const meta: Meta<typeof Main> = {
  title: 'UI/Layout/Main',
  component: Main,
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
type Story = StoryObj<typeof Main>;

export const Default: Story = {
  render: () => (
    <Main>
      <TopBar breadcrumb={[{ label: 'Dashboard' }]} />
      <Content>
        <Card>
          <Card.Header title="Main Content Area" />
          <Card.Content>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              This demonstrates the Main component with TopBar and Content.
            </p>
          </Card.Content>
        </Card>
      </Content>
    </Main>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Dashboard')).toBeInTheDocument();
    await expect(canvas.getByText('Main Content Area')).toBeInTheDocument();
  },
};

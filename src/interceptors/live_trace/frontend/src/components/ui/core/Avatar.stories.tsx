import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import styled from 'styled-components';
import { Avatar, AVATAR_COLORS, getColorIndex } from './Avatar';

const Container = styled.div`
  padding: 24px;
  background: #0a0a0f;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const Label = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  width: 80px;
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
`;

const ColorItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const ColorLabel = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
`;

const ColorIndex = styled.span`
  font-size: 9px;
  color: rgba(255, 255, 255, 0.3);
  font-family: monospace;
`;

const meta: Meta<typeof Avatar> = {
  title: 'UI/Core/Avatar',
  component: Avatar,
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
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    initials: 'JD',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('JD')).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: () => (
    <>
      <Row>
        <Label>Small</Label>
        <Avatar initials="SM" size="sm" />
        <Avatar initials="SM" size="sm" variant="user" />
      </Row>
      <Row>
        <Label>Medium</Label>
        <Avatar initials="MD" size="md" />
        <Avatar initials="MD" size="md" variant="user" />
      </Row>
      <Row>
        <Label>Large</Label>
        <Avatar initials="LG" size="lg" />
        <Avatar initials="LG" size="lg" variant="user" />
      </Row>
    </>
  ),
  play: async ({ canvas }) => {
    // Multiple avatars with same initials exist
    await expect(canvas.getAllByText('SM').length).toBeGreaterThan(0);
    await expect(canvas.getAllByText('MD').length).toBeGreaterThan(0);
    await expect(canvas.getAllByText('LG').length).toBeGreaterThan(0);
  },
};

export const Variants: Story = {
  render: () => (
    <>
      <Row>
        <Label>Gradient</Label>
        <Avatar initials="AG" variant="gradient" />
      </Row>
      <Row>
        <Label>User</Label>
        <Avatar initials="US" variant="user" />
      </Row>
    </>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('AG')).toBeInTheDocument();
    await expect(canvas.getByText('US')).toBeInTheDocument();
  },
};

export const WithStatus: Story = {
  render: () => (
    <>
      <Row>
        <Label>Online</Label>
        <Avatar initials="ON" status="online" />
        <Avatar initials="ON" status="online" variant="user" />
      </Row>
      <Row>
        <Label>Offline</Label>
        <Avatar initials="OF" status="offline" />
        <Avatar initials="OF" status="offline" variant="user" />
      </Row>
      <Row>
        <Label>Error</Label>
        <Avatar initials="ER" status="error" />
        <Avatar initials="ER" status="error" variant="user" />
      </Row>
    </>
  ),
  play: async ({ canvas }) => {
    // Multiple avatars with same initials exist
    await expect(canvas.getAllByText('ON').length).toBeGreaterThan(0);
    await expect(canvas.getAllByText('OF').length).toBeGreaterThan(0);
    await expect(canvas.getAllByText('ER').length).toBeGreaterThan(0);
  },
};

export const AgentExample: Story = {
  render: () => (
    <Row>
      <Avatar initials="CA" variant="gradient" status="online" />
      <Avatar initials="SB" variant="gradient" status="online" />
      <Avatar initials="DA" variant="gradient" status="offline" />
      <Avatar initials="EA" variant="gradient" status="error" />
    </Row>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('CA')).toBeInTheDocument();
  },
};

export const UserExample: Story = {
  render: () => (
    <Row>
      <Avatar initials="JD" variant="user" size="md" />
    </Row>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('JD')).toBeInTheDocument();
  },
};

export const ColorVariety: Story = {
  render: () => (
    <>
      <Row>
        <Label>Colors</Label>
        <Avatar initials="PA" />
        <Avatar initials="AM" />
        <Avatar initials="PF" />
        <Avatar initials="CA" />
        <Avatar initials="DA" />
        <Avatar initials="SB" />
        <Avatar initials="RB" />
        <Avatar initials="EA" />
      </Row>
      <Row>
        <Label>Consistent</Label>
        <Avatar initials="PA" />
        <Avatar initials="PA" />
        <Avatar initials="AM" />
        <Avatar initials="AM" />
      </Row>
    </>
  ),
  play: async ({ canvas }) => {
    // Same initials should produce same color
    await expect(canvas.getAllByText('PA').length).toBe(3);
    await expect(canvas.getAllByText('AM').length).toBe(3);
  },
};

// Generate initials that map to each color index
const INITIALS_FOR_COLORS: string[] = [];
const findInitialsForIndex = (targetIndex: number): string => {
  // Try different two-letter combinations until we find one that maps to this index
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < chars.length; i++) {
    for (let j = 0; j < chars.length; j++) {
      const initials = chars[i] + chars[j];
      if (getColorIndex(initials) === targetIndex) {
        return initials;
      }
    }
  }
  return '??';
};

// Pre-compute initials for each color
for (let i = 0; i < AVATAR_COLORS.length; i++) {
  INITIALS_FOR_COLORS.push(findInitialsForIndex(i));
}

export const AllColors: Story = {
  render: () => (
    <ColorGrid>
      {AVATAR_COLORS.map((color, index) => (
        <ColorItem key={index}>
          <Avatar initials={INITIALS_FOR_COLORS[index]} size="lg" />
          <ColorLabel>{color.name}</ColorLabel>
          <ColorIndex>#{index}</ColorIndex>
        </ColorItem>
      ))}
    </ColorGrid>
  ),
  play: async ({ canvas }) => {
    // Should render 16 avatars
    await expect(canvas.getAllByText(/[A-Z]{2}/).length).toBe(16);
  },
};

export const FromName: Story = {
  render: () => (
    <>
      <Row>
        <Label>Names</Label>
        <Avatar name="John Doe" />
        <Avatar name="Alice Smith" />
        <Avatar name="prompt-abc123" />
        <Avatar name="ant-math-agent" />
      </Row>
      <Row>
        <Label>Mixed</Label>
        <Avatar name="Customer Agent" />
        <Avatar initials="CA" />
      </Row>
    </>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('JD')).toBeInTheDocument();
    await expect(canvas.getByText('AS')).toBeInTheDocument();
    await expect(canvas.getByText('PA')).toBeInTheDocument();
    await expect(canvas.getByText('AM')).toBeInTheDocument();
    // Both should show CA
    await expect(canvas.getAllByText('CA').length).toBe(2);
  },
};

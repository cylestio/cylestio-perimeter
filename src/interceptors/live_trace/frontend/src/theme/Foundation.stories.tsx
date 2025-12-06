import type { Meta, StoryObj } from '@storybook/react-vite';
import styled from 'styled-components';
import { colors, typography, spacing, radii } from './theme';
import {
  Activity, AlertTriangle, Check, ChevronDown, ChevronRight, ChevronUp,
  Copy, Edit, Eye, Filter, HelpCircle, Home, Info, Layers, LayoutDashboard,
  LogOut, MoreHorizontal, MoreVertical, Plus, Search, Settings, Shield,
  Trash, User, X, Zap, Bug, FileCode, Lock, Server, Terminal, Box
} from 'lucide-react';

const meta: Meta = {
  title: 'UI/Foundation/Design Tokens',
};

export default meta;

// ===========================================
// COLORS
// ===========================================

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
`;

const ColorSwatch = styled.div<{ $color: string; $isLight?: boolean }>`
  display: flex;
  flex-direction: column;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

const SwatchColor = styled.div<{ $color: string }>`
  height: 64px;
  background: ${({ $color }) => $color};
`;

const SwatchInfo = styled.div`
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.surface2};
`;

const SwatchName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
  margin-bottom: 4px;
`;

const SwatchValue = styled.div`
  font-size: 10px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
`;

const Section = styled.div`
  margin-bottom: 48px;
`;

const SectionTitle = styled.h2`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.cyan};
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const Colors: StoryObj = {
  render: () => {
    const colorGroups = {
      'Core Surfaces': {
        void: colors.void,
        surface: colors.surface,
        surface2: colors.surface2,
        surface3: colors.surface3,
        surface4: colors.surface4,
      },
      'Signal Colors': {
        cyan: colors.cyan,
        green: colors.green,
        orange: colors.orange,
        red: colors.red,
        purple: colors.purple,
        yellow: colors.yellow,
      },
      'Soft Backgrounds': {
        cyanSoft: colors.cyanSoft,
        greenSoft: colors.greenSoft,
        orangeSoft: colors.orangeSoft,
        redSoft: colors.redSoft,
        purpleSoft: colors.purpleSoft,
        yellowSoft: colors.yellowSoft,
      },
      'Text Colors': {
        white: colors.white,
        white90: colors.white90,
        white70: colors.white70,
        white50: colors.white50,
        white30: colors.white30,
        white15: colors.white15,
      },
      'Border Colors': {
        borderSubtle: colors.borderSubtle,
        borderMedium: colors.borderMedium,
        borderStrong: colors.borderStrong,
      },
    };

    return (
      <div>
        {Object.entries(colorGroups).map(([groupName, groupColors]) => (
          <Section key={groupName}>
            <SectionTitle>{groupName}</SectionTitle>
            <ColorGrid>
              {Object.entries(groupColors).map(([name, value]) => (
                <ColorSwatch key={name} $color={value}>
                  <SwatchColor $color={value} />
                  <SwatchInfo>
                    <SwatchName>{name}</SwatchName>
                    <SwatchValue>{value}</SwatchValue>
                  </SwatchInfo>
                </ColorSwatch>
              ))}
            </ColorGrid>
          </Section>
        ))}
      </div>
    );
  },
};

// ===========================================
// TYPOGRAPHY
// ===========================================

const TypeRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

const TypeLabel = styled.div`
  width: 80px;
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
`;

const TypeValue = styled.div`
  width: 60px;
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white30};
`;

const TypeSample = styled.div<{ $size: string }>`
  flex: 1;
  font-size: ${({ $size }) => $size};
  color: ${({ theme }) => theme.colors.white90};
`;

export const Typography: StoryObj = {
  render: () => {
    const sizes = [
      { name: 'textXs', value: typography.textXs },
      { name: 'textSm', value: typography.textSm },
      { name: 'textBase', value: typography.textBase },
      { name: 'textMd', value: typography.textMd },
      { name: 'textLg', value: typography.textLg },
      { name: 'textXl', value: typography.textXl },
      { name: 'text2xl', value: typography.text2xl },
      { name: 'text3xl', value: typography.text3xl },
      { name: 'text4xl', value: typography.text4xl },
    ];

    return (
      <div>
        <Section>
          <SectionTitle>Type Scale (Space Grotesk)</SectionTitle>
          {sizes.map(({ name, value }) => (
            <TypeRow key={name}>
              <TypeLabel>{name}</TypeLabel>
              <TypeValue>{value}</TypeValue>
              <TypeSample $size={value}>
                The quick brown fox jumps over the lazy dog
              </TypeSample>
            </TypeRow>
          ))}
        </Section>

        <Section>
          <SectionTitle>Monospace (JetBrains Mono)</SectionTitle>
          <div style={{ fontFamily: typography.fontMono, fontSize: '14px' }}>
            <code>const agent = new AgentInspector();</code>
          </div>
        </Section>
      </div>
    );
  },
};

// ===========================================
// SPACING
// ===========================================

const SpacingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
`;

const SpacingLabel = styled.div`
  width: 60px;
  font-size: 12px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
`;

const SpacingBar = styled.div<{ $width: string }>`
  width: ${({ $width }) => $width};
  height: 24px;
  background: ${({ theme }) => theme.colors.cyanSoft};
  border: 1px solid ${({ theme }) => theme.colors.cyan};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const SpacingValue = styled.div`
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white30};
`;

export const Spacing: StoryObj = {
  render: () => {
    const spacingTokens = Object.entries(spacing).filter(([key]) => key !== '0');

    return (
      <Section>
        <SectionTitle>Spacing Scale (4px base)</SectionTitle>
        {spacingTokens.map(([name, value]) => (
          <SpacingRow key={name}>
            <SpacingLabel>space-{name}</SpacingLabel>
            <SpacingBar $width={value} />
            <SpacingValue>{value}</SpacingValue>
          </SpacingRow>
        ))}
      </Section>
    );
  },
};

// ===========================================
// BORDER RADIUS
// ===========================================

const RadiusGrid = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
`;

const RadiusItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const RadiusBox = styled.div<{ $radius: string }>`
  width: 64px;
  height: 64px;
  background: ${({ theme }) => theme.colors.surface3};
  border: 2px solid ${({ theme }) => theme.colors.cyan};
  border-radius: ${({ $radius }) => $radius};
`;

const RadiusLabel = styled.div`
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
  text-align: center;
`;

export const BorderRadius: StoryObj = {
  render: () => {
    return (
      <Section>
        <SectionTitle>Border Radius</SectionTitle>
        <RadiusGrid>
          {Object.entries(radii).map(([name, value]) => (
            <RadiusItem key={name}>
              <RadiusBox $radius={value} />
              <RadiusLabel>
                {name}
                <br />
                {value}
              </RadiusLabel>
            </RadiusItem>
          ))}
        </RadiusGrid>
      </Section>
    );
  },
};

// ===========================================
// ICONS
// ===========================================

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
`;

const IconItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
    border-color: ${({ theme }) => theme.colors.cyan};
  }

  svg {
    color: ${({ theme }) => theme.colors.white70};
  }
`;

const IconLabel = styled.div`
  font-size: 10px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
  text-align: center;
`;

export const Icons: StoryObj = {
  render: () => {
    const icons = [
      { name: 'Activity', icon: Activity },
      { name: 'AlertTriangle', icon: AlertTriangle },
      { name: 'Box', icon: Box },
      { name: 'Bug', icon: Bug },
      { name: 'Check', icon: Check },
      { name: 'ChevronDown', icon: ChevronDown },
      { name: 'ChevronRight', icon: ChevronRight },
      { name: 'ChevronUp', icon: ChevronUp },
      { name: 'Copy', icon: Copy },
      { name: 'Edit', icon: Edit },
      { name: 'Eye', icon: Eye },
      { name: 'FileCode', icon: FileCode },
      { name: 'Filter', icon: Filter },
      { name: 'HelpCircle', icon: HelpCircle },
      { name: 'Home', icon: Home },
      { name: 'Info', icon: Info },
      { name: 'Layers', icon: Layers },
      { name: 'LayoutDashboard', icon: LayoutDashboard },
      { name: 'Lock', icon: Lock },
      { name: 'LogOut', icon: LogOut },
      { name: 'MoreHorizontal', icon: MoreHorizontal },
      { name: 'MoreVertical', icon: MoreVertical },
      { name: 'Plus', icon: Plus },
      { name: 'Search', icon: Search },
      { name: 'Server', icon: Server },
      { name: 'Settings', icon: Settings },
      { name: 'Shield', icon: Shield },
      { name: 'Terminal', icon: Terminal },
      { name: 'Trash', icon: Trash },
      { name: 'User', icon: User },
      { name: 'X', icon: X },
      { name: 'Zap', icon: Zap },
    ];

    return (
      <Section>
        <SectionTitle>Icons (Lucide React)</SectionTitle>
        <IconGrid>
          {icons.map(({ name, icon: Icon }) => (
            <IconItem key={name}>
              <Icon size={24} />
              <IconLabel>{name}</IconLabel>
            </IconItem>
          ))}
        </IconGrid>
      </Section>
    );
  },
};

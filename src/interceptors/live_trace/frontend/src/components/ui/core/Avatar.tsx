import type { FC } from 'react';
import { StyledAvatar, StatusIndicator } from './Avatar.styles';
import { getInitials } from '@utils/formatting';

// Types
export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarVariant = 'gradient' | 'user';
export type AvatarStatus = 'online' | 'offline' | 'error';

// Color palette for avatar gradients - 16 distinct color combinations
export const AVATAR_COLORS = [
  { from: '#00f0ff', to: '#00ff88', name: 'Cyan Green' },
  { from: '#a855f7', to: '#ec4899', name: 'Purple Pink' },
  { from: '#f97316', to: '#fbbf24', name: 'Orange Yellow' },
  { from: '#3b82f6', to: '#8b5cf6', name: 'Blue Purple' },
  { from: '#10b981', to: '#06b6d4', name: 'Emerald Cyan' },
  { from: '#f43f5e', to: '#fb923c', name: 'Rose Orange' },
  { from: '#6366f1', to: '#a855f7', name: 'Indigo Purple' },
  { from: '#14b8a6', to: '#22c55e', name: 'Teal Green' },
  { from: '#ec4899', to: '#f43f5e', name: 'Pink Rose' },
  { from: '#8b5cf6', to: '#06b6d4', name: 'Violet Cyan' },
  { from: '#22c55e', to: '#84cc16', name: 'Green Lime' },
  { from: '#0ea5e9', to: '#6366f1', name: 'Sky Indigo' },
  { from: '#f59e0b', to: '#ef4444', name: 'Amber Red' },
  { from: '#84cc16', to: '#10b981', name: 'Lime Emerald' },
  { from: '#ef4444', to: '#a855f7', name: 'Red Purple' },
  { from: '#06b6d4', to: '#3b82f6', name: 'Cyan Blue' },
] as const;

// Hash function to get consistent color index from initials
export const getColorIndex = (initials: string): number => {
  let hash = 0;
  const str = initials.toUpperCase();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
};

export interface AvatarProps {
  /** Two-letter initials to display (takes precedence over name) */
  initials?: string;
  /** Name to auto-generate initials from (e.g., "John Doe" -> "JD", "prompt-abc123" -> "PA") */
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  status?: AvatarStatus;
  className?: string;
  title?: string;
}

// Component
export const Avatar: FC<AvatarProps> = ({
  initials: initialsProp,
  name,
  size = 'md',
  variant = 'gradient',
  status,
  className,
  title,
}) => {
  // Use provided initials, or derive from name
  const initials = initialsProp || (name ? getInitials(name) : '??');
  const colorIndex = getColorIndex(initials);

  return (
    <StyledAvatar
      $size={size}
      $variant={variant}
      $colorIndex={colorIndex}
      className={className}
      title={title || name}
    >
      {initials}
      {status && <StatusIndicator $status={status} $size={size} />}
    </StyledAvatar>
  );
};

import styled from 'styled-components';
import type { ContentMaxWidth, ContentPadding } from './Content';

interface StyledContentProps {
  $maxWidth: ContentMaxWidth;
  $padding: ContentPadding;
}

const maxWidthMap: Record<ContentMaxWidth, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
};

const paddingMap: Record<ContentPadding, string> = {
  sm: '12px',
  md: '16px',
  lg: '24px',
};

export const StyledContent = styled.div<StyledContentProps>`
  flex: 1;
  overflow-y: auto;
  padding: ${({ $padding }) => paddingMap[$padding]};

  > * {
    max-width: ${({ $maxWidth }) => maxWidthMap[$maxWidth]};
    margin-left: auto;
    margin-right: auto;
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.surface2};
    border-radius: ${({ theme }) => theme.radii.full};

    &:hover {
      background: ${({ theme }) => theme.colors.white15};
    }
  }
`;

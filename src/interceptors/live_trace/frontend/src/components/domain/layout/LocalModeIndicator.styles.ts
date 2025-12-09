import styled, { css } from 'styled-components';
import type { StorageMode } from './LocalModeIndicator';

interface LocalModeContainerProps {
  $collapsed: boolean;
}

export const LocalModeContainer = styled.div<LocalModeContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.md};
  min-height: 82px;
  cursor: default;
`;

export const LocalModeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.greenSoft};
  color: ${({ theme }) => theme.colors.green};
`;

export const LocalModeInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};

  > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

interface StorageBadgeProps {
  $mode: StorageMode;
}

export const StorageBadge = styled.div<StorageBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;

  ${({ $mode, theme }) =>
    $mode === 'memory'
      ? css`
          background: ${theme.colors.orangeSoft};
          color: ${theme.colors.orange};
        `
      : css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `}
`;

export const TooltipPath = styled.div`
  margin-top: ${({ theme }) => theme.spacing[2]};
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;


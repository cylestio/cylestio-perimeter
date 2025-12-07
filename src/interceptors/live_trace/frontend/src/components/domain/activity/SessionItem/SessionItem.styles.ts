import styled, { css } from 'styled-components';

interface SessionItemWrapperProps {
  $isActive: boolean;
}

export const SessionItemWrapper = styled.div<SessionItemWrapperProps>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
    background: ${({ theme }) => theme.colors.surface3};
  }

  ${({ $isActive, theme }) =>
    $isActive &&
    css`
      border-color: ${theme.colors.cyan};
      background: ${theme.colors.cyanSoft};

      &:hover {
        border-color: ${theme.colors.cyan};
      }
    `}
`;

export const SessionInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const SessionMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing[1]};
  flex-shrink: 0;
`;

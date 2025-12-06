import styled, { css } from 'styled-components';

interface ChainContainerProps {
  $dangerous?: boolean;
}

export const ChainContainer = styled.div<ChainContainerProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};

  ${({ $dangerous, theme }) =>
    $dangerous &&
    css`
      border-color: ${theme.colors.red};
      background: linear-gradient(
        135deg,
        ${theme.colors.redSoft} 0%,
        ${theme.colors.surface2} 100%
      );
    `}
`;

interface ChainStepProps {
  $risky?: boolean;
}

export const ChainStep = styled.span<ChainStepProps>`
  padding: 6px 10px;
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white70};

  ${({ $risky, theme }) =>
    $risky &&
    css`
      background: ${theme.colors.redSoft};
      color: ${theme.colors.red};
    `}
`;

export const ChainArrow = styled.span`
  display: flex;
  color: ${({ theme }) => theme.colors.white30};
`;

export const BadgeContainer = styled.div`
  flex-shrink: 0;
`;

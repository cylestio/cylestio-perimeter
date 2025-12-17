import styled, { css } from 'styled-components';
import type { CardVariant, CardStatus } from './Card';
import { Heading } from './Heading';

// ===========================================
// BASE CARD (shared foundation)
// ===========================================

export const BaseCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

// ===========================================
// CARD
// ===========================================

interface StyledCardProps {
  $variant: CardVariant;
  $status?: CardStatus;
}

const statusBorderColors: Record<CardStatus, string> = {
  critical: 'severityCritical',
  high: 'severityHigh',
  success: 'green',
};

export const StyledCard = styled(BaseCard)<StyledCardProps>`
  ${({ $variant, $status, theme }) => {
    switch ($variant) {
      case 'elevated':
        return css`
          border: 2px solid ${theme.colors.cyan};
          box-shadow: ${theme.shadows.glowCyan};
        `;
      case 'status': {
        const borderColor = $status ? statusBorderColors[$status] : 'borderMedium';
        return css`
          border: 1px solid ${theme.colors.borderMedium};
          border-left: 4px solid ${theme.colors[borderColor as keyof typeof theme.colors]};
        `;
      }
      default:
        return css``;
    }
  }}
`;

// ===========================================
// CARD HEADER
// ===========================================

interface StyledCardHeaderProps {
  $centered?: boolean;
}

export const StyledCardHeader = styled.div<StyledCardHeaderProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderMedium};

  ${({ $centered }) =>
    $centered &&
    css`
      flex-direction: column;
      text-align: center;
      gap: ${({ theme }) => theme.spacing[2]};
    `}
`;

export const CardHeaderTitle = styled(Heading).attrs({ level: 3, size: 'sm' })``;

export const CardHeaderSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.5;
  margin: 0;
`;

export const CardHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// ===========================================
// CARD CONTENT
// ===========================================

interface StyledCardContentProps {
  $noPadding: boolean;
}

export const StyledCardContent = styled.div<StyledCardContentProps>`
  ${({ $noPadding }) =>
    !$noPadding &&
    css`
      padding: 20px;
    `}
`;

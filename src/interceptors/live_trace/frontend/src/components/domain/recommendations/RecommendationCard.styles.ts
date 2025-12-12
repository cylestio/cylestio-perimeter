import styled, { css } from 'styled-components';
import type { FindingSeverity } from '@api/types/findings';

// Severity color mapping
const getSeverityColor = (severity: FindingSeverity, theme: any) => {
  switch (severity) {
    case 'CRITICAL':
      return theme.colors.red;
    case 'HIGH':
      return theme.colors.orange;
    case 'MEDIUM':
      return theme.colors.yellow;
    case 'LOW':
      return theme.colors.blue;
    default:
      return theme.colors.white50;
  }
};

const getSeverityBackground = (severity: FindingSeverity, theme: any) => {
  switch (severity) {
    case 'CRITICAL':
      return theme.colors.redSoft;
    case 'HIGH':
      return theme.colors.orangeSoft;
    case 'MEDIUM':
      return theme.colors.yellowSoft;
    case 'LOW':
      return theme.colors.blueSoft;
    default:
      return theme.colors.surface2;
  }
};

interface CardWrapperProps {
  $severity: FindingSeverity;
}

export const CardWrapper = styled.div<CardWrapperProps>`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $severity, theme }) => `${getSeverityColor($severity, theme)}30`};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ $severity, theme }) => `${getSeverityColor($severity, theme)}50`};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const RecommendationId = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.cyanSoft};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

interface SourceBadgeProps {
  $type: 'STATIC' | 'DYNAMIC';
}

export const SourceBadge = styled.span<SourceBadgeProps>`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  
  ${({ $type, theme }) =>
    $type === 'STATIC'
      ? css`
          color: ${theme.colors.purple};
          background: ${theme.colors.purpleSoft};
        `
      : css`
          color: ${theme.colors.green};
          background: ${theme.colors.greenSoft};
        `}
`;

export const CardTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

interface SeverityIconWrapperProps {
  $severity: FindingSeverity;
}

export const SeverityIconWrapper = styled.div<SeverityIconWrapperProps>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  flex-shrink: 0;
  background: ${({ $severity, theme }) => getSeverityBackground($severity, theme)};
  color: ${({ $severity, theme }) => getSeverityColor($severity, theme)};
`;

export const TitleContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
  line-height: 1.3;
`;

export const CardDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const LocationRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const LocationPath = styled.code`
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const LocationFunction = styled.span`
  color: ${({ theme }) => theme.colors.white70};
  
  &::before {
    content: '→';
    margin: 0 ${({ theme }) => theme.spacing[1]};
    color: ${({ theme }) => theme.colors.white30};
  }
`;

export const BadgesRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const FixActionRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px dashed ${({ theme }) => theme.colors.borderSubtle};
`;

export const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-top: ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.white};
    border-color: ${({ theme }) => theme.colors.borderMedium};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const DismissDropdownContainer = styled.div`
  position: relative;
  margin-left: auto;
`;

export const DismissButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white50};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.orange};
    border-color: ${({ theme }) => theme.colors.orange};
  }
`;

interface StatusBadgeProps {
  $status: string;
}

export const StatusBadge = styled.span<StatusBadgeProps>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'FIXING':
        return css`
          color: ${theme.colors.yellow};
          background: ${theme.colors.yellowSoft};
        `;
      case 'FIXED':
        return css`
          color: ${theme.colors.green};
          background: ${theme.colors.greenSoft};
        `;
      case 'VERIFIED':
        return css`
          color: ${theme.colors.cyan};
          background: ${theme.colors.cyanSoft};
        `;
      case 'DISMISSED':
      case 'IGNORED':
        return css`
          color: ${theme.colors.white50};
          background: ${theme.colors.surface2};
        `;
      default:
        return css`
          color: ${theme.colors.white70};
          background: ${theme.colors.surface2};
        `;
    }
  }}
`;


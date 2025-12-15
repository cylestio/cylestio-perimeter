import styled, { css } from 'styled-components';
import type { CheckStatus } from '@api/types/findings';

interface CardProps {
  $status: CheckStatus;
  $expanded?: boolean;
}

const getStatusStyles = ($status: CheckStatus) => {
  switch ($status) {
    case 'PASS':
      return css`
        border-left-color: ${({ theme }) => theme.colors.green};
        &:hover {
          background: ${({ theme }) => theme.colors.greenSoft};
        }
      `;
    case 'FAIL':
      return css`
        border-left-color: ${({ theme }) => theme.colors.red};
        background: rgba(255, 71, 87, 0.04);
        &:hover {
          background: rgba(255, 71, 87, 0.08);
        }
      `;
    case 'INFO':
      return css`
        border-left-color: ${({ theme }) => theme.colors.yellow};
        &:hover {
          background: ${({ theme }) => theme.colors.yellowSoft};
        }
      `;
    default:
      return css``;
  }
};

export const CardWrapper = styled.div<CardProps>`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-left-width: 3px;
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.base};
  cursor: pointer;
  
  ${({ $status }) => getStatusStyles($status)}
  
  ${({ $expanded, theme }) => $expanded && css`
    border-color: ${theme.colors.borderMedium};
  `}
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const CardHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex: 1;
  min-width: 0;
`;

export const StatusIcon = styled.div<{ $status: CheckStatus }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.full};
  flex-shrink: 0;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'PASS':
        return css`
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `;
      case 'FAIL':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.red};
        `;
      case 'INFO':
        return css`
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.yellow};
        `;
    }
  }}
`;

export const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 0;
`;

export const CategoryName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
`;

export const CategoryDescription = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CardHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
`;

export const FindingsCount = styled.div<{ $hasFindings: boolean; $isResolved?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  font-size: 11px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.sm};
  
  ${({ $hasFindings, $isResolved, theme }) => {
    if ($isResolved) {
      // All findings resolved - show green
      return css`
        background: ${theme.colors.greenSoft};
        color: ${theme.colors.green};
      `;
    }
    if ($hasFindings) {
      // Has open findings - show red
      return css`
        background: ${theme.colors.redSoft};
        color: ${theme.colors.red};
      `;
    }
    return css`
      background: ${theme.colors.surface2};
      color: ${theme.colors.white50};
    `;
  }}
`;

export const SeverityBadge = styled.div<{ $severity: string }>`
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-radius: ${({ theme }) => theme.radii.sm};
  
  ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.severityCritical};
        `;
      case 'HIGH':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.severityHigh};
        `;
      case 'MEDIUM':
        return css`
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.severityMedium};
        `;
      case 'LOW':
        return css`
          background: ${theme.colors.surface3};
          color: ${theme.colors.severityLow};
        `;
      default:
        return css``;
    }
  }}
`;

export const ExpandIcon = styled.div<{ $expanded: boolean }>`
  color: ${({ theme }) => theme.colors.white30};
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
`;

export const CardBody = styled.div`
  padding: 0 ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const FindingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[3]};
`;

export const BadgesRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

// Findings grouping styles
export const FindingsGroup = styled.div`
  margin-top: ${({ theme }) => theme.spacing[3]};
  
  &:first-of-type {
    margin-top: ${({ theme }) => theme.spacing[2]};
  }
`;

export const FindingsGroupHeader = styled.div<{ $variant: 'open' | 'resolved' }>`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.sm};
  
  ${({ $variant, theme }) => {
    if ($variant === 'open') {
      return css`
        color: ${theme.colors.yellow};
        background: ${theme.colors.yellowSoft};
      `;
    }
    return css`
      color: ${theme.colors.green};
      background: ${theme.colors.greenSoft};
    `;
  }}
`;

import styled, { css, keyframes } from 'styled-components';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const StatusIcon = styled.span<{ $status: 'in_progress' | 'completed' | 'pass' | 'fail' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'in_progress':
        return theme.colors.cyan;
      case 'pass':
        return theme.colors.green;
      case 'fail':
        return theme.colors.red;
      default:
        return theme.colors.white50;
    }
  }};

  ${({ $status }) =>
    $status === 'in_progress' &&
    css`
      svg {
        animation: ${spin} 1s linear infinite;
      }
    `}
`;

export const TypeBadge = styled.span<{ $type: 'STATIC' | 'AUTOFIX' | 'DYNAMIC' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'STATIC':
        return theme.colors.cyanSoft;
      case 'AUTOFIX':
        return theme.colors.purpleSoft;
      case 'DYNAMIC':
        return theme.colors.orangeSoft;
      default:
        return theme.colors.white08;
    }
  }};

  color: ${({ $type, theme }) => {
    switch ($type) {
      case 'STATIC':
        return theme.colors.cyan;
      case 'AUTOFIX':
        return theme.colors.purple;
      case 'DYNAMIC':
        return theme.colors.orange;
      default:
        return theme.colors.white50;
    }
  }};
`;

export const FindingsCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SeverityDot = styled.span<{ $severity: 'critical' | 'high' | 'medium' | 'low' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightBold};

  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'critical':
        return theme.colors.redSoft;
      case 'high':
        return theme.colors.orangeSoft;
      case 'medium':
        return theme.colors.yellowSoft;
      case 'low':
        return theme.colors.cyanSoft;
      default:
        return theme.colors.white08;
    }
  }};

  color: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'critical':
        return theme.colors.red;
      case 'high':
        return theme.colors.orange;
      case 'medium':
        return theme.colors.yellow;
      case 'low':
        return theme.colors.cyan;
      default:
        return theme.colors.white50;
    }
  }};
`;

export const NoFindings = styled.span`
  color: ${({ theme }) => theme.colors.white30};
  font-size: 13px;
`;

export const ActionsCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
    color: ${({ theme }) => theme.colors.white};
  }
`;

export const AgentCell = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

import styled from 'styled-components';

// Hero CTA Section (toned down)
export const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  svg:first-child {
    color: ${({ theme }) => theme.colors.cyan};
    margin-bottom: ${({ theme }) => theme.spacing[3]};
    opacity: 0.8;
  }
`;

export const HeroTitle = styled.h3`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

export const HeroDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  max-width: 480px;
  line-height: 1.5;
  margin: 0 0 ${({ theme }) => theme.spacing[5]} 0;
`;

export const GenerateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[5]}`};
  background: ${({ theme }) => theme.colors.cyan};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.void};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.red};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  font-size: 13px;
`;

// Table cell components
export const StatusIcon = styled.div<{ $status: 'blocked' | 'open' }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $status, theme }) =>
    $status === 'blocked' ? theme.colors.redSoft : theme.colors.greenSoft};
  color: ${({ $status, theme }) =>
    $status === 'blocked' ? theme.colors.red : theme.colors.green};
`;

export const ActionsCell = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const IconButton = styled.button`
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${({ theme }) => theme.colors.white};
    background: ${({ theme }) => theme.colors.surface2};
  }

  &.danger:hover {
    color: ${({ theme }) => theme.colors.red};
    background: ${({ theme }) => theme.colors.redSoft};
  }
`;

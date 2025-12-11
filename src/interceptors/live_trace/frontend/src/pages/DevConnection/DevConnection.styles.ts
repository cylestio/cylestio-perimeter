import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const DevConnectionLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[6]};
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

export const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  display: flex;
  align-items: center;
`;

export const PageSubtitle = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surface3};
    border-color: ${({ theme }) => theme.colors.cyan};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: ${spin} 1s linear infinite;
  }
`;

interface ConnectionStatusProps {
  $connected: boolean;
}

export const ConnectionStatus = styled.div<ConnectionStatusProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[5]};
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ $connected, theme }) => 
    $connected 
      ? `linear-gradient(135deg, ${theme.colors.greenSoft} 0%, ${theme.colors.surface} 100%)`
      : `linear-gradient(135deg, ${theme.colors.surface2} 0%, ${theme.colors.surface} 100%)`
  };
  border: 1px solid ${({ $connected, theme }) => 
    $connected ? `${theme.colors.green}40` : theme.colors.borderSubtle
  };
  border-radius: ${({ theme }) => theme.radii.xl};
`;

export const StatusIcon = styled.div<ConnectionStatusProps>`
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $connected, theme }) => 
    $connected ? theme.colors.greenSoft : theme.colors.white08
  };
  color: ${({ $connected, theme }) => 
    $connected ? theme.colors.green : theme.colors.white30
  };
  flex-shrink: 0;
`;

export const StatusContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const StatusTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const StatusDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
`;

export const IDEList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

interface IDECardProps {
  $connected: boolean;
}

export const IDECard = styled.div<IDECardProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $connected, theme }) => 
    $connected ? `${theme.colors.green}40` : theme.colors.borderSubtle
  };
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ $connected, theme }) => 
      $connected ? `${theme.colors.green}60` : theme.colors.borderMedium
    };
  }
`;

export const IDEIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 24px;
  flex-shrink: 0;
`;

export const IDEInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const IDEName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
`;

export const IDEDescription = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const IDEStatus = styled.span<IDECardProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 12px;
  font-weight: 500;
  color: ${({ $connected, theme }) => 
    $connected ? theme.colors.green : theme.colors.white30
  };
`;

export const SetupSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

export const Step = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const StepNumber = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.cyanSoft};
  color: ${({ theme }) => theme.colors.cyan};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
`;

export const StepContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const StepTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const StepDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  line-height: 1.5;
`;

export const CodeBlock = styled.pre`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[4]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
  overflow-x: auto;
  margin: ${({ theme }) => theme.spacing[2]} 0 0;
  white-space: pre-wrap;
  word-break: break-all;
`;

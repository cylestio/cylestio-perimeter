import styled, { keyframes, css } from 'styled-components';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px ${({ theme }) => theme.colors.green}40; }
  50% { box-shadow: 0 0 20px ${({ theme }) => theme.colors.green}80; }
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
  color: ${({ theme }) => theme.colors.cyan};
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

// Live indicator for actively developing
interface LiveIndicatorProps {
  $isDeveloping?: boolean;
}

export const LiveIndicator = styled.div<LiveIndicatorProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  background: ${({ $isDeveloping, theme }) =>
    $isDeveloping ? theme.colors.orangeSoft : theme.colors.greenSoft};
  border: 1px solid ${({ $isDeveloping, theme }) =>
    $isDeveloping ? `${theme.colors.orange}60` : `${theme.colors.green}60`};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 11px;
  font-weight: 600;
  color: ${({ $isDeveloping, theme }) =>
    $isDeveloping ? theme.colors.orange : theme.colors.green};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $isDeveloping }) =>
    $isDeveloping &&
    css`
      animation: ${pulse} 1.5s ease-in-out infinite;
    `}
`;

export const LiveDot = styled.span<LiveIndicatorProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $isDeveloping, theme }) =>
    $isDeveloping ? theme.colors.orange : theme.colors.green};

  ${({ $isDeveloping }) =>
    $isDeveloping &&
    css`
      animation: ${pulse} 1s ease-in-out infinite;
    `}
`;

// Connection details card
export const ConnectionDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

export const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  min-width: 150px;
  max-width: 350px;
`;

export const DetailLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white30};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
`;

export const DetailValue = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
  font-family: ${({ theme }) => theme.typography.fontMono};
  word-break: break-all;
  overflow-wrap: break-word;
`;

// Connection history
export const ConnectionHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const HistoryIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.white50};
`;

export const HistoryInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const HistoryTitle = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

export const HistoryMeta = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

// Developing banner
export const DevelopingBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.orangeSoft} 0%, ${({ theme }) => theme.colors.surface} 100%);
  border: 1px solid ${({ theme }) => theme.colors.orange}40;
  border-radius: ${({ theme }) => theme.radii.lg};
  animation: ${glow} 2s ease-in-out infinite;
`;

export const DevelopingIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.orangeSoft};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.orange};
`;

export const DevelopingContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const DevelopingTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const DevelopingDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
`;

// Copy button for instructions
interface CopyButtonProps {
  $copied?: boolean;
}

export const CopyButton = styled.button<CopyButtonProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[5]}`};
  background: ${({ $copied, theme }) =>
    $copied ? theme.colors.greenSoft : theme.colors.cyanSoft};
  border: 1px solid ${({ $copied, theme }) =>
    $copied ? `${theme.colors.green}60` : `${theme.colors.cyan}60`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ $copied, theme }) =>
    $copied ? theme.colors.green : theme.colors.cyan};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  margin-top: ${({ theme }) => theme.spacing[4]};

  &:hover:not(:disabled) {
    background: ${({ $copied, theme }) =>
      $copied ? theme.colors.greenSoft : theme.colors.cyan}20;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Quick setup card
export const QuickSetupCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.cyanSoft} 0%, ${({ theme }) => theme.colors.surface} 100%);
  border: 1px solid ${({ theme }) => theme.colors.cyan}30;
  border-radius: ${({ theme }) => theme.radii.xl};
`;

export const QuickSetupTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
`;

export const QuickSetupDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  max-width: 500px;
`;

export const QuickSetupCode = styled.code`
  display: block;
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[4]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
  word-break: break-all;
  max-width: 100%;
`;

// Inline connection details variant
export const InlineConnectionDetails = styled(ConnectionDetails)`
  margin-top: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: rgba(0, 0, 0, 0.2);
`;

// Step description with top margin for grouped descriptions
export const StepDescriptionWithMargin = styled(StepDescription)`
  margin-top: ${({ theme }) => theme.spacing[3]};
`;

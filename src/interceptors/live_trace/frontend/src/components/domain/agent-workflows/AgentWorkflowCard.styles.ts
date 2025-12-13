import styled from 'styled-components';

interface CardContainerProps {
  $clickable: boolean;
}

export const CardContainer = styled.div<CardContainerProps>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: 12px;
  overflow: hidden;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.cyan};
    transform: translateY(-2px);
  }
`;

export const CardHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const IconContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.cyanSoft};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.cyan};
`;

export const AgentWorkflowInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const AgentWorkflowName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const AgentWorkflowId = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white30};
  font-family: ${({ theme }) => theme.typography.fontMono};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CardBody = styled.div`
  padding: 16px;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

export const StatItem = styled.div`
  text-align: center;
`;

interface StatValueProps {
  $color?: 'cyan' | 'purple' | 'green' | 'orange';
}

export const StatValue = styled.div<StatValueProps>`
  font-size: 20px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ $color, theme }) => {
    switch ($color) {
      case 'cyan':
        return theme.colors.cyan;
      case 'purple':
        return theme.colors.purple;
      case 'green':
        return theme.colors.green;
      case 'orange':
        return theme.colors.orange;
      default:
        return theme.colors.white;
    }
  }};
`;

export const StatLabel = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white30};
  text-transform: uppercase;
`;

export const CardFooter = styled.div`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surface2};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const ViewButton = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  transition: color 0.2s;

  ${CardContainer}:hover & {
    color: ${({ theme }) => theme.colors.cyan};
  }
`;

import styled, { css } from 'styled-components';

export const StatusCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const StatusCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const ScanTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
`;

export const ScanMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

export const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const MetaSeparator = styled.span`
  color: ${({ theme }) => theme.colors.white30};
`;

export const StatusCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const GateSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const SeveritySummary = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
`;

interface SeverityItemProps {
  $severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const severityStyles: Record<string, ReturnType<typeof css>> = {
  CRITICAL: css`
    color: ${({ theme }) => theme.colors.red};
    border-color: ${({ theme }) => theme.colors.red};
    background: ${({ theme }) => theme.colors.redSoft};
  `,
  HIGH: css`
    color: ${({ theme }) => theme.colors.orange};
    border-color: ${({ theme }) => theme.colors.orange};
    background: ${({ theme }) => theme.colors.orangeSoft};
  `,
  MEDIUM: css`
    color: ${({ theme }) => theme.colors.yellow};
    border-color: ${({ theme }) => theme.colors.yellow};
    background: ${({ theme }) => theme.colors.yellowSoft};
  `,
  LOW: css`
    color: ${({ theme }) => theme.colors.white50};
    border-color: ${({ theme }) => theme.colors.white30};
    background: ${({ theme }) => theme.colors.white08};
  `,
};

export const SeverityItem = styled.div<SeverityItemProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border: 1px solid;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};

  ${({ $severity }) => severityStyles[$severity]}
`;

export const SeverityCount = styled.span`
  font-weight: 700;
`;

export const SeverityLabel = styled.span`
  text-transform: uppercase;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const EmptyTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
`;

export const EmptyDescription = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  max-width: 300px;
`;

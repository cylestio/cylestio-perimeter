import styled, { css } from 'styled-components';

import type { FindingSeverity } from '@api/types/findings';

export const FindingsTabWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  width: 100%;
`;

export const SummaryBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
`;

interface SummaryItemProps {
  $severity?: FindingSeverity;
}

const getSeverityColor = (severity?: FindingSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return css`
        border-color: ${({ theme }) => theme.colors.red};
        background: ${({ theme }) => theme.colors.redSoft};
      `;
    case 'HIGH':
      return css`
        border-color: ${({ theme }) => theme.colors.orange};
        background: ${({ theme }) => theme.colors.orangeSoft};
      `;
    case 'MEDIUM':
      return css`
        border-color: ${({ theme }) => theme.colors.yellow};
        background: ${({ theme }) => theme.colors.yellowSoft};
      `;
    case 'LOW':
      return css`
        border-color: ${({ theme }) => theme.colors.cyan};
        background: ${({ theme }) => theme.colors.cyanSoft};
      `;
    default:
      return css`
        border-color: ${({ theme }) => theme.colors.borderMedium};
        background: ${({ theme }) => theme.colors.surface3};
      `;
  }
};

export const SummaryItem = styled.div<SummaryItemProps>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid;
  border-radius: ${({ theme }) => theme.radii.md};
  flex: 1;

  ${({ $severity }) => getSeverityColor($severity)}
`;

export const SummaryLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white70};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
`;

export const SummaryValue = styled.div`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white90};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
`;

export const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const FindingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.colors.red};
  background: ${({ theme }) => theme.colors.redSoft};
  border: 1px solid ${({ theme }) => theme.colors.red};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textMd};
`;

export const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[10]};
`;

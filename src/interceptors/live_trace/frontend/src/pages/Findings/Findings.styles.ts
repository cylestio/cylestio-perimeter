import styled from 'styled-components';

export const TabsWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const TableWrapper = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const SeverityCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const LocationCell = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white70};
`;

export const StatusCell = styled.div`
  display: flex;
  align-items: center;
`;

export const TitleCell = styled.span`
  font-size: ${({ theme }) => theme.typography.textBase};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white90};
`;

import styled from 'styled-components';

export const PrimarySection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const PrimaryLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const PrimaryValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white90};
  word-break: break-all;
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const StatItem = styled.div``;

export const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
`;

export const BadgeSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

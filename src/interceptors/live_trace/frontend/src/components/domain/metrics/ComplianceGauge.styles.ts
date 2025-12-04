import styled from 'styled-components';

export const GaugeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const GaugeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const GaugeLabel = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white70};
`;

interface GaugeValueProps {
  $value: number;
}

const getGaugeColor = (value: number, theme: { colors: Record<string, string> }) => {
  if (value >= 80) return theme.colors.green;
  if (value >= 50) return theme.colors.orange;
  return theme.colors.red;
};

export const GaugeValue = styled.span<GaugeValueProps>`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $value }) => getGaugeColor($value, theme)};
`;

export const GaugeBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.white08};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

interface GaugeProgressProps {
  $value: number;
}

export const GaugeProgress = styled.div<GaugeProgressProps>`
  height: 100%;
  width: ${({ $value }) => $value}%;
  background: ${({ theme, $value }) => getGaugeColor($value, theme)};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width 0.5s ease;
`;

export const GaugeStats = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white30};
`;

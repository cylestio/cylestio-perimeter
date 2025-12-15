import styled from 'styled-components';

export type DistributionColor = 'cyan' | 'purple' | 'green' | 'orange' | 'red';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const BarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 20px;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
`;

interface SegmentProps {
  $width: number;
  $color: DistributionColor;
}

export const Segment = styled.div<SegmentProps>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ theme, $color }) => {
    switch ($color) {
      case 'purple':
        return theme.colors.purple;
      case 'green':
        return theme.colors.green;
      case 'orange':
        return theme.colors.orange;
      case 'red':
        return theme.colors.red;
      default:
        return theme.colors.cyan;
    }
  }};
  transition: width 0.3s ease;
`;

export const LabelsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const LabelItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

interface ColorDotProps {
  $color: DistributionColor;
}

export const ColorDot = styled.div<ColorDotProps>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $color }) => {
    switch ($color) {
      case 'purple':
        return theme.colors.purple;
      case 'green':
        return theme.colors.green;
      case 'orange':
        return theme.colors.orange;
      case 'red':
        return theme.colors.red;
      default:
        return theme.colors.cyan;
    }
  }};
`;

export const LabelName = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
`;

export const LabelValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
`;

export const LabelPercent = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

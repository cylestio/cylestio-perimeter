import styled, { css } from 'styled-components';
import type { RiskLevel } from './RiskScore';

const getRiskColor = ($level: RiskLevel, theme: { colors: Record<string, string> }) => {
  switch ($level) {
    case 'low':
      return theme.colors.green;
    case 'medium':
    case 'high':
      return theme.colors.orange;
    case 'critical':
      return theme.colors.red;
  }
};

export const HeroContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

interface RingSvgProps {
  $size: number;
}

export const RingSvg = styled.svg<RingSvgProps>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  transform: rotate(-90deg);
`;

interface RingTrackProps {
  $stroke: number;
}

export const RingTrack = styled.circle<RingTrackProps>`
  fill: none;
  stroke: ${({ theme }) => theme.colors.white08};
  stroke-width: ${({ $stroke }) => $stroke}px;
`;

interface RingProgressProps {
  $stroke: number;
  $level: RiskLevel;
}

export const RingProgress = styled.circle<RingProgressProps>`
  fill: none;
  stroke: ${({ theme, $level }) => getRiskColor($level, theme)};
  stroke-width: ${({ $stroke }) => $stroke}px;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
`;

export const ScoreCenter = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

interface ScoreValueProps {
  $fontSize: number;
  $level: RiskLevel;
}

export const ScoreValue = styled.span<ScoreValueProps>`
  font-size: ${({ $fontSize }) => $fontSize}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $level }) => getRiskColor($level, theme)};
  line-height: 1;
`;

export const ScoreLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export const CompactContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

interface CompactScoreProps {
  $level: RiskLevel;
}

export const CompactScore = styled.span<CompactScoreProps>`
  font-size: 28px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $level }) => getRiskColor($level, theme)};
`;

interface CompactBadgeProps {
  $level: RiskLevel;
}

export const CompactBadge = styled.span<CompactBadgeProps>`
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};

  ${({ $level, theme }) => {
    switch ($level) {
      case 'low':
        return css`
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `;
      case 'medium':
      case 'high':
        return css`
          background: ${theme.colors.orangeSoft};
          color: ${theme.colors.orange};
        `;
      case 'critical':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.red};
        `;
    }
  }}
`;

interface CompactChangeProps {
  $positive: boolean;
}

export const CompactChange = styled.span<CompactChangeProps>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $positive }) =>
    $positive ? theme.colors.red : theme.colors.green};
`;

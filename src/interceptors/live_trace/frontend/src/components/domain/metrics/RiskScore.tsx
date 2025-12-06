import type { FC } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  HeroContainer,
  RingSvg,
  RingTrack,
  RingProgress,
  ScoreCenter,
  ScoreValue,
  ScoreLabel,
  CompactContainer,
  CompactScore,
  CompactBadge,
  CompactChange,
} from './RiskScore.styles';

// Types
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskScoreSize = 'sm' | 'md' | 'lg';

export interface RiskScoreProps {
  value: number;
  variant?: 'hero' | 'compact';
  showChange?: boolean;
  change?: number;
  size?: RiskScoreSize;
}

// Helpers
const getRiskLevel = (value: number): RiskLevel => {
  if (value <= 30) return 'low';
  if (value <= 60) return 'medium';
  if (value <= 80) return 'high';
  return 'critical';
};

const getRiskLabel = (level: RiskLevel): string => {
  switch (level) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    case 'critical':
      return 'Critical Risk';
  }
};

const sizeMap: Record<RiskScoreSize, { size: number; stroke: number; fontSize: number }> = {
  sm: { size: 80, stroke: 6, fontSize: 24 },
  md: { size: 100, stroke: 7, fontSize: 32 },
  lg: { size: 140, stroke: 8, fontSize: 48 },
};

// Component
export const RiskScore: FC<RiskScoreProps> = ({
  value,
  variant = 'hero',
  showChange = false,
  change = 0,
  size = 'md',
}) => {
  const riskLevel = getRiskLevel(value);
  const clampedValue = Math.max(0, Math.min(100, value));

  if (variant === 'compact') {
    return (
      <CompactContainer>
        <CompactScore $level={riskLevel}>{clampedValue}</CompactScore>
        <CompactBadge $level={riskLevel}>{getRiskLabel(riskLevel)}</CompactBadge>
        {showChange && change !== 0 && (
          <CompactChange $positive={change > 0}>
            {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}
          </CompactChange>
        )}
      </CompactContainer>
    );
  }

  const { size: svgSize, stroke, fontSize } = sizeMap[size];
  const radius = (svgSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (clampedValue / 100) * circumference;
  const offset = circumference - progress;

  return (
    <HeroContainer>
      <RingSvg $size={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <RingTrack
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          $stroke={stroke}
        />
        <RingProgress
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          $stroke={stroke}
          $level={riskLevel}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </RingSvg>
      <ScoreCenter>
        <ScoreValue $fontSize={fontSize} $level={riskLevel}>
          {clampedValue}
        </ScoreValue>
        <ScoreLabel>{getRiskLabel(riskLevel)}</ScoreLabel>
        {showChange && change !== 0 && (
          <CompactChange $positive={change > 0}>
            {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}
          </CompactChange>
        )}
      </ScoreCenter>
    </HeroContainer>
  );
};

import type { FC } from 'react';

import {
  Container,
  BarContainer,
  Segment,
  LabelsContainer,
  LabelItem,
  ColorDot,
  LabelName,
  LabelValue,
  LabelPercent,
  type DistributionColor,
} from './DistributionBar.styles';

export type { DistributionColor };

export interface DistributionSegment {
  name: string;
  value: number;
  color: DistributionColor;
}

export interface DistributionBarProps {
  segments: DistributionSegment[];
  formatValue?: (value: number) => string;
  showPercent?: boolean;
  className?: string;
}

const DEFAULT_COLORS: DistributionColor[] = ['cyan', 'purple', 'green', 'orange', 'red'];

export const DistributionBar: FC<DistributionBarProps> = ({
  segments,
  formatValue = (v) => v.toLocaleString(),
  showPercent = true,
  className,
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0 || segments.length === 0) {
    return null;
  }

  // Calculate percentages
  const segmentsWithPercent = segments.map((s, i) => ({
    ...s,
    percent: (s.value / total) * 100,
    color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <Container className={className}>
      <BarContainer>
        {segmentsWithPercent.map((segment, index) => (
          <Segment
            key={`${segment.name}-${index}`}
            $width={segment.percent}
            $color={segment.color}
          />
        ))}
      </BarContainer>
      <LabelsContainer>
        {segmentsWithPercent.map((segment, index) => (
          <LabelItem key={`label-${segment.name}-${index}`}>
            <ColorDot $color={segment.color} />
            <LabelName>{segment.name}</LabelName>
            <LabelValue>{formatValue(segment.value)}</LabelValue>
            {showPercent && <LabelPercent>({segment.percent.toFixed(1)}%)</LabelPercent>}
          </LabelItem>
        ))}
      </LabelsContainer>
    </Container>
  );
};

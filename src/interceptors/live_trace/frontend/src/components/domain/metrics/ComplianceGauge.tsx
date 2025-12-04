import type { FC } from 'react';
import {
  GaugeContainer,
  GaugeHeader,
  GaugeLabel,
  GaugeValue,
  GaugeBar,
  GaugeProgress,
  GaugeStats,
} from './ComplianceGauge.styles';

// Types
export interface ComplianceGaugeProps {
  label: string;
  value: number;
  passed: number;
  total: number;
}

// Component
export const ComplianceGauge: FC<ComplianceGaugeProps> = ({
  label,
  value,
  passed,
  total,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <GaugeContainer>
      <GaugeHeader>
        <GaugeLabel>{label}</GaugeLabel>
        <GaugeValue $value={clampedValue}>{clampedValue}%</GaugeValue>
      </GaugeHeader>
      <GaugeBar>
        <GaugeProgress $value={clampedValue} />
      </GaugeBar>
      <GaugeStats>
        {passed} of {total} controls passed
      </GaugeStats>
    </GaugeContainer>
  );
};

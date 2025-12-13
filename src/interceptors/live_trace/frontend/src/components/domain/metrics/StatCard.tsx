import type { FC, ReactNode } from 'react';

import { Info } from 'lucide-react';

import { Tooltip } from '@ui/overlays/Tooltip';

import {
  StyledStatCard,
  IconContainer,
  StatHeader,
  StatLabel,
  StatLabelRow,
  InfoIcon,
  StatValue,
  StatDetail,
} from './StatCard.styles';

// Types
export type StatCardColor = 'orange' | 'red' | 'green' | 'purple' | 'cyan';
export type StatCardSize = 'sm' | 'md';

export interface StatCardProps {
  icon: ReactNode;
  iconColor?: StatCardColor;
  label: string;
  value: string | number;
  valueColor?: StatCardColor;
  detail?: string;
  /** Tooltip content explaining the metric calculation */
  tooltip?: ReactNode;
  /** Size variant: 'sm' uses horizontal icon+label layout, 'md' uses vertical layout */
  size?: StatCardSize;
  className?: string;
}

// Component
export const StatCard: FC<StatCardProps> = ({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  detail,
  tooltip,
  size = 'md',
  className,
}) => {
  const labelContent = tooltip ? (
    <StatLabelRow>
      <StatLabel style={{ marginBottom: 0 }}>{label}</StatLabel>
      <Tooltip content={tooltip} position="top">
        <InfoIcon>
          <Info size={12} />
        </InfoIcon>
      </Tooltip>
    </StatLabelRow>
  ) : (
    <StatLabel>{label}</StatLabel>
  );

  return (
    <StyledStatCard $size={size} className={className}>
      {size === 'sm' ? (
        <StatHeader>
          <IconContainer $color={iconColor} $size={size}>
            {icon}
          </IconContainer>
          {labelContent}
        </StatHeader>
      ) : (
        <>
          <IconContainer $color={iconColor} $size={size}>
            {icon}
          </IconContainer>
          {labelContent}
        </>
      )}
      <StatValue $color={valueColor} $size={size}>
        {value}
      </StatValue>
      {detail && <StatDetail>{detail}</StatDetail>}
    </StyledStatCard>
  );
};

import type { FC, ReactNode } from 'react';

import {
  StyledStatCard,
  IconContainer,
  StatHeader,
  StatLabel,
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
  size = 'md',
  className,
}) => {
  return (
    <StyledStatCard $size={size} className={className}>
      {size === 'sm' ? (
        <StatHeader>
          <IconContainer $color={iconColor} $size={size}>
            {icon}
          </IconContainer>
          <StatLabel>{label}</StatLabel>
        </StatHeader>
      ) : (
        <>
          <IconContainer $color={iconColor} $size={size}>
            {icon}
          </IconContainer>
          <StatLabel>{label}</StatLabel>
        </>
      )}
      <StatValue $color={valueColor} $size={size}>
        {value}
      </StatValue>
      {detail && <StatDetail>{detail}</StatDetail>}
    </StyledStatCard>
  );
};

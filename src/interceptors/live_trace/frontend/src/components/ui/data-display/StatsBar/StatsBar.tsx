import type { FC, ReactNode } from 'react';

import {
  Container,
  StatItem,
  IconContainer,
  Value,
  Label,
  Divider,
  type StatColor,
} from './StatsBar.styles';

export type { StatColor };

export interface Stat {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconColor?: StatColor;
  valueColor?: StatColor;
}

export interface StatsBarProps {
  stats: (Stat | 'divider')[];
  className?: string;
}

export const StatsBar: FC<StatsBarProps> = ({ stats, className }) => {
  if (stats.length === 0) {
    return null;
  }

  return (
    <Container className={className}>
      {stats.map((item, index) => {
        if (item === 'divider') {
          return <Divider key={`divider-${index}`} />;
        }

        return (
          <StatItem key={`stat-${index}`}>
            <IconContainer $color={item.iconColor}>{item.icon}</IconContainer>
            <div>
              <Value $color={item.valueColor}>{item.value}</Value>
              <Label>{item.label}</Label>
            </div>
          </StatItem>
        );
      })}
    </Container>
  );
};

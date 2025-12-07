import type { FC, ReactNode } from 'react';

import {
  InfoCardContainer,
  InfoCardHeader,
  InfoCardTitle,
  InfoCardContent,
  PrimarySection,
  PrimaryLabel,
  PrimaryValue,
  StatsGrid,
  StatItem,
  StatLabel,
  StatValue,
  BadgeSection,
} from './InfoCard.styles';

// Types
export interface InfoCardStat {
  label: string;
  value?: string | number;
  badge?: ReactNode;
}

export interface InfoCardProps {
  title: string;
  primaryLabel: string;
  primaryValue: string;
  stats?: InfoCardStat[];
  badge?: ReactNode;
  className?: string;
}

// Component
export const InfoCard: FC<InfoCardProps> = ({
  title,
  primaryLabel,
  primaryValue,
  stats,
  badge,
  className,
}) => {
  return (
    <InfoCardContainer className={className}>
      <InfoCardHeader>
        <InfoCardTitle>{title}</InfoCardTitle>
      </InfoCardHeader>
      <InfoCardContent>
        <PrimarySection>
          <PrimaryLabel>{primaryLabel}</PrimaryLabel>
          <PrimaryValue>{primaryValue}</PrimaryValue>
        </PrimarySection>

        {stats && stats.length > 0 && (
          <StatsGrid>
            {stats.map((stat, index) => (
              <StatItem key={index}>
                <StatLabel>{stat.label}</StatLabel>
                {stat.badge ? stat.badge : <StatValue>{stat.value}</StatValue>}
              </StatItem>
            ))}
          </StatsGrid>
        )}

        {badge && <BadgeSection>{badge}</BadgeSection>}
      </InfoCardContent>
    </InfoCardContainer>
  );
};

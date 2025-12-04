import styled from 'styled-components';
import { Heading } from '@ui/core/Heading';

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const SectionTitle = styled(Heading).attrs({ level: 2, size: 'sm' })``;

export const RiskHero = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
`;

export const LifecycleCard = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

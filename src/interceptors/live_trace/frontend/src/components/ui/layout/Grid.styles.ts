import styled from 'styled-components';

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const gapMap: Record<Gap, string> = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

interface StatsRowProps {
  $columns: 2 | 3 | 4 | 5;
}

interface TwoColumnProps {
  $gap: 'sm' | 'md' | 'lg';
}

interface ThreeColumnProps {
  $gap: 'sm' | 'md' | 'lg';
}

interface StackProps {
  $gap: Gap;
}

export const StyledStatsRow = styled.div<StatsRowProps>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

export const StyledTwoColumn = styled.div<TwoColumnProps>`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ $gap }) => gapMap[$gap]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

export const TwoColumnMain = styled.div`
  min-width: 0;
`;

export const TwoColumnSidebar = styled.div`
  min-width: 0;
`;

export const StyledThreeColumn = styled.div<ThreeColumnProps>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ $gap }) => gapMap[$gap]};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

export const StyledStack = styled.div<StackProps>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => gapMap[$gap]};
`;

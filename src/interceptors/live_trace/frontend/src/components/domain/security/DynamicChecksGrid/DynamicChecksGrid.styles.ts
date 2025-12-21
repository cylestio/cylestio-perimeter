import styled from 'styled-components';

// Container
export const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

// Summary bar
export const SummaryBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const SummaryItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const SummaryCount = styled.span<{ $color: string }>`
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ $color, theme }) => {
    const colors = theme.colors as Record<string, string>;
    switch ($color) {
      case 'critical':
        return colors.red;
      case 'warning':
        return colors.yellow;
      case 'passed':
        return colors.green;
      default:
        return colors.white70;
    }
  }};
`;

export const SummaryLabel = styled.span`
  color: ${({ theme }) => theme.colors.white50};
`;

export const SummaryDivider = styled.span`
  width: 1px;
  height: 16px;
  background: ${({ theme }) => theme.colors.borderSubtle};
`;

// Category group
export const CategoryGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const CategoryIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.white08};
  color: ${({ theme }) => theme.colors.white70};

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const CategoryName = styled.h4`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white80};
`;

export const CategoryBadge = styled.span<{ $hasIssues: boolean }>`
  margin-left: auto;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  background: ${({ $hasIssues, theme }) =>
    $hasIssues ? theme.colors.redSoft : theme.colors.greenSoft};
  color: ${({ $hasIssues, theme }) => ($hasIssues ? theme.colors.red : theme.colors.green)};
`;

// Checks list/grid
export const ChecksList = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

export const ChecksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing[2]};
`;

// Empty state
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px dashed ${({ theme }) => theme.colors.borderSubtle};
`;

export const EmptyIcon = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.white30};

  svg {
    width: 40px;
    height: 40px;
  }
`;

export const EmptyTitle = styled.h4`
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white70};
`;

export const EmptyDescription = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

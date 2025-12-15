import styled, { css } from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const TabContent = styled.div`
`;

export const ChartRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[6]};
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

interface ChartColumnProps {
  $grow?: boolean;
}

export const ChartColumn = styled.div<ChartColumnProps>`
  display: flex;
  flex-direction: column;

  ${({ $grow }) =>
    $grow &&
    css`
      grid-column: 1 / -1;
    `}
`;

export const ChartTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

export const ChartSubtitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const StatsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.typography.textSm};
`;

interface TableHeaderProps {
  $align?: 'left' | 'right' | 'center';
}

export const TableHeader = styled.th<TableHeaderProps>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  text-align: ${({ $align }) => $align || 'left'};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  white-space: nowrap;
`;

export const TableRow = styled.tr`
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }
`;

interface TableCellProps {
  $align?: 'left' | 'right' | 'center';
  $mono?: boolean;
}

export const TableCell = styled.td<TableCellProps>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  text-align: ${({ $align }) => $align || 'left'};
  color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  white-space: nowrap;

  ${({ $mono, theme }) =>
    $mono &&
    css`
      font-family: ${theme.typography.fontMono};
    `}
`;

interface DurationCellProps {
  $align?: 'left' | 'right' | 'center';
  $isSlow?: boolean;
}

export const DurationCell = styled(TableCell)<DurationCellProps>`
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $isSlow }) => ($isSlow ? theme.colors.orange : theme.colors.white70)};
`;

export const ToolName = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const UsageBar = styled.div`
  width: 100%;
  max-width: 200px;
`;

export const SuccessBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: ${({ theme }) => `${theme.colors.green}20`};
  color: ${({ theme }) => theme.colors.green};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const FailureBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: ${({ theme }) => `${theme.colors.red}20`};
  color: ${({ theme }) => theme.colors.red};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

// Unused tool row styling - dimmed appearance
interface UnusedTableRowProps {
  $unused?: boolean;
}

export const UnusedTableRow = styled(TableRow)<UnusedTableRowProps>`
  ${({ $unused }) =>
    $unused &&
    css`
      opacity: 0.5;

      &:hover {
        opacity: 0.7;
      }
    `}
`;

export const UnusedToolName = styled(ToolName)`
  color: ${({ theme }) => theme.colors.white50};
`;

export const UnusedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: ${({ theme }) => theme.colors.borderSubtle};
  color: ${({ theme }) => theme.colors.white50};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 500;
  font-style: italic;
`;

// Sortable table header
interface SortableHeaderProps {
  $align?: 'left' | 'right' | 'center';
  $active?: boolean;
}

export const SortableHeader = styled.th<SortableHeaderProps>`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  text-align: ${({ $align }) => $align || 'left'};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
  color: ${({ theme, $active }) => ($active ? theme.colors.white : theme.colors.white50)};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${({ theme }) => theme.colors.white};
  }
`;

export const SortIndicator = styled.span`
  margin-left: ${({ theme }) => theme.spacing[1]};
  font-size: 10px;
  opacity: 0.8;
`;

// Duration cell with background fill
interface DurationBarCellProps {
  $align?: 'left' | 'right' | 'center';
  $percent?: number;
  $isSlow?: boolean;
}

export const DurationBarCell = styled.td<DurationBarCellProps>`
  position: relative;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  text-align: ${({ $align }) => $align || 'left'};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $isSlow }) => ($isSlow ? theme.colors.orange : theme.colors.white70)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  white-space: nowrap;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $percent }) => $percent || 0}%;
    background: ${({ theme, $isSlow }) =>
      $isSlow ? `${theme.colors.orange}15` : `${theme.colors.cyan}10`};
    transition: width ${({ theme }) => theme.transitions.fast};
  }

  & > span {
    position: relative;
    z-index: 1;
  }
`;

// Show more toggle button
export const ShowMoreToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[2]};
  background: transparent;
  border: 1px dashed ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    color: ${({ theme }) => theme.colors.white};
    border-color: ${({ theme }) => theme.colors.white30};
  }
`;

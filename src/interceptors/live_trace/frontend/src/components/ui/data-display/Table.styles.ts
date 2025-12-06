import styled, { css } from 'styled-components';

export const TableContainer = styled.div`
  overflow-x: auto;
`;

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

interface TableHeadProps {
  $sticky?: boolean;
}

export const TableHead = styled.thead<TableHeadProps>`
  background: ${({ theme }) => theme.colors.surface2};

  ${({ $sticky }) =>
    $sticky &&
    css`
      position: sticky;
      top: 0;
      z-index: 1;
    `}
`;

export const TableBody = styled.tbody``;

interface TableRowProps {
  $clickable?: boolean;
  $selected?: boolean;
}

export const TableRow = styled.tr<TableRowProps>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  transition: background ${({ theme }) => theme.transitions.fast};

  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        background: ${({ theme }) => theme.colors.white04};
      }
    `}

  ${({ $selected, theme }) =>
    $selected &&
    css`
      background: ${theme.colors.white08};
    `}
`;

interface TableHeaderProps {
  $width?: string;
  $align?: 'left' | 'center' | 'right';
  $sortable?: boolean;
}

export const TableHeader = styled.th<TableHeaderProps>`
  padding: 12px 16px;
  text-align: ${({ $align }) => $align || 'left'};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.white30};
  white-space: nowrap;

  ${({ $width }) =>
    $width &&
    css`
      width: ${$width};
    `}

  ${({ $sortable }) =>
    $sortable &&
    css`
      cursor: pointer;
      user-select: none;

      &:hover {
        color: ${({ theme }) => theme.colors.white50};
      }
    `}
`;

interface TableCellProps {
  $align?: 'left' | 'center' | 'right';
}

export const TableCell = styled.td<TableCellProps>`
  padding: 12px 16px;
  text-align: ${({ $align }) => $align || 'left'};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white90};
`;

interface SortIconProps {
  $active?: boolean;
}

export const SortIcon = styled.span<SortIconProps>`
  display: inline-flex;
  margin-left: 4px;
  opacity: ${({ $active }) => ($active ? 1 : 0.3)};
  transition: opacity ${({ theme }) => theme.transitions.fast};
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.white50};
`;

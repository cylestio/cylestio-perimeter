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

  padding: ${({ theme }) => theme.spacing[5]};

  ${({ $grow }) =>
    $grow &&
    css`
      flex: 1;
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

interface TableRowProps {
  $isTotal?: boolean;
}

export const TableRow = styled.tr<TableRowProps>`
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }

  ${({ $isTotal, theme }) =>
    $isTotal &&
    css`
      font-weight: 700;
      background: ${theme.colors.surface};
      border-top: 1px solid ${theme.colors.borderMedium};

      &:hover {
        background: ${theme.colors.surface2};
      }
    `}
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
      font-size: ${theme.typography.textXs};
    `}
`;

interface CostCellProps {
  $align?: 'left' | 'right' | 'center';
  $hasValue?: boolean;
}

export const CostCell = styled(TableCell)<CostCellProps>`
  color: ${({ theme, $hasValue }) => ($hasValue ? theme.colors.orange : theme.colors.white30)};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const ErrorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: ${({ theme }) => `${theme.colors.red}20`};
  color: ${({ theme }) => theme.colors.red};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
`;

export const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

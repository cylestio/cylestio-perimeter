import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from '../feedback/Skeleton';
import {
  StyledTable,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  SortIcon,
  EmptyStateContainer,
} from './Table.styles';

// Types
export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRow?: T;
  loading?: boolean;
  emptyState?: ReactNode;
  stickyHeader?: boolean;
  keyExtractor?: (row: T) => string;
}

type SortDirection = 'asc' | 'desc' | null;

// Component
export function Table<T>({
  columns,
  data,
  onRowClick,
  selectedRow,
  loading = false,
  emptyState,
  stickyHeader = false,
  keyExtractor,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    const aValue = a[sortColumn as keyof T];
    const bValue = b[sortColumn as keyof T];

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const comparison = aValue < bValue ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getCellValue = (row: T, column: Column<T>): ReactNode => {
    if (column.render) {
      return column.render(row);
    }
    const value = row[column.key as keyof T];
    return value as ReactNode;
  };

  const getRowKey = (row: T, index: number): string => {
    if (keyExtractor) return keyExtractor(row);
    return String(index);
  };

  if (loading) {
    return (
      <TableContainer>
        <StyledTable>
          <TableHead $sticky={stickyHeader}>
            <TableRow>
              {columns.map((column) => (
                <TableHeader
                  key={String(column.key)}
                  $width={column.width}
                  $align={column.align}
                >
                  {column.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)} $align={column.align}>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableContainer>
    );
  }

  if (data.length === 0 && emptyState) {
    return <EmptyStateContainer>{emptyState}</EmptyStateContainer>;
  }

  return (
    <TableContainer>
      <StyledTable>
        <TableHead $sticky={stickyHeader}>
          <TableRow>
            {columns.map((column) => (
              <TableHeader
                key={String(column.key)}
                $width={column.width}
                $align={column.align}
                $sortable={column.sortable}
                onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
                aria-sort={
                  sortColumn === String(column.key)
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {column.header}
                {column.sortable && (
                  <SortIcon $active={sortColumn === String(column.key)} aria-label={sortColumn === String(column.key) ? `sorted ${sortDirection}` : undefined}>
                    {sortColumn === String(column.key) && sortDirection === 'desc' ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronUp size={12} />
                    )}
                  </SortIcon>
                )}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow
              key={getRowKey(row, index)}
              $clickable={!!onRowClick}
              $selected={selectedRow === row}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <TableCell key={String(column.key)} $align={column.align}>
                  {getCellValue(row, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
}

export default Table;

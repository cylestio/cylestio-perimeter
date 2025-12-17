import type { FC } from 'react';
import styled from 'styled-components';

import type { Recommendation, FindingSeverity } from '@api/types/findings';

// Styled Components
const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.xl};
  height: 100%;
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
`;

const TreemapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
`;

const TreemapRect = styled.div<{ $severity: FindingSeverity; $selected?: boolean }>`
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  overflow: hidden;
  
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL': return `${theme.colors.red}40`;
      case 'HIGH': return `${theme.colors.orange}35`;
      case 'MEDIUM': return `${theme.colors.yellow}30`;
      case 'LOW': return `${theme.colors.green}25`;
    }
  }};
  
  border: 2px solid ${({ $severity, $selected, theme }) => {
    if ($selected) return theme.colors.cyan;
    switch ($severity) {
      case 'CRITICAL': return `${theme.colors.red}60`;
      case 'HIGH': return `${theme.colors.orange}50`;
      case 'MEDIUM': return `${theme.colors.yellow}40`;
      case 'LOW': return `${theme.colors.green}35`;
    }
  }};

  &:hover {
    transform: scale(1.02);
    z-index: 10;
    border-color: ${({ theme }) => theme.colors.cyan};
  }
`;

const RectLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  text-align: center;
  word-break: break-all;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const RectCount = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white70};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${({ theme }) => theme.colors.white50};
  font-size: 13px;
`;

// Types
export interface FileTreemapProps {
  recommendations: Recommendation[];
  selectedFile?: string | null;
  onFileClick?: (filePath: string | null) => void;
}

interface FileData {
  path: string;
  displayName: string;
  count: number;
  maxSeverity: FindingSeverity;
}

interface LayoutRect extends FileData {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Squarify algorithm for treemap layout
const squarify = (
  items: FileData[],
  width: number,
  height: number,
  x: number = 0,
  y: number = 0
): LayoutRect[] => {
  if (items.length === 0) return [];

  const total = items.reduce((acc, item) => acc + item.count, 0);
  if (total === 0) return [];

  const results: LayoutRect[] = [];
  let remaining = [...items];
  let currentX = x;
  let currentY = y;
  let currentWidth = width;
  let currentHeight = height;

  while (remaining.length > 0) {
    // Determine if we should layout horizontally or vertically
    const isHorizontal = currentWidth >= currentHeight;

    // Find the best row of items
    const row: FileData[] = [];
    let rowTotal = 0;
    const shortSide = isHorizontal ? currentHeight : currentWidth;

    for (const item of remaining) {
      const testRow = [...row, item];
      const testTotal = rowTotal + item.count;
      
      // Check if adding this item makes the aspect ratios worse
      if (row.length > 0) {
        const currentWorst = worstAspectRatio(row, rowTotal, shortSide, total, isHorizontal ? currentWidth : currentHeight);
        const testWorst = worstAspectRatio(testRow, testTotal, shortSide, total, isHorizontal ? currentWidth : currentHeight);
        
        if (testWorst > currentWorst) break;
      }
      
      row.push(item);
      rowTotal = testTotal;
    }

    // Layout the row
    const rowRatio = rowTotal / total;
    const rowSize = isHorizontal ? currentWidth * rowRatio : currentHeight * rowRatio;
    
    let offset = 0;
    for (const item of row) {
      const itemRatio = item.count / rowTotal;
      const itemSize = shortSide * itemRatio;

      results.push({
        ...item,
        x: isHorizontal ? currentX : currentX + offset,
        y: isHorizontal ? currentY + offset : currentY,
        width: isHorizontal ? rowSize : itemSize,
        height: isHorizontal ? itemSize : rowSize,
      });

      offset += itemSize;
    }

    // Update remaining area
    if (isHorizontal) {
      currentX += rowSize;
      currentWidth -= rowSize;
    } else {
      currentY += rowSize;
      currentHeight -= rowSize;
    }

    remaining = remaining.slice(row.length);
  }

  return results;
};

const worstAspectRatio = (
  row: FileData[],
  rowTotal: number,
  shortSide: number,
  areaTotal: number,
  longSide: number
): number => {
  const rowRatio = rowTotal / areaTotal;
  const rowSize = longSide * rowRatio;
  
  let worst = 0;
  for (const item of row) {
    const itemRatio = item.count / rowTotal;
    const itemSize = shortSide * itemRatio;
    const aspectRatio = Math.max(rowSize / itemSize, itemSize / rowSize);
    worst = Math.max(worst, aspectRatio);
  }
  
  return worst;
};

// Get severity priority
const severityPriority: Record<FindingSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// Component
export const FileTreemap: FC<FileTreemapProps> = ({
  recommendations,
  selectedFile,
  onFileClick,
}) => {
  // Group by file path (pending only)
  const pending = recommendations.filter(r => 
    !['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status)
  );

  const fileMap = new Map<string, { count: number; maxSeverity: FindingSeverity }>();
  
  for (const rec of pending) {
    const path = rec.file_path || 'Dynamic/Runtime';
    const existing = fileMap.get(path);
    
    if (existing) {
      existing.count++;
      if (severityPriority[rec.severity] < severityPriority[existing.maxSeverity]) {
        existing.maxSeverity = rec.severity;
      }
    } else {
      fileMap.set(path, { count: 1, maxSeverity: rec.severity });
    }
  }

  const fileData: FileData[] = Array.from(fileMap.entries())
    .map(([path, data]) => ({
      path,
      displayName: path.split('/').pop() || path,
      count: data.count,
      maxSeverity: data.maxSeverity,
    }))
    .sort((a, b) => b.count - a.count);

  if (fileData.length === 0) {
    return (
      <Container>
        <Title>Issues by File</Title>
        <EmptyState>No open issues</EmptyState>
      </Container>
    );
  }

  // Calculate layout
  const layout = squarify(fileData, 100, 100);

  const handleClick = (path: string) => {
    if (onFileClick) {
      onFileClick(selectedFile === path ? null : path);
    }
  };

  return (
    <Container>
      <Title>Issues by File</Title>
      <TreemapContainer>
        {layout.map(rect => (
          <TreemapRect
            key={rect.path}
            $severity={rect.maxSeverity}
            $selected={selectedFile === rect.path}
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.width - 1}%`,
              height: `${rect.height - 1}%`,
            }}
            onClick={() => handleClick(rect.path)}
            title={`${rect.path}: ${rect.count} issue${rect.count !== 1 ? 's' : ''}`}
          >
            {rect.width > 15 && rect.height > 20 && (
              <>
                <RectLabel>{rect.displayName}</RectLabel>
                <RectCount>({rect.count})</RectCount>
              </>
            )}
          </TreemapRect>
        ))}
      </TreemapContainer>
    </Container>
  );
};


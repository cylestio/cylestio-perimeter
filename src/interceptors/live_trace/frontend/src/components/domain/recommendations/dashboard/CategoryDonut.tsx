import { type FC, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import type { Recommendation, SecurityCheckCategory } from '@api/types/findings';
import { SECURITY_CHECK_CATEGORIES } from '@api/types/findings';

// Styled Components
const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  height: 100%;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[5]};
`;

const ChartContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const SvgContainer = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const CenterLabel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
`;

const CenterNumber = styled.div`
  font-size: 28px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
  line-height: 1;
`;

const CenterText = styled.div`
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWider};
  margin-top: 4px;
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  flex: 1;
  min-width: 0;
`;

const LegendItem = styled.button<{ $active?: boolean; $hovered?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ $active, $hovered, theme }) => 
    $active ? theme.colors.surface3 : 
    $hovered ? theme.colors.surface2 : 
    'transparent'};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.cyan : 'transparent'};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

const LegendDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  box-shadow: 0 0 6px ${({ $color }) => $color}50;
`;

const LegendLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white80};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LegendCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
  min-width: 20px;
  text-align: right;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

// Types
export interface CategoryDonutProps {
  recommendations: Recommendation[];
  selectedCategory?: SecurityCheckCategory | null;
  onCategoryClick?: (category: SecurityCheckCategory | null) => void;
}

interface CategoryData {
  category: SecurityCheckCategory;
  name: string;
  count: number;
  color: string;
}

// Helper to create SVG arc path
const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
};

// Component
export const CategoryDonut: FC<CategoryDonutProps> = ({
  recommendations,
  selectedCategory,
  onCategoryClick,
}) => {
  const theme = useTheme();
  const [hoveredCategory, setHoveredCategory] = useState<SecurityCheckCategory | null>(null);

  // Category colors using vibrant, distinct colors
  const categoryColors: Record<SecurityCheckCategory, string> = {
    PROMPT: '#FF6B6B',     // Coral red
    OUTPUT: '#4ECDC4',     // Teal
    TOOL: '#FFE66D',       // Yellow
    DATA: '#95E1D3',       // Mint
    MEMORY: '#A8E6CF',     // Light green
    SUPPLY: '#DDA0DD',     // Plum
    BEHAVIOR: '#87CEEB',   // Sky blue
  };

  // Count recommendations by category (pending only)
  const pending = recommendations.filter(r => 
    !['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status)
  );

  const categoryData: CategoryData[] = SECURITY_CHECK_CATEGORIES
    .map(cat => ({
      category: cat.category_id,
      name: cat.name,
      count: pending.filter(r => r.category === cat.category_id).length,
      color: categoryColors[cat.category_id],
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const total = categoryData.reduce((acc, c) => acc + c.count, 0);

  // SVG dimensions
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 60;
  const innerRadius = 38;
  const gapAngle = 2; // Gap between segments in degrees

  // Calculate arc segments with gaps
  let currentAngle = 0;
  const arcs = categoryData.map((cat) => {
    const rawAngle = (cat.count / total) * 360;
    const angle = rawAngle - gapAngle;
    const startAngle = currentAngle + gapAngle / 2;
    const endAngle = startAngle + angle;
    currentAngle += rawAngle;

    return {
      ...cat,
      startAngle,
      endAngle,
    };
  });

  const handleClick = (category: SecurityCheckCategory) => {
    if (onCategoryClick) {
      onCategoryClick(selectedCategory === category ? null : category);
    }
  };

  if (total === 0) {
    return (
      <Container>
        <Title>Issues by Category</Title>
        <EmptyState>No open issues</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Issues by Category</Title>
      <ChartContainer>
        <SvgContainer>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background ring */}
            <circle
              cx={cx}
              cy={cy}
              r={(outerRadius + innerRadius) / 2}
              fill="none"
              stroke={theme.colors.surface3}
              strokeWidth={outerRadius - innerRadius}
            />
            
            {arcs.map((arc) => {
              const isHovered = hoveredCategory === arc.category;
              const isSelected = selectedCategory === arc.category;
              const isDimmed = (selectedCategory || hoveredCategory) && 
                !isSelected && !isHovered;
              
              // For single item, draw full circle
              if (arcs.length === 1) {
                return (
                  <circle
                    key={arc.category}
                    cx={cx}
                    cy={cy}
                    r={(outerRadius + innerRadius) / 2}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={outerRadius - innerRadius}
                    opacity={isDimmed ? 0.3 : 1}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      filter: isHovered || isSelected ? `drop-shadow(0 0 8px ${arc.color})` : 'none',
                    }}
                    onClick={() => handleClick(arc.category)}
                    onMouseEnter={() => setHoveredCategory(arc.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                );
              }

              // Calculate path for donut segment
              const outerStart = polarToCartesian(cx, cy, outerRadius, arc.endAngle);
              const outerEnd = polarToCartesian(cx, cy, outerRadius, arc.startAngle);
              const innerStart = polarToCartesian(cx, cy, innerRadius, arc.startAngle);
              const innerEnd = polarToCartesian(cx, cy, innerRadius, arc.endAngle);
              const largeArc = arc.endAngle - arc.startAngle > 180 ? 1 : 0;

              const path = `
                M ${outerStart.x} ${outerStart.y}
                A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}
                L ${innerStart.x} ${innerStart.y}
                A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}
                Z
              `;

              return (
                <path
                  key={arc.category}
                  d={path}
                  fill={arc.color}
                  opacity={isDimmed ? 0.3 : 1}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    filter: isHovered || isSelected ? `drop-shadow(0 0 8px ${arc.color})` : 'none',
                  }}
                  onClick={() => handleClick(arc.category)}
                  onMouseEnter={() => setHoveredCategory(arc.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>
          <CenterLabel>
            <CenterNumber>{total}</CenterNumber>
            <CenterText>Issues</CenterText>
          </CenterLabel>
        </SvgContainer>

        <Legend>
          {categoryData.map(cat => (
            <LegendItem
              key={cat.category}
              $active={selectedCategory === cat.category}
              $hovered={hoveredCategory === cat.category}
              onClick={() => handleClick(cat.category)}
              onMouseEnter={() => setHoveredCategory(cat.category)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <LegendDot $color={cat.color} />
              <LegendLabel>{cat.name}</LegendLabel>
              <LegendCount>{cat.count}</LegendCount>
            </LegendItem>
          ))}
        </Legend>
      </ChartContainer>
    </Container>
  );
};

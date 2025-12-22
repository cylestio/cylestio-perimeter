import styled, { keyframes, css } from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[5]};
  flex-wrap: wrap;
`;

export const HealthDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[5]};
`;

// SVG-based ring container
export const RingContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
`;

const fillAnimation = keyframes`
  from {
    stroke-dashoffset: 314;
  }
`;

export const RingSvg = styled.svg`
  transform: rotate(-90deg);
`;

export const RingBackground = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.colors.surface2};
  stroke-width: 10;
`;

export const RingProgress = styled.circle<{ $color: 'green' | 'orange' | 'red'; $progress: number }>`
  fill: none;
  stroke: ${({ theme, $color }) =>
    $color === 'green' ? theme.colors.green :
    $color === 'orange' ? theme.colors.orange :
    theme.colors.red};
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: 314;
  stroke-dashoffset: ${({ $progress }) => 314 - (314 * $progress)};
  animation: ${fillAnimation} 1s ease-out forwards;
  transition: stroke-dashoffset 0.5s ease-out;
`;

export const RingCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

export const HealthValue = styled.span`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white90};
  line-height: 1;
`;

export const HealthLabel = styled.span`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const HealthInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const HealthTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const HealthTrend = styled.span<{ $trend: 'improving' | 'declining' | 'stable' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 12px;
  color: ${({ theme, $trend }) =>
    $trend === 'improving' ? theme.colors.green :
    $trend === 'declining' ? theme.colors.red :
    theme.colors.white50};
`;

export const HealthDescription = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  max-width: 280px;
`;

// Actions
export const ActionsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;
`;

export const ActionButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-size: 12px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $primary, theme }) =>
    $primary
      ? css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
          border: 1px solid transparent;
          &:hover {
            background: rgba(0, 240, 255, 0.2);
            border-color: ${theme.colors.cyan};
          }
        `
      : css`
          background: ${theme.colors.surface};
          color: ${theme.colors.white70};
          border: 1px solid ${theme.colors.borderSubtle};
          &:hover {
            border-color: ${theme.colors.borderMedium};
            color: ${theme.colors.white90};
          }
        `}
`;

// Dimensions Grid
export const DimensionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const DimensionCard = styled.div<{ $color: 'cyan' | 'green' | 'orange' | 'purple' }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  border-left: 3px solid ${({ theme, $color }) =>
    $color === 'cyan' ? theme.colors.cyan :
    $color === 'green' ? theme.colors.green :
    $color === 'orange' ? theme.colors.orange :
    theme.colors.purple};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const DimensionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const DimensionIcon = styled.div<{ $color: 'cyan' | 'green' | 'orange' | 'purple' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $color }) =>
    $color === 'cyan' ? theme.colors.cyanSoft :
    $color === 'green' ? theme.colors.greenSoft :
    $color === 'orange' ? theme.colors.orangeSoft :
    theme.colors.surface3};
  color: ${({ theme, $color }) =>
    $color === 'cyan' ? theme.colors.cyan :
    $color === 'green' ? theme.colors.green :
    $color === 'orange' ? theme.colors.orange :
    theme.colors.purple};
`;

export const DimensionLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const DimensionValue = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white90};
`;

export const DimensionIssues = styled.span<{ $hasIssues: boolean }>`
  font-size: 11px;
  color: ${({ theme, $hasIssues }) =>
    $hasIssues ? theme.colors.orange : theme.colors.white50};
`;

// Suggestion banner
export const SuggestionBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const SuggestionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.greenSoft};
  color: ${({ theme }) => theme.colors.green};
  flex-shrink: 0;
`;

export const SuggestionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

export const SuggestionText = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const SuggestionGain = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.green};
  font-weight: 500;
`;

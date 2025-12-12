import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const LastScan = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const LastScanInfo = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const ScanButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surface3};
    border-color: ${({ theme }) => theme.colors.cyan};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: ${spin} 1s linear infinite;
  }
`;

export const SurfaceOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

interface ColorProps {
  $color: 'red' | 'orange' | 'cyan' | 'purple' | 'green' | 'yellow';
}

export const SurfaceCard = styled.div<ColorProps>`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $color, theme }) => `${theme.colors[$color]}30`};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ $color, theme }) => `${theme.colors[$color]}50`};
  }
`;

export const SurfaceIcon = styled.div<ColorProps>`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color, theme }) => `${theme.colors[$color]}15`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ $color, theme }) => theme.colors[$color]};
  flex-shrink: 0;
`;

export const SurfaceContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const SurfaceLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const SurfaceValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  line-height: 1;
`;

export const SurfaceDetail = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white30};
`;

export const VisualizationArea = styled.div`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const VisualizationPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: ${({ theme }) => theme.colors.white30};
  gap: ${({ theme }) => theme.spacing[3]};

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.white70};
    margin: 0;
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.white50};
    margin: 0;
    max-width: 400px;
  }
`;

export const VectorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const VectorItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const VectorIcon = styled.div<ColorProps>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color, theme }) => `${theme.colors[$color]}15`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ $color, theme }) => theme.colors[$color]};
  flex-shrink: 0;
`;

export const VectorInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const VectorName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

export const VectorDescription = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.4;
`;

export const VectorRisk = styled.span<ColorProps>`
  font-size: 10px;
  font-weight: 700;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ $color, theme }) => `${theme.colors[$color]}20`};
  color: ${({ $color, theme }) => theme.colors[$color]};
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;
`;

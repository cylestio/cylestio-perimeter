import styled, { keyframes } from 'styled-components';

// ============ Progress/Score Card (legacy - keeping for backwards compat) ============

export const ScoreCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[8]};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.surface2} 0%,
    ${({ theme }) => theme.colors.surface} 100%
  );
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.xl};
`;

interface ScoreValueProps {
  $color: 'green' | 'orange' | 'red';
}

export const ScoreValue = styled.div<ScoreValueProps>`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 72px;
  font-weight: 700;
  color: ${({ $color, theme }) => theme.colors[$color]};
  line-height: 1;
  text-shadow: ${({ $color, theme }) => {
    const shadowColor = theme.colors[$color];
    return `0 0 40px ${shadowColor}40`;
  }};
`;

export const ScoreLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white50};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

export const ScoreBreakdown = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-top: ${({ theme }) => theme.spacing[5]};
  padding-top: ${({ theme }) => theme.spacing[5]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

interface ScoreItemProps {
  $color: 'red' | 'orange' | 'yellow' | 'green';
}

export const ScoreItem = styled.div<ScoreItemProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};

  span {
    font-weight: 600;
    color: ${({ $color, theme }) => theme.colors[$color]};
  }
`;

// ============ Filters Bar ============

export const FiltersBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.lg};
  
  /* RichSelect styling within FiltersBar */
  > div {
    min-width: 150px;
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surface2};
    border-color: ${({ theme }) => theme.colors.borderMedium};
    color: ${({ theme }) => theme.colors.white};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinning {
    animation: ${spin} 1s linear infinite;
  }
`;

// ============ Recommendations List ============

export const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

// Severity-based section headers
interface SeveritySectionHeaderProps {
  $severity: 'critical' | 'high' | 'other' | 'resolved';
}

export const SeveritySectionHeader = styled.div<SeveritySectionHeaderProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'critical':
        return `${theme.colors.red}10`;
      case 'high':
        return `${theme.colors.orange}10`;
      case 'resolved':
        return `${theme.colors.green}10`;
      default:
        return theme.colors.surface2;
    }
  }};
`;

export const SeveritySectionTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white};
`;

// Legacy SectionTitle for backwards compat
interface SectionTitleProps {
  $variant: 'pending' | 'resolved';
}

export const SectionTitle = styled.span<SectionTitleProps>`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: ${({ $variant, theme }) => 
    $variant === 'pending' ? theme.colors.orange : theme.colors.green};
`;

// ============ Legacy Card Styles (keeping for backwards compat) ============

interface RecommendationCardProps {
  $severity: 'high' | 'medium' | 'low';
}

export const RecommendationCard = styled.div<RecommendationCardProps>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $severity, theme }) => {
    switch ($severity) {
      case 'high':
        return `${theme.colors.red}30`;
      case 'medium':
        return `${theme.colors.orange}30`;
      default:
        return theme.colors.borderSubtle;
    }
  }};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ $severity, theme }) => {
      switch ($severity) {
        case 'high':
          return `${theme.colors.red}50`;
        case 'medium':
          return `${theme.colors.orange}50`;
        default:
          return theme.colors.borderMedium;
      }
    }};
  }
`;

interface RecommendationIconProps {
  $severity: 'high' | 'medium' | 'low';
}

export const RecommendationIcon = styled.div<RecommendationIconProps>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  flex-shrink: 0;
  
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'high':
        return theme.colors.redSoft;
      case 'medium':
        return theme.colors.orangeSoft;
      default:
        return theme.colors.greenSoft;
    }
  }};
  
  color: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'high':
        return theme.colors.red;
      case 'medium':
        return theme.colors.orange;
      default:
        return theme.colors.green;
    }
  }};
`;

export const RecommendationContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const RecommendationTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const RecommendationDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
  line-height: 1.5;
`;

export const RecommendationActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

export const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.cyan};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.white};
  }
`;

// ============ Empty & Error States ============

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[12]};
  text-align: center;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.white};
    margin: 0 0 ${({ theme }) => theme.spacing[2]};
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.white50};
    margin: 0;
  }

  code {
    font-family: ${({ theme }) => theme.typography.fontMono};
    background: ${({ theme }) => theme.colors.surface2};
    padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
    border-radius: ${({ theme }) => theme.radii.sm};
    color: ${({ theme }) => theme.colors.cyan};
  }
`;

export const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[12]};
  text-align: center;
  color: ${({ theme }) => theme.colors.red};

  p {
    font-size: 14px;
    margin: 0 0 ${({ theme }) => theme.spacing[4]};
  }
`;

export const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.red};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }
`;

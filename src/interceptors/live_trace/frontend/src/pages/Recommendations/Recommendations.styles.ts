import styled from 'styled-components';

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

export const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

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

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[12]};
  text-align: center;
  color: ${({ theme }) => theme.colors.green};

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.white};
    margin: ${({ theme }) => theme.spacing[4]} 0 ${({ theme }) => theme.spacing[2]};
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.white50};
    margin: 0;
  }
`;

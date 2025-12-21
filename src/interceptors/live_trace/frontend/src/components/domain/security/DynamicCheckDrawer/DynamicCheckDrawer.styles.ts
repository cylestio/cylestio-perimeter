import styled, { type DefaultTheme } from 'styled-components';

import type { DynamicCheckStatus } from '@api/types/security';

// Status color mapping
const getStatusColor = (status: DynamicCheckStatus): keyof DefaultTheme['colors'] => {
  switch (status) {
    case 'passed':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'critical':
      return 'red';
    case 'analyzing':
      return 'cyan';
    default:
      return 'white50';
  }
};

const getStatusBgColor = (status: DynamicCheckStatus): keyof DefaultTheme['colors'] => {
  switch (status) {
    case 'passed':
      return 'greenSoft';
    case 'warning':
      return 'yellowSoft';
    case 'critical':
      return 'redSoft';
    case 'analyzing':
      return 'cyanSoft';
    default:
      return 'surface2';
  }
};

// Props interfaces
interface StatusIndicatorProps {
  $status: DynamicCheckStatus;
}

// Container
export const DrawerInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[2]};
`;

// Header section
export const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const CategoryIcon = styled.div<StatusIndicatorProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $status, theme }) => theme.colors[getStatusBgColor($status)]};
  color: ${({ $status, theme }) => theme.colors[getStatusColor($status)]};
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  flex: 1;
  min-width: 0;
`;

export const CheckTitle = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white90};
`;

export const CategoryName = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const StatusBadgeLarge = styled.span<StatusIndicatorProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  text-transform: uppercase;
  background: ${({ $status, theme }) => theme.colors[getStatusBgColor($status)]};
  color: ${({ $status, theme }) => theme.colors[getStatusColor($status)]};

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ValueDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textMd};
  color: ${({ theme }) => theme.colors.white80};
`;

// Content sections
export const SectionTitle = styled.h4`
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white70};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const DescriptionText = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textMd};
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
  color: ${({ theme }) => theme.colors.white80};
`;

// Evidence section
export const EvidenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const EvidenceItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.md};
`;

// Full-width evidence item for array values
export const EvidenceItemFull = styled(EvidenceItem)`
  grid-column: 1 / -1;
`;

// Flex container for tags/badges within evidence
export const EvidenceTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

// Individual tag for list items (tools, models, etc.)
export const EvidenceTag = styled.span`
  display: inline-flex;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.surface4};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const EvidenceLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
`;

export const EvidenceValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white90};
`;

// Recommendations section
export const RecommendationsList = styled.ul`
  margin: 0;
  padding: 0 0 0 ${({ theme }) => theme.spacing[4]};
  list-style-type: disc;
`;

export const RecommendationItem = styled.li`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
  color: ${({ theme }) => theme.colors.white80};
  margin-bottom: ${({ theme }) => theme.spacing[2]};

  &:last-child {
    margin-bottom: 0;
  }
`;

// Framework badges section
export const FrameworksGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const FrameworkBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const FrameworkLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

export const FrameworkValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.cyan};
`;

// Sessions section
export const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SessionLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.cyan};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface4};
    color: ${({ theme }) => theme.colors.white90};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

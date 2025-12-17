import styled, { css } from 'styled-components';
import type { FindingSeverity } from '@api/types/findings';

// ============ Card Container ============

export const CardContainer = styled.div<{ $severity: FindingSeverity; $resolved?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $severity, $resolved, theme }) => {
    if ($resolved) return theme.colors.borderSubtle;
    switch ($severity) {
      case 'CRITICAL':
        return `${theme.colors.red}30`;
      case 'HIGH':
        return `${theme.colors.orange}25`;
      default:
        return theme.colors.borderSubtle;
    }
  }};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all ${({ theme }) => theme.transitions.fast};
  opacity: ${({ $resolved }) => $resolved ? 0.7 : 1};

  &:hover {
    border-color: ${({ $severity, $resolved, theme }) => {
      if ($resolved) return theme.colors.borderMedium;
      switch ($severity) {
        case 'CRITICAL':
          return `${theme.colors.red}50`;
        case 'HIGH':
          return `${theme.colors.orange}40`;
        default:
          return theme.colors.borderMedium;
      }
    }};
  }
`;

// ============ Header ============

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex: 1;
  min-width: 0;
`;

export const TitleText = styled.h3<{ $resolved?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  flex: 1;
  min-width: 0;
  
  ${({ $resolved }) => $resolved && css`
    text-decoration: line-through;
    opacity: 0.7;
  `}
`;

export const CvssScore = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white50};
  background: ${({ theme }) => theme.colors.surface2};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  white-space: nowrap;
`;

// ============ Description ============

export const DescriptionText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// ============ Metadata Row ============

export const MetadataRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
`;

export const MetadataItem = styled.span`
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const MetadataSeparator = styled.span`
  color: ${({ theme }) => theme.colors.white30};
`;

// ============ Actions ============

export const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-top: ${({ theme }) => theme.spacing[2]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const FixButton = styled.button<{ $copied?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ $copied, theme }) => $copied ? theme.colors.green : theme.colors.cyan};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.void};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }
`;

export const LinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.white};
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

export const MoreButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.white};
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

export const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: ${({ theme }) => theme.spacing[1]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 180px;
  z-index: 100;
  overflow: hidden;
`;

export const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  text-align: left;
  background: transparent;
  border: none;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.white};
  }
`;

// ============ Legacy exports for backwards compatibility ============

export const RecommendationId = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.cyan};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const SourceBadge = styled.span<{ $type: 'STATIC' | 'DYNAMIC' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 11px;
  font-weight: 500;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $type, theme }) =>
    $type === 'STATIC' ? theme.colors.purpleSoft : theme.colors.cyanSoft};
  color: ${({ $type, theme }) =>
    $type === 'STATIC' ? theme.colors.purple : theme.colors.cyan};
`;

export const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  text-transform: uppercase;
`;

export const LocationText = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const DynamicInfo = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const StatusBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.white50};
`;

export const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  color: ${({ theme }) => theme.colors.white70};
  
  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.white};
  }
`;

export const DismissDropdownContainer = styled.div`
  position: relative;
`;

// Legacy fix action styles
export const FixActionBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px dashed ${({ theme }) => theme.colors.cyan}50;
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const FixIcon = styled.span`
  font-size: 20px;
`;

export const FixContent = styled.div`
  flex: 1;
`;

export const FixLabel = styled.span`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const FixCommand = styled.code`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.cyan};
`;

export const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.cyan};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.void};
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

// Legacy details styles
export const SeverityIcon = styled.span``;
export const DescriptionTextLegacy = styled.p``;
export const DetailsSection = styled.div``;
export const DetailItem = styled.div``;
export const DetailLabel = styled.span``;
export const DetailValue = styled.span``;
export const CodeSnippetContainer = styled.div``;
export const CodeSnippetHeader = styled.div``;
export const CodeSnippetFile = styled.span``;
export const CodeSnippetBody = styled.pre``;
export const ExpandButton = styled.button<{ $expanded: boolean }>``;
export const FixHintsBox = styled.div``;
export const FixHintsIcon = styled.span``;
export const FixHintsText = styled.span``;
export const ImpactBadge = styled.span<{ $severity: string }>``;

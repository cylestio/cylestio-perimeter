import styled, { css, keyframes } from 'styled-components';
import type { FindingSeverity, RecommendationStatus } from '@api/types/findings';

export const CardContainer = styled.div<{ $severity: FindingSeverity }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL':
        return `${theme.colors.red}40`;
      case 'HIGH':
        return `${theme.colors.orange}30`;
      case 'MEDIUM':
        return `${theme.colors.yellow}20`;
      default:
        return theme.colors.borderSubtle;
    }
  }};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ $severity, theme }) => {
      switch ($severity) {
        case 'CRITICAL':
          return `${theme.colors.red}60`;
        case 'HIGH':
          return `${theme.colors.orange}50`;
        case 'MEDIUM':
          return `${theme.colors.yellow}40`;
        default:
          return theme.colors.borderMedium;
      }
    }};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
`;

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
    $type === 'STATIC' ? theme.colors.purpleSoft : theme.colors.blueSoft};
  color: ${({ $type, theme }) => 
    $type === 'STATIC' ? theme.colors.purple : theme.colors.blue};
`;

export const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const TitleText = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  flex: 1;
`;

export const SeverityIcon = styled.span<{ $severity: FindingSeverity }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  
  ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.severityCritical};
        `;
      case 'HIGH':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.severityHigh};
        `;
      case 'MEDIUM':
        return css`
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.severityMedium};
        `;
      default:
        return css`
          background: ${theme.colors.white08};
          color: ${theme.colors.severityLow};
        `;
    }
  }}
`;

export const MetadataRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
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

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

export const StatusBadge = styled.span<{ $status: RecommendationStatus }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'PENDING':
        return css`
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.yellow};
        `;
      case 'FIXING':
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
          animation: ${pulseAnimation} 1.5s ease-in-out infinite;
        `;
      case 'FIXED':
        return css`
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `;
      case 'VERIFIED':
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
      case 'RESOLVED':
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
      case 'DISMISSED':
      case 'IGNORED':
        return css`
          background: ${theme.colors.surface2};
          color: ${theme.colors.white50};
        `;
      default:
        return css`
          background: ${theme.colors.surface2};
          color: ${theme.colors.white50};
        `;
    }
  }}
`;

export const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding-top: ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
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
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return css`
          background: ${theme.colors.cyan};
          border: none;
          color: ${theme.colors.background};
          
          &:hover {
            background: ${theme.colors.cyanHover || theme.colors.cyan};
            opacity: 0.9;
          }
        `;
      case 'danger':
        return css`
          background: transparent;
          border: 1px solid ${theme.colors.red};
          color: ${theme.colors.red};
          
          &:hover {
            background: ${theme.colors.redSoft};
          }
        `;
      default:
        return css`
          background: transparent;
          border: 1px solid ${theme.colors.borderSubtle};
          color: ${theme.colors.white70};
          
          &:hover {
            background: ${theme.colors.surface2};
            color: ${theme.colors.white};
            border-color: ${theme.colors.borderMedium};
          }
        `;
    }
  }}
`;

export const DismissDropdownContainer = styled.div`
  position: relative;
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
  min-width: 200px;
  z-index: 100;
  overflow: hidden;
`;

export const DropdownItem = styled.button`
  display: block;
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
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }
`;

// New components for expanded details
export const DescriptionText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
  line-height: 1.5;
`;

export const DetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const DetailLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const DetailValue = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white80};
  line-height: 1.4;
`;

export const CodeSnippetContainer = styled.div`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

export const CodeSnippetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const CodeSnippetFile = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const CodeSnippetBody = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing[3]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white80};
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const ImpactBadge = styled.span<{ $severity: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 500;
  
  ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.severityCritical};
        `;
      case 'HIGH':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.severityHigh};
        `;
      default:
        return css`
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.yellow};
        `;
    }
  }}
`;

export const ExpandButton = styled.button<{ $expanded: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: transparent;
  border: none;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  svg {
    transform: ${({ $expanded }) => $expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
    transition: transform ${({ theme }) => theme.transitions.fast};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.white};
  }
`;

export const FixHintsBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.greenSoft};
  border: 1px solid ${({ theme }) => theme.colors.green}30;
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const FixHintsIcon = styled.span`
  color: ${({ theme }) => theme.colors.green};
  flex-shrink: 0;
`;

export const FixHintsText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white80};
  line-height: 1.5;
`;

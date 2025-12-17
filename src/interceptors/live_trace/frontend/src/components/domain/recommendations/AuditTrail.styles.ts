import styled, { css } from 'styled-components';

export const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const TimelineItem = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} 0;
  position: relative;

  /* Vertical line between items */
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 14px;
    top: 42px;
    bottom: 0;
    width: 2px;
    background: ${({ theme }) => theme.colors.borderSubtle};
  }
`;

type ActionType = 'CREATED' | 'STARTED' | 'COMPLETED' | 'VERIFIED' | 'DISMISSED' | 'IGNORED' | 'REOPENED' | 'STATUS_CHANGED';

export const TimelineIcon = styled.div<{ $action: ActionType }>`
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radii.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  z-index: 1;
  
  ${({ $action, theme }) => {
    switch ($action) {
      case 'CREATED':
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
      case 'STARTED':
        return css`
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.yellow};
        `;
      case 'COMPLETED':
        return css`
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `;
      case 'VERIFIED':
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
      case 'DISMISSED':
      case 'IGNORED':
        return css`
          background: ${theme.colors.orangeSoft};
          color: ${theme.colors.orange};
        `;
      case 'REOPENED':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.red};
        `;
      default:
        return css`
          background: ${theme.colors.surface2};
          color: ${theme.colors.white50};
        `;
    }
  }}
`;

export const TimelineContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const TimelineAction = styled.span`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const TimelineReason = styled.blockquote`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  font-style: italic;
  margin: ${({ theme }) => theme.spacing[2]} 0;
  padding-left: ${({ theme }) => theme.spacing[3]};
  border-left: 2px solid ${({ theme }) => theme.colors.borderMedium};
`;

export const TimelineMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const MetaSeparator = styled.span`
  color: ${({ theme }) => theme.colors.white30};
`;

export const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
  font-size: 13px;
`;

export const FilesChanged = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

export const FileTag = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 11px;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.white70};
`;

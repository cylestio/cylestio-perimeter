import styled from 'styled-components';

export const TrailWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const TimelineItem = styled.div`
  display: flex;
  position: relative;
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  
  /* Timeline line */
  &::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 24px;
    bottom: 0;
    width: 2px;
    background: ${({ theme }) => theme.colors.borderSubtle};
  }
  
  /* Last item has no line */
  &:last-child::before {
    display: none;
  }
  
  &:last-child {
    padding-bottom: 0;
  }
`;

type ActionType = 'CREATED' | 'STATUS_CHANGE' | 'FIXING' | 'FIXED' | 'VERIFIED' | 'DISMISSED' | 'IGNORED' | 'REOPENED';

interface TimelineIconWrapperProps {
  $action: ActionType;
}

const getActionColor = (action: ActionType, theme: any) => {
  switch (action) {
    case 'CREATED':
      return theme.colors.purple;
    case 'FIXING':
      return theme.colors.yellow;
    case 'FIXED':
      return theme.colors.green;
    case 'VERIFIED':
      return theme.colors.cyan;
    case 'DISMISSED':
    case 'IGNORED':
      return theme.colors.orange;
    case 'REOPENED':
      return theme.colors.red;
    default:
      return theme.colors.white50;
  }
};

const getActionBackground = (action: ActionType, theme: any) => {
  switch (action) {
    case 'CREATED':
      return theme.colors.purpleSoft;
    case 'FIXING':
      return theme.colors.yellowSoft;
    case 'FIXED':
      return theme.colors.greenSoft;
    case 'VERIFIED':
      return theme.colors.cyanSoft;
    case 'DISMISSED':
    case 'IGNORED':
      return theme.colors.orangeSoft;
    case 'REOPENED':
      return theme.colors.redSoft;
    default:
      return theme.colors.surface2;
  }
};

export const TimelineIconWrapper = styled.div<TimelineIconWrapperProps>`
  width: 24px;
  height: 24px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $action, theme }) => getActionBackground($action, theme)};
  color: ${({ $action, theme }) => getActionColor($action, theme)};
  z-index: 1;
`;

export const TimelineContent = styled.div`
  flex: 1;
  margin-left: ${({ theme }) => theme.spacing[3]};
  padding-top: 2px;
`;

export const TimelineAction = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

export const TimelineReason = styled.blockquote`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  font-style: italic;
  margin: ${({ theme }) => `${theme.spacing[1]} 0 0 0`};
  padding-left: ${({ theme }) => theme.spacing[3]};
  border-left: 2px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const TimelineMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[1]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const TimelineUser = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
`;

export const TimelineDot = styled.span`
  color: ${({ theme }) => theme.colors.white30};
`;

export const EmptyTrail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.white50};
  text-align: center;

  svg {
    margin-bottom: ${({ theme }) => theme.spacing[3]};
    opacity: 0.5;
  }

  p {
    font-size: 13px;
    margin: 0;
  }
`;


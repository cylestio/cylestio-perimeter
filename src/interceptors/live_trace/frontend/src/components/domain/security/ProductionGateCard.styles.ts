import styled from 'styled-components';

export const GateCard = styled.div<{ $isBlocked: boolean }>`
  background: ${({ $isBlocked, theme }) =>
    $isBlocked
      ? `linear-gradient(135deg, ${theme.colors.redSoft}, ${theme.colors.surface})`
      : `linear-gradient(135deg, ${theme.colors.greenSoft}, ${theme.colors.surface})`};
  border: 2px solid ${({ $isBlocked, theme }) =>
    $isBlocked ? theme.colors.red : theme.colors.green};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const GateHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[5]};
`;

export const GateIcon = styled.div<{ $isBlocked: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $isBlocked, theme }) =>
    $isBlocked ? theme.colors.red : theme.colors.green};
  color: white;
  flex-shrink: 0;
`;

export const GateContent = styled.div`
  flex: 1;
`;

export const GateTitle = styled.h3<{ $isBlocked: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $isBlocked, theme }) =>
    $isBlocked ? theme.colors.red : theme.colors.green};
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
`;

export const GateDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
  line-height: 1.4;
`;

export const BlockingList = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const BlockingItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.red}30;
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const BlockingItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const BlockingItemTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const BlockingItemMeta = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const FixButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.cyan};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.cyanSoft};
    border-color: ${({ theme }) => theme.colors.cyan};
  }
`;

export const GateActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface2};
`;

export const SuccessMessage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.greenSoft}30;
`;

export const SuccessItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.green};
`;

export const MoreItemsText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  text-align: center;
`;

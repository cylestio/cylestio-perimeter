import styled from 'styled-components';

export const HintCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const HintIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.cyanSoft};
  color: ${({ theme }) => theme.colors.cyan};
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const HintContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const HintTitle = styled.div`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: 2px;
`;

export const HintCommand = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.cyan};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CopyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
    border-color: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.cyan};
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const IdeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: ${({ theme }) => theme.colors.purpleSoft};
  color: ${({ theme }) => theme.colors.purple};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: ${({ theme }) => theme.spacing[2]};
`;

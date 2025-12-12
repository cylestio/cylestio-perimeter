import styled from 'styled-components';

export const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

export const ModalDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
  line-height: 1.5;
`;

export const DismissTypeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const SectionLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

export const DismissOption = styled.label<{ $selected?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.surface2 : 'transparent'};
  border: 1px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.cyan : theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const OptionContent = styled.div`
  flex: 1;
`;

export const OptionTitle = styled.span`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const OptionDescription = styled.span`
  display: block;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const ReasonSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const RequiredNote = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.orange};
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;


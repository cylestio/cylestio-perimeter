import styled, { css } from 'styled-components';

interface ModeIndicatorsContainerProps {
  $collapsed: boolean;
}

export const ModeIndicatorsContainer = styled.div<ModeIndicatorsContainerProps>`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      flex-direction: column;
      align-items: center;
      padding: ${({ theme }) => theme.spacing[2]};
    `}
`;

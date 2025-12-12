import styled, { css } from 'styled-components';

interface StyledPageProps {
  $fullWidth: boolean;
}

export const StyledPage = styled.div<StyledPageProps>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  width: 100%;

  ${({ $fullWidth, theme }) =>
    !$fullWidth &&
    css`
      max-width: ${theme.layout.pageMaxWidth};
      margin: 0 auto;
      padding: ${theme.spacing[6]};
    `}
`;

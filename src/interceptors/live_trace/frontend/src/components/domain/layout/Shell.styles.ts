import styled from 'styled-components';

export const StyledShell = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.void};
`;

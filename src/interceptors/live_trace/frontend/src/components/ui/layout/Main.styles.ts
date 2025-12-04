import styled from 'styled-components';

export const StyledMain = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: ${({ theme }) => theme.layout.sidebarWidth};
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.void};
`;

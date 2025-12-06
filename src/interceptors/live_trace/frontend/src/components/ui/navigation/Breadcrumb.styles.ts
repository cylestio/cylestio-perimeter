import styled from 'styled-components';

export const BreadcrumbContainer = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
`;

export const BreadcrumbLink = styled.a`
  color: ${({ theme }) => theme.colors.white50};
  text-decoration: none;
  transition: color 150ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.white};
  }
`;

export const BreadcrumbCurrent = styled.span`
  color: ${({ theme }) => theme.colors.white90};
`;

export const BreadcrumbSeparator = styled.span`
  color: ${({ theme }) => theme.colors.white30};
`;

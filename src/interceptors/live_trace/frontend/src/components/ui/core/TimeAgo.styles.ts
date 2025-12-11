import styled from 'styled-components';

export const TimeAgoWrapper = styled.span`
  display: inline-block;
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: default;
`;

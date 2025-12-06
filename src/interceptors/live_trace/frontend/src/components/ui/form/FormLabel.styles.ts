import styled from 'styled-components';

export const StyledFormLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  margin-bottom: 6px;
`;

export const RequiredMark = styled.span`
  color: ${({ theme }) => theme.colors.red};
  margin-left: 2px;
`;

export const StyledFormError = styled.span`
  display: block;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.red};
  margin-top: 6px;
`;

export const StyledFormHint = styled.span`
  display: block;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white30};
  margin-top: 6px;
`;

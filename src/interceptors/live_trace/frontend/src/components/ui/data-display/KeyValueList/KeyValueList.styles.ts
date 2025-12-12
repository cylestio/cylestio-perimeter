import styled from 'styled-components';

export const StyledKeyValueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const KeyValueItem = styled.div``;

interface KeyLabelProps {
  $size: 'sm' | 'md';
}

export const KeyLabel = styled.div<KeyLabelProps>`
  font-size: ${({ $size }) => ($size === 'sm' ? '10px' : '11px')};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: ${({ theme }) => theme.typography.fontMono};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

interface KeyValueProps {
  $size: 'sm' | 'md';
  $mono?: boolean;
}

export const KeyValue = styled.div<KeyValueProps>`
  font-size: ${({ theme, $size }) =>
    $size === 'sm' ? theme.typography.textSm : theme.typography.textMd};
  font-family: ${({ theme, $mono }) =>
    $mono ? theme.typography.fontMono : theme.typography.fontDisplay};
  color: ${({ theme }) => theme.colors.white90};
  word-break: break-all;
`;


import styled, { css } from 'styled-components';

export const CodeContainer = styled.div`
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

export const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const Filename = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const Language = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white30};
  margin-left: ${({ theme }) => theme.spacing[2]};
  text-transform: uppercase;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const CopyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: ${({ theme }) => theme.colors.white08};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.white15};
    color: ${({ theme }) => theme.colors.white90};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }
`;

interface CodeContentProps {
  $maxHeight?: string;
}

export const CodeContent = styled.div<CodeContentProps>`
  padding: 16px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 13px;
  overflow-x: auto;

  ${({ $maxHeight }) =>
    $maxHeight &&
    css`
      max-height: ${$maxHeight};
      overflow-y: auto;
    `}
`;

interface CodeLineProps {
  $highlight?: boolean;
  $added?: boolean;
  $removed?: boolean;
}

export const CodeLine = styled.div<CodeLineProps>`
  display: flex;
  min-height: 24px;
  line-height: 24px;

  ${({ $highlight, theme }) =>
    $highlight &&
    css`
      background: ${theme.colors.redSoft};
      margin: 0 -16px;
      padding: 0 16px;
    `}

  ${({ $added, theme }) =>
    $added &&
    css`
      background: ${theme.colors.greenSoft};
      margin: 0 -16px;
      padding: 0 16px;
    `}

  ${({ $removed, theme }) =>
    $removed &&
    css`
      background: ${theme.colors.redSoft};
      margin: 0 -16px;
      padding: 0 16px;
    `}
`;

export const LineNumber = styled.span`
  width: 36px;
  flex-shrink: 0;
  text-align: right;
  padding-right: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.white15};
  user-select: none;
`;

interface LineContentProps {
  $added?: boolean;
  $removed?: boolean;
}

export const LineContent = styled.span<LineContentProps>`
  flex: 1;
  color: ${({ theme }) => theme.colors.white90};
  white-space: pre;

  ${({ $added, theme }) =>
    $added &&
    css`
      color: ${theme.colors.green};

      &::before {
        content: '+ ';
        color: ${theme.colors.green};
      }
    `}

  ${({ $removed, theme }) =>
    $removed &&
    css`
      color: ${theme.colors.red};
      text-decoration: line-through;

      &::before {
        content: '- ';
        color: ${theme.colors.red};
      }
    `}
`;

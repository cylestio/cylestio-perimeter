import styled, { css } from 'styled-components';

interface SelectWrapperProps {
  $fullWidth?: boolean;
}

export const SelectWrapper = styled.div<SelectWrapperProps>`
  display: inline-flex;
  flex-direction: column;
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}
`;

interface StyledSelectProps {
  $hasError?: boolean;
}

export const StyledSelect = styled.select<StyledSelectProps>`
  width: 100%;
  padding: 10px 38px 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.white};
  font-size: 13px;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  transition: all 200ms ease;
  outline: none;
  cursor: pointer;
  appearance: none;

  &:focus {
    background: ${({ theme }) => theme.colors.surface3};
    border-color: ${({ theme }) => theme.colors.cyan};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.borderSubtle};
    color: ${({ theme }) => theme.colors.white30};
    cursor: not-allowed;
  }

  ${({ $hasError, theme }) =>
    $hasError &&
    css`
      background: ${theme.colors.redSoft};
      border-color: ${theme.colors.red};

      &:focus {
        background: ${theme.colors.redSoft};
        border-color: ${theme.colors.red};
      }
    `}

  option {
    background: ${({ theme }) => theme.colors.surface3};
    color: ${({ theme }) => theme.colors.white};
    padding: 8px;
  }
`;

export const SelectContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const ChevronIcon = styled.span`
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
  pointer-events: none;

  svg {
    width: 16px;
    height: 16px;
  }
`;

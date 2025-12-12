import styled, { css } from 'styled-components';

type CheckStatus = 'PASS' | 'FAIL' | 'INFO';

const statusBorderStyles: Record<CheckStatus, ReturnType<typeof css>> = {
  PASS: css`
    border-left-color: ${({ theme }) => theme.colors.green};
  `,
  FAIL: css`
    border-left-color: ${({ theme }) => theme.colors.red};
  `,
  INFO: css`
    border-left-color: ${({ theme }) => theme.colors.yellow};
  `,
};

interface CheckCardWrapperProps {
  $status: CheckStatus;
  $isExpanded: boolean;
}

export const CheckCardWrapper = styled.div<CheckCardWrapperProps>`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-left: 3px solid;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.base};

  ${({ $status }) => statusBorderStyles[$status]}

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

export const CheckCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  cursor: pointer;
  user-select: none;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
  }
`;

export const CheckCardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const statusIconStyles: Record<CheckStatus, ReturnType<typeof css>> = {
  PASS: css`
    color: ${({ theme }) => theme.colors.green};
    background: ${({ theme }) => theme.colors.greenSoft};
  `,
  FAIL: css`
    color: ${({ theme }) => theme.colors.red};
    background: ${({ theme }) => theme.colors.redSoft};
  `,
  INFO: css`
    color: ${({ theme }) => theme.colors.yellow};
    background: ${({ theme }) => theme.colors.yellowSoft};
  `,
};

interface StatusIconWrapperProps {
  $status: CheckStatus;
}

export const StatusIconWrapper = styled.div<StatusIconWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  flex-shrink: 0;

  ${({ $status }) => statusIconStyles[$status]}
`;

export const CheckInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const CheckName = styled.span`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white90};
`;

export const CheckMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const CheckCardRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const FindingsCount = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

export const ExpandIcon = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white50};
  transition: transform ${({ theme }) => theme.transitions.fast};

  ${({ $isExpanded }) =>
    $isExpanded &&
    css`
      transform: rotate(180deg);
    `}
`;

export const CheckCardBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.void};
`;

export const FindingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const NoFindings = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

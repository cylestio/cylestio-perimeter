import styled from 'styled-components';

export const IDESection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

export const IDEInstructionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const IDEHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const IDETitle = styled.h4`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const CommandList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const CommandBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
`;

export const CommandNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.cyan}20;
  color: ${({ theme }) => theme.colors.cyan};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  flex-shrink: 0;
`;

export const CommandText = styled.code`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
  word-break: break-all;
  line-height: 1.4;
`;

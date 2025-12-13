import styled from 'styled-components';

export const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ToolsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ToolItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const ToolName = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white80};
`;

export const ToolCount = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.cyan};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

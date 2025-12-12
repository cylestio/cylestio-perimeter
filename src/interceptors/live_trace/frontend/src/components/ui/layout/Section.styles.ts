import styled, { css } from 'styled-components';

// Container
export const StyledSection = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

// Header
export const StyledSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.layout.cardHeaderPadding};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

// Title
export const StyledSectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

// Content
interface StyledSectionContentProps {
  $noPadding?: boolean;
}

export const StyledSectionContent = styled.div<StyledSectionContentProps>`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  ${({ $noPadding, theme }) =>
    !$noPadding &&
    css`
      padding: ${theme.spacing[5]};
    `}
`;

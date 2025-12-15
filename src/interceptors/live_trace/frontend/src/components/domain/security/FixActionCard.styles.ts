import styled, { css } from 'styled-components';

export const ActionCardWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.base};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
    background: ${({ theme }) => theme.colors.surface3};
  }
`;

export const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.cyanSoft};
  color: ${({ theme }) => theme.colors.cyan};
  flex-shrink: 0;
`;

export const ActionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  flex: 1;
  min-width: 0;
`;

export const ActionTitle = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white90};
`;

export const ActionCommand = styled.code`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.void};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ActionDescription = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

interface CopyButtonProps {
  $copied?: boolean;
}

export const CopyButton = styled.button<CopyButtonProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-size: 11px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;
  
  ${({ $copied, theme }) => $copied
    ? css`
        background: ${theme.colors.greenSoft};
        color: ${theme.colors.green};
        border: 1px solid ${theme.colors.green};
      `
    : css`
        background: transparent;
        color: ${theme.colors.white70};
        border: 1px solid ${theme.colors.borderMedium};
        
        &:hover {
          color: ${theme.colors.cyan};
          border-color: ${theme.colors.cyan};
          background: ${theme.colors.cyanSoft};
        }
      `
  }
`;

export const ViewRecommendationLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.cyan};
  text-decoration: none;
  margin-top: ${({ theme }) => theme.spacing[1]};
  
  &:hover {
    text-decoration: underline;
  }
`;

export const IdeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white50};
`;

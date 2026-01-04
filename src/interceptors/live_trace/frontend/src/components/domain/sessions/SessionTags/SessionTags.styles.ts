import styled from 'styled-components';

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  align-items: center;
`;

export const TagItem = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing[0.5]} ${theme.spacing[1.5]}`};
  background: ${({ theme }) => theme.colors.white5};
  border: 1px solid ${({ theme }) => theme.colors.white10};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-family: ${({ theme }) => theme.fonts.mono};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background: ${({ theme }) => theme.colors.white10};
    border-color: ${({ theme }) => theme.colors.white20};
  }
`;

export const TagKey = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
  margin-right: ${({ theme }) => theme.spacing[0.5]};

  &::after {
    content: ':';
    color: ${({ theme }) => theme.colors.white30};
  }
`;

export const TagValue = styled.span`
  color: ${({ theme }) => theme.colors.white70};
`;

export const EmptyTags = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.white30};
  font-size: 12px;
`;

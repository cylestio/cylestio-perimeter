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
  padding: 2px 6px;
  background: ${({ theme }) => theme.colors.white04};
  border: 1px solid ${({ theme }) => theme.colors.white08};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background: ${({ theme }) => theme.colors.white08};
    border-color: ${({ theme }) => theme.colors.white15};
  }
`;

export const TagKey = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
  margin-right: 2px;

  &::after {
    content: ':';
    color: ${({ theme }) => theme.colors.white30};
  }
`;

export const TagValue = styled.span`
  color: ${({ theme }) => theme.colors.white70};
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TagKeyOnly = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
`;

export const EmptyTags = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.white30};
  font-size: 12px;
`;

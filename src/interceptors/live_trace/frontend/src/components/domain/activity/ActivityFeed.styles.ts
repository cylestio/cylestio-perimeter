import styled, { css } from 'styled-components';
import type { ActivityType } from './ActivityFeed';

export const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

interface FeedItemProps {
  $clickable?: boolean;
}

export const FeedItem = styled.div<FeedItemProps>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  &:last-child {
    border-bottom: none;
  }

  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;
      transition: background ${({ theme }) => theme.transitions.fast};

      &:hover {
        background: ${({ theme }) => theme.colors.white04};
        margin: 0 -16px;
        padding-left: 16px;
        padding-right: 16px;
      }
    `}
`;

interface ItemIconProps {
  $type: ActivityType;
}

export const ItemIcon = styled.div<ItemIconProps>`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  ${({ $type, theme }) => {
    switch ($type) {
      case 'fixed':
        return css`
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `;
      case 'found':
        return css`
          background: ${theme.colors.orangeSoft};
          color: ${theme.colors.orange};
        `;
      case 'session':
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
      case 'scan':
        return css`
          background: ${theme.colors.purpleSoft};
          color: ${theme.colors.purple};
        `;
    }
  }}
`;

export const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ItemTitle = styled.span`
  display: block;
  margin-bottom: 2px;
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white90};
`;

export const ItemDetail = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white30};
`;

export const ItemTime = styled.div`
  font-size: 10px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white15};
  flex-shrink: 0;
`;

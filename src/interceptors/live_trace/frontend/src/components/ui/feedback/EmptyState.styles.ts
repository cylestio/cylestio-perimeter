import styled from 'styled-components';
import { Heading } from '../core/Heading';

export const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
`;

export const IconContainer = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.white04};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.white15};

  svg {
    width: 28px;
    height: 28px;
  }
`;

export const Title = styled(Heading).attrs({ level: 3, size: 'md' })`
  margin: 0 0 8px 0;
`;

export const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.textBase};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white50};
  max-width: 280px;
  margin: 0;
`;

export const ActionWrapper = styled.div`
  margin-top: 20px;
`;

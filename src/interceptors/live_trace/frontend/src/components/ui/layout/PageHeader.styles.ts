import styled from 'styled-components';
import { Heading } from '@ui/core/Heading';

export const StyledPageHeader = styled.div<{ $hasActions: boolean }>`
  display: ${({ $hasActions }) => ($hasActions ? 'flex' : 'block')};
  align-items: ${({ $hasActions }) => ($hasActions ? 'flex-start' : 'initial')};
  justify-content: ${({ $hasActions }) => ($hasActions ? 'space-between' : 'initial')};
  gap: ${({ theme, $hasActions }) => ($hasActions ? theme.spacing[4] : '0')};
`;

export const HeaderContent = styled.div``;

export const PageTitle = styled(Heading).attrs({ level: 1, size: 'xl' })`
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const TitleContent = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const TitleIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.white};
`;

export const PageDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
`;

export const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
`;

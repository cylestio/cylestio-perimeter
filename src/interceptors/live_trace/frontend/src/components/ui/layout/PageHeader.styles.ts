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

export const TitleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.void};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.cyan}, ${({ theme }) => theme.colors.purple});
  border-radius: ${({ theme }) => theme.radii.sm};
  margin-left: ${({ theme }) => theme.spacing[2]};
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

import styled from 'styled-components';
import { Heading } from '@ui/core/Heading';

export const SplitView = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  min-height: 600px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const SessionList = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const SessionListHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const SessionListTitle = styled(Heading).attrs({ level: 3, size: 'xs' })`
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const SessionListItems = styled.div`
  max-height: 500px;
  overflow-y: auto;
`;

export const SessionItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ $active, theme }) => $active ? theme.colors.surface3 : 'transparent'};
  border-left: 3px solid ${({ $active, theme }) => $active ? theme.colors.cyan : 'transparent'};

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
  }
`;

export const SessionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const SessionAgent = styled.span`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white90};
`;

export const SessionMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white50};
`;

export const SessionDetail = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const DetailHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const DetailTitle = styled(Heading).attrs({ level: 2, size: 'md' })`
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const DetailStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

export const DetailStat = styled.div``;

export const StatLabel = styled.span`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.typography.textXs};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white50};
`;

export const StatValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textMd};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
`;

export const DetailContent = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

export const EventsTitle = styled(Heading).attrs({ level: 3, size: 'xs' })`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const EmptyDetail = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white50};
`;

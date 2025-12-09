import styled from 'styled-components';

export const SuccessContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[6]};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.greenSoft} 0%,
    rgba(0, 255, 136, 0.05) 100%
  );
  border: 1px solid ${({ theme }) => theme.colors.green}50;
  border-radius: ${({ theme }) => theme.radii.xl};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  width: 100%;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: ${({ theme }) => theme.colors.green};
  }
`;

export const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.green}20;
  border: 2px solid ${({ theme }) => theme.colors.green}60;
  color: ${({ theme }) => theme.colors.green};
  box-shadow: 0 0 20px ${({ theme }) => theme.colors.green}25;
`;

export const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  flex: 1;
  min-width: 0;
`;

export const Title = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const Subtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
`;

export const StatsSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding-left: ${({ theme }) => theme.spacing[4]};
  border-left: 1px solid ${({ theme }) => theme.colors.green}30;
`;

export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
`;

export const StatValue = styled.span`
  font-size: 24px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.green};
  font-family: ${({ theme }) => theme.typography.fontMono};
  line-height: 1;
`;

export const StatLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white30};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const ActionSection = styled.div`
  flex-shrink: 0;
`;

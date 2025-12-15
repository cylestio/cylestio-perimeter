import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(360px, 1.2fr);
  gap: ${({ theme }) => theme.spacing[5]};
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const ChartSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[5]};
`;

export const ChartTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
`;

export const ChartSubtitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const PricingNote = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
`;

// Token distribution bar (input vs output)
export const TokenDistributionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

interface TokenDistributionBarProps {
  $inputPercent: number;
}

export const TokenDistributionBar = styled.div<TokenDistributionBarProps>`
  position: relative;
  width: 100%;
  height: 20px;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $inputPercent }) => $inputPercent}%;
    background: ${({ theme }) => theme.colors.cyan};
    transition: width 0.3s ease;
  }

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: ${({ $inputPercent }) => 100 - $inputPercent}%;
    background: ${({ theme }) => theme.colors.purple};
    transition: width 0.3s ease;
  }
`;

export const TokenDistributionLabels = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface TokenLabelProps {
  $color?: 'cyan' | 'purple';
}

export const TokenLabel = styled.div<TokenLabelProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const TokenColorDot = styled.div<TokenLabelProps>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ theme, $color }) => ($color === 'purple' ? theme.colors.purple : theme.colors.cyan)};
`;

export const TokenLabelText = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
`;

export const TokenLabelValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
`;

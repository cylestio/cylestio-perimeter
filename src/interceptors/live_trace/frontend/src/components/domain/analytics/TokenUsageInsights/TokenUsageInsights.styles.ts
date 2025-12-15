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

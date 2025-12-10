import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
  padding: ${({ theme }) => theme.spacing[5]};
`;

export const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const Title = styled.h4`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
  margin: 0;
`;

export const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};

  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export const ProgressBarWrapper = styled.div`
  flex: 1;
`;

export const ProgressCount = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.cyan};
  white-space: nowrap;
`;

export const ProgressHint = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};

  margin-top: ${({ theme }) => theme.spacing[2]};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.cyan};
    opacity: 0.8;
  }
`;

export const LoaderSection = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;
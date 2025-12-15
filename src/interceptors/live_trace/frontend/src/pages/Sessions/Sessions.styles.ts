import styled from 'styled-components';

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

export const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const ClusterFilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const ClusterFilterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  white-space: nowrap;

  svg {
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.colors.purple};
  }
`;

export const ClusterDivider = styled.div`
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.colors.borderMedium};
`;

export const ClusterToggleWrapper = styled.div`
  flex: 1;
  overflow-x: auto;

  /* Override ToggleGroup's default padding/background since we handle it in FilterBar */
  > div {
    padding: 0;
    background: transparent;
  }
`;

import styled from 'styled-components';

export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const FilterLabel = styled.div`
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
    opacity: 0.7;
  }
`;

export const FilterDivider = styled.div`
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.colors.borderMedium};
`;

export const ToggleWrapper = styled.div`
  flex: 1;
  overflow-x: auto;

  /* Override ToggleGroup's default padding/background since we handle it in FilterBar */
  > div {
    padding: 0;
    background: transparent;
  }
`;

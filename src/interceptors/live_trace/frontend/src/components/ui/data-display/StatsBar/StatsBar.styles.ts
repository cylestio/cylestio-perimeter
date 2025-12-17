import styled from 'styled-components';

export type StatColor = 'cyan' | 'green' | 'orange' | 'red' | 'purple';

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 160px;
`;

interface IconContainerProps {
  $color?: StatColor;
}

export const IconContainer = styled.div<IconContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $color }) => {
    switch ($color) {
      case 'green':
        return `${theme.colors.green}15`;
      case 'orange':
        return `${theme.colors.orange}15`;
      case 'red':
        return `${theme.colors.red}15`;
      case 'purple':
        return `${theme.colors.purple}15`;
      default:
        return `${theme.colors.cyan}15`;
    }
  }};
  color: ${({ theme, $color }) => {
    switch ($color) {
      case 'green':
        return theme.colors.green;
      case 'orange':
        return theme.colors.orange;
      case 'red':
        return theme.colors.red;
      case 'purple':
        return theme.colors.purple;
      default:
        return theme.colors.cyan;
    }
  }};
`;

interface ValueProps {
  $color?: StatColor;
}

export const Value = styled.div<ValueProps>`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: 700;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $color }) => {
    switch ($color) {
      case 'green':
        return theme.colors.green;
      case 'orange':
        return theme.colors.orange;
      case 'red':
        return theme.colors.red;
      case 'purple':
        return theme.colors.purple;
      default:
        return theme.colors.white;
    }
  }};
`;

export const Label = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const Divider = styled.div`
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 ${({ theme }) => theme.spacing[2]};
`;

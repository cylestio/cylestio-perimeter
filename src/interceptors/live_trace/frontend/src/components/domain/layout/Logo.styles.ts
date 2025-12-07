import styled from 'styled-components';
import { orbSpin } from '@theme/animations';

interface LogoContainerProps {
  $collapsed: boolean;
}

export const LogoContainer = styled.div<LogoContainerProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
`;

export const Orb = styled.div`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: conic-gradient(
    from 0deg,
    ${({ theme }) => theme.colors.cyan},
    ${({ theme }) => theme.colors.green},
    ${({ theme }) => theme.colors.cyan}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${orbSpin} 8s linear infinite;
  filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.5)) drop-shadow(0 0 16px rgba(0, 255, 136, 0.3));
  flex-shrink: 0;
`;

export const OrbInner = styled.div`
  width: 18px;
  height: 18px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surface};
`;

export const LogoText = styled.span`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.typography.weightExtrabold};
  color: ${({ theme }) => theme.colors.white};
  white-space: nowrap;
`;

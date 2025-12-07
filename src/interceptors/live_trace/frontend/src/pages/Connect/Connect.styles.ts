import styled from 'styled-components';
import { Card } from '@ui/core/Card';
import { Button } from '@ui/core/Button';
import { orbSpin } from '@theme/animations';

export const ConnectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

// ============ Hero Section ============
export const HeroSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[10]};
`;

export const LogoOrb = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.full};
  background: conic-gradient(
    from 0deg,
    ${({ theme }) => theme.colors.cyan},
    ${({ theme }) => theme.colors.green},
    rgba(168, 85, 247, 0.5),
    ${({ theme }) => theme.colors.cyan}
  );
  animation: ${orbSpin} 10s linear infinite;
  position: relative;
  box-shadow:
    0 0 40px rgba(0, 240, 255, 0.3),
    0 0 80px rgba(0, 255, 136, 0.2);

  &::after {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: ${({ theme }) => theme.radii.full};
    background: ${({ theme }) => theme.colors.void};
  }
`;

export const HeroTitle = styled.h1`
  font-size: 40px;
  font-weight: ${({ theme }) => theme.typography.weightExtrabold};
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.white};
`;

export const HeroHighlight = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
`;

export const HeroSubtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.6;
`;

// Styled Card with custom styling for Connect page
export const StyledCard = styled(Card)`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.xl};
  text-align: left;
`;

// ============ URL Copy Section ============
export const UrlSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const UrlBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

// ============ Config Details ============
export const ConfigDetails = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[5]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const ConfigItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

// ============ Status Banner ============
export const StatusBanner = styled.div<{ $status: 'waiting' | 'connected' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  ${({ $status, theme }) =>
    $status === 'connected'
      ? `
    background: ${theme.colors.greenSoft};
    border: 1px solid ${theme.colors.green}40;
  `
      : `
    background: ${theme.colors.surface2};
    border: 1px solid ${theme.colors.borderMedium};
  `}
`;

export const StatusDot = styled.div<{ $status: 'waiting' | 'connected' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.green};
`;

export const StatusSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

// ============ Footer Button ============
export const FooterButton = styled(Button)`
  width: 100%;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};

  &:hover {
    color: ${({ theme }) => theme.colors.cyan};
  }
`;

import styled from 'styled-components';
import { Card } from '@ui/core/Card';
import { Button } from '@ui/core/Button';

export const ConnectContainer = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding-top: ${({ theme }) => theme.spacing[4]};
`;

// Styled Card with custom styling for Connect page
export const StyledCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.xl};

  /* Override Card.Header styles for hero-style centered header */
  > div:first-child {
    border-bottom: none;
    padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[6]};

    /* Title - larger for hero card */
    h3 {
      font-size: 24px;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.white};
    }

    /* Subtitle */
    p {
      margin-top: ${({ theme }) => theme.spacing[2]};
    }
  }

  /* Override Card.Content padding */
  > div:last-child {
    padding: 0 ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[8]};
  }
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

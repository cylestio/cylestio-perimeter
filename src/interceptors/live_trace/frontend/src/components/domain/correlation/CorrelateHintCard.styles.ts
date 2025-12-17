import styled from 'styled-components';

export const HintCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.cyan}10 0%,
    ${({ theme }) => theme.colors.purple}10 100%
  );
  border: 1px solid ${({ theme }) => theme.colors.cyan}30;
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const HintIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.cyan}20;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 20px;
  flex-shrink: 0;
`;

export const HintContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  flex: 1;
`;

export const HintTitle = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
`;

export const HintDescription = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.5;
`;

export const HintCommand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

export const CommandCode = styled.code`
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.surface};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const CopyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.cyan}20;
    border-color: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.cyan};
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const IdeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: 2px 6px;
  background: ${({ theme }) => theme.colors.purple}20;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.purple};
  font-weight: 500;
`;

export const OrText = styled.span`
  color: ${({ theme }) => theme.colors.white50};
`;

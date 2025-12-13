import styled from 'styled-components';

export const HeroSection = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[10]};
`;

export const HeroTitle = styled.h1`
  font-size: 32px;
  font-weight: ${({ theme }) => theme.typography.weightExtrabold};
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.white};
`;

export const HeroHighlight = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
`;

export const HeroSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SectionBadge = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.white08};
  color: ${({ theme }) => theme.colors.white50};
`;

export const AgentWorkflowsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const UnassignedSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const EmptyAgentWorkflows = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const EmptyIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.white08};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white30};
`;

export const EmptyTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white70};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const EmptyDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  max-width: 400px;
  margin: 0 auto;
`;

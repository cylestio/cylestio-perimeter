import styled from 'styled-components';

export const RecommendationsLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[6]};
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

export const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  display: flex;
  align-items: center;
`;

export const PageSubtitle = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const AgentBadge = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.cyanSoft};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.md};
`;

// Filter tabs section
export const FilterTabsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  padding-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const FilterTabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const FixAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  font-size: 13px;
  font-weight: 500;
  background: ${({ theme }) => theme.colors.cyanSoft};
  color: ${({ theme }) => theme.colors.cyan};
  border: 1px solid ${({ theme }) => theme.colors.cyan}40;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.cyan}30;
    border-color: ${({ theme }) => theme.colors.cyan}60;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const CopiedToast = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.green};
  margin-left: ${({ theme }) => theme.spacing[2]};
`;

interface FilterTabProps {
  $active: boolean;
}

export const FilterTab = styled.button<FilterTabProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  font-size: 13px;
  font-weight: 500;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.surface2 : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.white : theme.colors.white50};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.borderMedium : 'transparent'};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.white};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const FilterCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: 2px ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surface};
`;

// Recommendations list
export const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

// Section header with count
export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SectionCount = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white50};
`;

// Resolved section
export const ResolvedSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const ResolvedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ResolvedItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const ResolvedId = styled.code`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
`;

export const ResolvedStatus = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.green};
  font-weight: 500;
`;

export const ResolvedTitle = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ResolvedDate = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white30};
`;

// Empty state
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[12]};
  text-align: center;
  color: ${({ theme }) => theme.colors.green};

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.white};
    margin: ${({ theme }) => theme.spacing[4]} 0 ${({ theme }) => theme.spacing[2]};
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.white50};
    margin: 0;
    max-width: 400px;
  }
`;

// Evidence modal content
export const EvidenceContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const EvidenceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const EvidenceLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const EvidenceCode = styled.pre`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.colors.surface2};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
`;

export const EvidenceText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.5;
  margin: 0;
`;


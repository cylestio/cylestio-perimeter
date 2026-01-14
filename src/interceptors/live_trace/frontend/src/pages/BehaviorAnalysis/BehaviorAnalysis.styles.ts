import styled from 'styled-components';

// ============ Main Container ============
export const PreviewCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

export const PreviewHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const PreviewTitle = styled.h2`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

export const PreviewDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.6;
  margin: 0;
  max-width: 700px;
`;

export const PreviewBody = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

// ============ Section Title ============
export const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

export const SectionDescription = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.5;
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  max-width: 600px;
`;

// ============ Cluster Visualization Section ============
export const ClusterSection = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[10]};
`;

// ============ Trust Pipeline ============
export const PipelineSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[10]};
`;

export const PipelineContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const PipelineSteps = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const PipelineStep = styled.div<{ $status?: 'active' | 'pending' | 'warning' }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme, $status }) =>
    $status === 'active'
      ? theme.colors.green + '60'
      : $status === 'warning'
        ? theme.colors.yellow + '60'
        : theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const PipelineIcon = styled.div<{ $status?: 'active' | 'pending' | 'warning' }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, $status }) =>
    $status === 'active'
      ? theme.colors.green + '20'
      : $status === 'warning'
        ? theme.colors.yellow + '20'
        : theme.colors.surface3};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $status }) =>
    $status === 'active'
      ? theme.colors.green
      : $status === 'warning'
        ? theme.colors.yellow
        : theme.colors.white50};
`;

export const PipelineLabel = styled.span`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  text-align: center;
`;

export const PipelineDesc = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white50};
  text-align: center;
  line-height: 1.3;
`;

export const PipelineArrow = styled.div`
  color: ${({ theme }) => theme.colors.white30};
  flex-shrink: 0;
`;

// ============ Drift Types ============
export const DriftTypesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const DriftTypeCard = styled.div<{ $type: 'valid' | 'review' }>`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme, $type }) =>
    $type === 'valid' ? theme.colors.green + '40' : theme.colors.yellow + '40'};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const DriftTypeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const DriftTypeIcon = styled.div<{ $type: 'valid' | 'review' }>`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $type }) =>
    $type === 'valid' ? theme.colors.green + '20' : theme.colors.yellow + '20'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $type }) =>
    $type === 'valid' ? theme.colors.green : theme.colors.yellow};
`;

export const DriftTypeTitle = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
`;

export const DriftTypeList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing[4]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.6;

  li {
    margin-bottom: ${({ theme }) => theme.spacing[1]};
  }
`;

// ============ Feature List ============
export const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const FeatureIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface3};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.cyan};
  flex-shrink: 0;
`;

export const FeatureContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const FeatureLabel = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
`;

export const FeatureDescription = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.4;
`;

// ============ CTA Section ============
export const CTASection = styled.div`
  display: flex;
  justify-content: center;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

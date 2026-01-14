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
  max-width: 600px;
`;

export const PreviewBody = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

// ============ Policy Examples Grid ============
export const PolicyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const PolicySection = styled.div<{ $tall?: boolean }>`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  ${({ $tall }) => $tall && `grid-row: span 2;`}
`;

export const PolicySectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const PolicySectionIcon = styled.div`
  color: ${({ theme }) => theme.colors.cyan};
  display: flex;
  align-items: center;
`;

export const PolicyContent = styled.div`
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
  line-height: 1.5;
`;

export const PolicyCode = styled.pre`
  margin: 0;
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.colors.void};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  overflow-x: auto;
  line-height: 1.6;
`;

export const PolicyGridTitle = styled.h3`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
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
  color: ${({ theme }) => theme.colors.white70};
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
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.4;
`;

// ============ CTA Section ============
export const CTASection = styled.div`
  display: flex;
  justify-content: center;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

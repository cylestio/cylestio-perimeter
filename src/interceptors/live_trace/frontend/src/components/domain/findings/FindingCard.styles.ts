import styled from 'styled-components';

export const FindingCardWrapper = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

export const FindingCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
  }
`;

export const ExpandButton = styled.button<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  padding: 0;
  margin-top: 2px;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.white90};
  }
`;

export const FindingCardHeaderContent = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const FindingCardTitle = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const FindingCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const FindingCardBadges = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
`;

export const FindingCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: 0 ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  padding-left: calc(${({ theme }) => theme.spacing[3]} + 16px + ${({ theme }) => theme.spacing[3]});
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  padding-top: ${({ theme }) => theme.spacing[4]};
`;

export const FindingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const FindingSectionTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white70};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
`;

export const CodeSnippet = styled.pre`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: ${({ theme }) => theme.spacing[3]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white90};
  overflow-x: auto;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: ${({ theme }) => theme.colors.white08};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white70};
`;

export const RecommendationLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.cyan}40;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.cyan};
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: ${({ theme }) => theme.spacing[2]};
  width: fit-content;

  &:hover {
    background: ${({ theme }) => theme.colors.cyanSoft};
    border-color: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.white};
  }
`;

export const FixActionBox = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.cyan}40;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};

  code {
    font-family: ${({ theme }) => theme.typography.fontMono};
    color: ${({ theme }) => theme.colors.cyan};
    background: ${({ theme }) => theme.colors.cyanSoft};
    padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

export const TimestampBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  font-size: 10px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white50};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.sm};
  
  svg {
    opacity: 0.7;
  }
`;

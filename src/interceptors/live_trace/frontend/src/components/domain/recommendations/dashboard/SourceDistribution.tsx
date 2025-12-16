import type { FC } from 'react';
import { FileCode, Activity, FolderOpen } from 'lucide-react';
import styled from 'styled-components';

import type { Recommendation, FindingSeverity } from '@api/types/findings';

// Styled Components
const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
`;

const SourcesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const SourceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SourceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-bottom: ${({ theme }) => theme.spacing[2]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

const SourceIcon = styled.span<{ $type: 'STATIC' | 'DYNAMIC' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $type, theme }) => 
    $type === 'STATIC' ? theme.colors.cyanSoft : theme.colors.purpleSoft};
  color: ${({ $type, theme }) => 
    $type === 'STATIC' ? theme.colors.cyan : theme.colors.purple};
`;

const SourceTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white70};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
`;

const SourceCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
  margin-left: auto;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  max-height: 180px;
  overflow-y: auto;
`;

const ItemRow = styled.button<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ $selected, theme }) => 
    $selected ? theme.colors.surface3 : 'transparent'};
  border: 1px solid ${({ $selected, theme }) => 
    $selected ? theme.colors.cyan : 'transparent'};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

const ItemIcon = styled.span`
  color: ${({ theme }) => theme.colors.white30};
  flex-shrink: 0;
`;

const ItemName = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white70};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SeverityBadges = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
`;

const SeverityBadge = styled.span<{ $severity: FindingSeverity }>`
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  padding: 2px 4px;
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical + '20';
      case 'HIGH': return theme.colors.severityHigh + '20';
      case 'MEDIUM': return theme.colors.severityMedium + '20';
      case 'LOW': return theme.colors.severityLow + '20';
    }
  }};
  color: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical;
      case 'HIGH': return theme.colors.severityHigh;
      case 'MEDIUM': return theme.colors.severityMedium;
      case 'LOW': return theme.colors.severityLow;
    }
  }};
`;

const EmptyMessage = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white30};
  text-align: center;
  padding: ${({ theme }) => theme.spacing[4]};
`;

// Types
export interface SourceDistributionProps {
  recommendations: Recommendation[];
  selectedSource?: string | null;
  onSourceClick?: (source: string | null, type: 'STATIC' | 'DYNAMIC') => void;
}

interface SourceItem {
  name: string;
  displayName: string;
  type: 'STATIC' | 'DYNAMIC';
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

// Component
export const SourceDistribution: FC<SourceDistributionProps> = ({
  recommendations,
  selectedSource,
  onSourceClick,
}) => {
  // Get pending recommendations
  const pending = recommendations.filter(r => 
    !['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status)
  );

  // Group static by file
  const staticRecs = pending.filter(r => r.source_type === 'STATIC');
  const staticByFile = new Map<string, SourceItem>();
  
  for (const rec of staticRecs) {
    const path = rec.file_path || 'Unknown';
    const existing = staticByFile.get(path);
    
    if (existing) {
      existing.counts.total++;
      if (rec.severity === 'CRITICAL') existing.counts.critical++;
      else if (rec.severity === 'HIGH') existing.counts.high++;
      else if (rec.severity === 'MEDIUM') existing.counts.medium++;
      else if (rec.severity === 'LOW') existing.counts.low++;
    } else {
      staticByFile.set(path, {
        name: path,
        displayName: path.split('/').pop() || path,
        type: 'STATIC',
        counts: {
          critical: rec.severity === 'CRITICAL' ? 1 : 0,
          high: rec.severity === 'HIGH' ? 1 : 0,
          medium: rec.severity === 'MEDIUM' ? 1 : 0,
          low: rec.severity === 'LOW' ? 1 : 0,
          total: 1,
        },
      });
    }
  }

  // Group dynamic by agent/endpoint
  const dynamicRecs = pending.filter(r => r.source_type === 'DYNAMIC');
  const dynamicByAgent = new Map<string, SourceItem>();
  
  for (const rec of dynamicRecs) {
    // Use agent_name or extract from context
    const agentName = rec.file_path || 'Runtime Detection';
    const existing = dynamicByAgent.get(agentName);
    
    if (existing) {
      existing.counts.total++;
      if (rec.severity === 'CRITICAL') existing.counts.critical++;
      else if (rec.severity === 'HIGH') existing.counts.high++;
      else if (rec.severity === 'MEDIUM') existing.counts.medium++;
      else if (rec.severity === 'LOW') existing.counts.low++;
    } else {
      dynamicByAgent.set(agentName, {
        name: agentName,
        displayName: agentName.split('/').pop() || agentName,
        type: 'DYNAMIC',
        counts: {
          critical: rec.severity === 'CRITICAL' ? 1 : 0,
          high: rec.severity === 'HIGH' ? 1 : 0,
          medium: rec.severity === 'MEDIUM' ? 1 : 0,
          low: rec.severity === 'LOW' ? 1 : 0,
          total: 1,
        },
      });
    }
  }

  const staticItems = Array.from(staticByFile.values())
    .sort((a, b) => {
      // Sort by severity priority, then by count
      const aPriority = a.counts.critical * 4 + a.counts.high * 3 + a.counts.medium * 2 + a.counts.low;
      const bPriority = b.counts.critical * 4 + b.counts.high * 3 + b.counts.medium * 2 + b.counts.low;
      return bPriority - aPriority;
    });

  const dynamicItems = Array.from(dynamicByAgent.values())
    .sort((a, b) => {
      const aPriority = a.counts.critical * 4 + a.counts.high * 3 + a.counts.medium * 2 + a.counts.low;
      const bPriority = b.counts.critical * 4 + b.counts.high * 3 + b.counts.medium * 2 + b.counts.low;
      return bPriority - aPriority;
    });

  const handleClick = (item: SourceItem) => {
    if (onSourceClick) {
      onSourceClick(selectedSource === item.name ? null : item.name, item.type);
    }
  };

  return (
    <Container>
      <Title>Issues by Source</Title>
      
      <SourcesGrid>
        {/* Static Analysis */}
        <SourceSection>
          <SourceHeader>
            <SourceIcon $type="STATIC">
              <FileCode size={14} />
            </SourceIcon>
            <SourceTitle>Static Analysis</SourceTitle>
            <SourceCount>{staticRecs.length} issues</SourceCount>
          </SourceHeader>
          
          <ItemsList>
            {staticItems.length > 0 ? (
              staticItems.map(item => (
                <ItemRow
                  key={item.name}
                  $selected={selectedSource === item.name}
                  onClick={() => handleClick(item)}
                  title={item.name}
                >
                  <ItemIcon>
                    <FolderOpen size={12} />
                  </ItemIcon>
                  <ItemName>{item.displayName}</ItemName>
                  <SeverityBadges>
                    {item.counts.critical > 0 && (
                      <SeverityBadge $severity="CRITICAL">{item.counts.critical}</SeverityBadge>
                    )}
                    {item.counts.high > 0 && (
                      <SeverityBadge $severity="HIGH">{item.counts.high}</SeverityBadge>
                    )}
                    {item.counts.medium > 0 && (
                      <SeverityBadge $severity="MEDIUM">{item.counts.medium}</SeverityBadge>
                    )}
                    {item.counts.low > 0 && (
                      <SeverityBadge $severity="LOW">{item.counts.low}</SeverityBadge>
                    )}
                  </SeverityBadges>
                </ItemRow>
              ))
            ) : (
              <EmptyMessage>No static issues</EmptyMessage>
            )}
          </ItemsList>
        </SourceSection>

        {/* Dynamic Analysis */}
        <SourceSection>
          <SourceHeader>
            <SourceIcon $type="DYNAMIC">
              <Activity size={14} />
            </SourceIcon>
            <SourceTitle>Dynamic Analysis</SourceTitle>
            <SourceCount>{dynamicRecs.length} issues</SourceCount>
          </SourceHeader>
          
          <ItemsList>
            {dynamicItems.length > 0 ? (
              dynamicItems.map(item => (
                <ItemRow
                  key={item.name}
                  $selected={selectedSource === item.name}
                  onClick={() => handleClick(item)}
                  title={item.name}
                >
                  <ItemIcon>
                    <Activity size={12} />
                  </ItemIcon>
                  <ItemName>{item.displayName}</ItemName>
                  <SeverityBadges>
                    {item.counts.critical > 0 && (
                      <SeverityBadge $severity="CRITICAL">{item.counts.critical}</SeverityBadge>
                    )}
                    {item.counts.high > 0 && (
                      <SeverityBadge $severity="HIGH">{item.counts.high}</SeverityBadge>
                    )}
                    {item.counts.medium > 0 && (
                      <SeverityBadge $severity="MEDIUM">{item.counts.medium}</SeverityBadge>
                    )}
                    {item.counts.low > 0 && (
                      <SeverityBadge $severity="LOW">{item.counts.low}</SeverityBadge>
                    )}
                  </SeverityBadges>
                </ItemRow>
              ))
            ) : (
              <EmptyMessage>No dynamic issues</EmptyMessage>
            )}
          </ItemsList>
        </SourceSection>
      </SourcesGrid>
    </Container>
  );
};

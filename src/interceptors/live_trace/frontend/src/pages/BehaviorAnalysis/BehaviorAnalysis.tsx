import type { FC } from 'react';

import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Eye,
  Fingerprint,
  GitBranch,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { BehaviorAnalysisIcon } from '@constants/pageIcons';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Button } from '@ui/core/Button';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';

import { usePageMeta } from '../../context';
import { ClusterVisualization } from '@domain/visualization/ClusterVisualization';
import type { ClusterNodeData, ClusterLink } from '@domain/visualization/ClusterVisualization';

import {
  PreviewCard,
  PreviewHeader,
  PreviewTitle,
  PreviewDescription,
  PreviewBody,
  SectionTitle,
  SectionDescription,
  ClusterSection,
  PipelineSection,
  PipelineContainer,
  PipelineSteps,
  PipelineStep,
  PipelineIcon,
  PipelineLabel,
  PipelineDesc,
  PipelineArrow,
  DriftTypesGrid,
  DriftTypeCard,
  DriftTypeHeader,
  DriftTypeIcon,
  DriftTypeTitle,
  DriftTypeList,
  FeatureGrid,
  FeatureItem,
  FeatureIcon,
  FeatureContent,
  FeatureLabel,
  FeatureDescription,
  CTASection,
} from './BehaviorAnalysis.styles';

// Mock data for cluster visualization
const mockClusterNodes: ClusterNodeData[] = [
  // Main cluster (normal behavior)
  { id: 'c1', x: 30, y: 40, size: 'lg', type: 'cluster', metadata: { size: 145, percentage: 72, commonTools: ['get_ticket', 'update_ticket', 'search_kb'] } },
  { id: 'c2', x: 45, y: 55, size: 'md', type: 'cluster', metadata: { size: 38, percentage: 19, commonTools: ['send_notification', 'get_user'] } },
  // Outliers
  { id: 'o1', x: 75, y: 30, size: 'sm', type: 'outlier', sessionId: 'sess_abc123def456', metadata: { severity: 'low', primaryCauses: ['Unusual token count'] } },
  { id: 'o2', x: 80, y: 65, size: 'sm', type: 'outlier', sessionId: 'sess_xyz789ghi012', metadata: { severity: 'medium', primaryCauses: ['New tool pattern'] } },
  // Dangerous
  { id: 'd1', x: 85, y: 45, size: 'md', type: 'dangerous', sessionId: 'sess_danger001', metadata: { severity: 'high', primaryCauses: ['Unexpected external call', 'Token spike'] } },
];

const mockClusterLinks: ClusterLink[] = [
  { source: 'c1', target: 'c2', type: 'cluster-to-cluster', strength: 0.7 },
  { source: 'o1', target: 'c1', type: 'outlier-to-cluster' },
  { source: 'o2', target: 'c2', type: 'outlier-to-cluster' },
  { source: 'd1', target: 'c1', type: 'outlier-to-cluster' },
];

export interface BehaviorAnalysisProps {
  className?: string;
}

export const BehaviorAnalysis: FC<BehaviorAnalysisProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Behavior Analysis' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Behavior Analysis' }],
  });

  const handleLearnMore = () => {
    window.open('https://www.cylestio.com/contact', '_blank');
  };

  return (
    <Page className={className} data-testid="behavior-analysis">
      <PageHeader
        icon={<BehaviorAnalysisIcon size={24} />}
        title="Behavior Analysis"
        badge="PRO"
      />

      <PreviewCard>
        <PreviewHeader>
          <PreviewTitle>When You Code Intent, You Need to Track Runtime Execution</PreviewTitle>
          <PreviewDescription>
            Understand the actual behavior of the code you programmed. See how your agent exercises its autonomy in the real world, track for drift, and catch anomalies as they emerge in production.
          </PreviewDescription>
        </PreviewHeader>

        <PreviewBody>
          {/* Clustering Visualization */}
          <SectionTitle>Session Clustering & Anomaly Detection</SectionTitle>
          <ClusterSection>
            <ClusterVisualization
              nodes={mockClusterNodes}
              links={mockClusterLinks}
              height={220}
              showLegend={true}
            />
          </ClusterSection>

          {/* Trust Pipeline */}
          <PipelineSection>
            <SectionTitle>Agency Trust Pipeline</SectionTitle>
            <SectionDescription>
              Unlike traditional software with agents, you program <b>intent</b> - not behaviour. Behaviour
              emerges <b>on runtime</b>, where changes to environment, tools, MCP servers, or model - or even hallucinations and security breaches - can create unapproved behaviour without changing a single line of code.
            </SectionDescription>
            <PipelineContainer>
              <PipelineSteps>
                <PipelineStep $status="active">
                  <PipelineIcon $status="active">
                    <Eye size={16} />
                  </PipelineIcon>
                  <PipelineLabel>Observe</PipelineLabel>
                  <PipelineDesc>Cluster sessions by decision patterns</PipelineDesc>
                </PipelineStep>

                <PipelineArrow><ChevronRight size={20} /></PipelineArrow>

                <PipelineStep $status="active">
                  <PipelineIcon $status="active">
                    <Fingerprint size={16} />
                  </PipelineIcon>
                  <PipelineLabel>Baseline</PipelineLabel>
                  <PipelineDesc>Snapshot agency with model, tools, prompts</PipelineDesc>
                </PipelineStep>

                <PipelineArrow><ChevronRight size={20} /></PipelineArrow>

                <PipelineStep $status="warning">
                  <PipelineIcon $status="warning">
                    <TrendingUp size={16} />
                  </PipelineIcon>
                  <PipelineLabel>Detect</PipelineLabel>
                  <PipelineDesc>Monitor for drift in decision patterns</PipelineDesc>
                </PipelineStep>

                <PipelineArrow><ChevronRight size={20} /></PipelineArrow>

                <PipelineStep $status="pending">
                  <PipelineIcon $status="pending">
                    <GitBranch size={16} />
                  </PipelineIcon>
                  <PipelineLabel>Classify</PipelineLabel>
                  <PipelineDesc>Valid evolution or agency expansion?</PipelineDesc>
                </PipelineStep>

                <PipelineArrow><ChevronRight size={20} /></PipelineArrow>

                <PipelineStep $status="pending">
                  <PipelineIcon $status="pending">
                    <RefreshCw size={16} />
                  </PipelineIcon>
                  <PipelineLabel>Decide</PipelineLabel>
                  <PipelineDesc>Update baseline or bound autonomy</PipelineDesc>
                </PipelineStep>
              </PipelineSteps>
            </PipelineContainer>
          </PipelineSection>

          {/* Drift Classification */}
          <SectionTitle>Classifying Agency Changes</SectionTitle>
          <DriftTypesGrid>
            <DriftTypeCard $type="valid">
              <DriftTypeHeader>
                <DriftTypeIcon $type="valid">
                  <CheckCircle size={14} />
                </DriftTypeIcon>
                <DriftTypeTitle>Valid Evolution</DriftTypeTitle>
              </DriftTypeHeader>
              <DriftTypeList>
                <li>Autonomy metrics remain within expected range</li>
                <li>Drift correlated with known model version update</li>
                <li>Efficiency improvements (fewer tokens, faster)</li>
                <li>Expanded coverage of existing use cases</li>
              </DriftTypeList>
            </DriftTypeCard>

            <DriftTypeCard $type="review">
              <DriftTypeHeader>
                <DriftTypeIcon $type="review">
                  <AlertTriangle size={14} />
                </DriftTypeIcon>
                <DriftTypeTitle>Requires Review</DriftTypeTitle>
              </DriftTypeHeader>
              <DriftTypeList>
                <li>Unexpected tool usage or new behavior patterns</li>
                <li>New tool categories or capabilities</li>
                <li>Significant token usage increase</li>
                <li>Changed data access patterns</li>
              </DriftTypeList>
            </DriftTypeCard>
          </DriftTypesGrid>

          {/* Features */}
          <FeatureGrid>
            <FeatureItem>
              <FeatureIcon>
                <Users size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Decision Clustering</FeatureLabel>
                <FeatureDescription>Group sessions by how the agent reasons and chooses tools</FeatureDescription>
              </FeatureContent>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon>
                <Fingerprint size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Smart Versioning</FeatureLabel>
                <FeatureDescription>Track model, tools, prompts, and code to detect drift sources</FeatureDescription>
              </FeatureContent>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon>
                <TrendingUp size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Agency Drift</FeatureLabel>
                <FeatureDescription>Detect when decision patterns expand or shift</FeatureDescription>
              </FeatureContent>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon>
                <Shield size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Detect & Decide</FeatureLabel>
                <FeatureDescription>Route changes to review or automatically bound autonomy</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
          </FeatureGrid>

          {/* CTA */}
          <CTASection>
            <Button variant="primary" onClick={handleLearnMore}>
              Learn More
            </Button>
          </CTASection>
        </PreviewBody>
      </PreviewCard>
    </Page>
  );
};

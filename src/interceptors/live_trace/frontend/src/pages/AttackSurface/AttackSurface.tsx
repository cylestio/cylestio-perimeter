import { useState, type FC } from 'react';

import {
  Target,
  Radar,
  AlertTriangle,
  Shield,
  Layers,
  Network,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { AttackSurfaceIcon } from '@constants/pageIcons';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { usePageMeta } from '../../context';
import {
  SurfaceOverview,
  SurfaceCard,
  SurfaceIcon,
  SurfaceContent,
  SurfaceLabel,
  SurfaceValue,
  SurfaceDetail,
  VisualizationArea,
  VisualizationPlaceholder,
  LastScan,
  LastScanInfo,
  ScanButton,
  VectorList,
  VectorItem,
  VectorIcon,
  VectorInfo,
  VectorName,
  VectorDescription,
  VectorRisk,
} from './AttackSurface.styles';

export interface AttackSurfaceProps {
  className?: string;
}

interface AttackVector {
  id: string;
  name: string;
  description: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  category: string;
}

// Mock attack vectors - would come from actual analysis
const mockVectors: AttackVector[] = [
  {
    id: '1',
    name: 'Prompt Injection via User Input',
    description: 'System prompts may be vulnerable to injection through unvalidated user input fields',
    risk: 'critical',
    category: 'Input Validation',
  },
  {
    id: '2',
    name: 'Tool Misuse Potential',
    description: 'Certain tools could be invoked with malicious parameters if not properly constrained',
    risk: 'high',
    category: 'Tool Security',
  },
  {
    id: '3',
    name: 'Sensitive Data Exposure',
    description: 'Agent responses may inadvertently leak sensitive information from context',
    risk: 'medium',
    category: 'Data Protection',
  },
  {
    id: '4',
    name: 'Rate Limiting Gaps',
    description: 'No rate limiting detected on certain API endpoints',
    risk: 'low',
    category: 'Resource Protection',
  },
];

export const AttackSurface: FC<AttackSurfaceProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const [vectors] = useState<AttackVector[]>(mockVectors);
  const [isScanning, setIsScanning] = useState(false);

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Attack Surface' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Attack Surface' }],
  });

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  const getRiskColor = (risk: AttackVector['risk']): 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'purple' => {
    switch (risk) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      default: return 'green';
    }
  };

  const criticalCount = vectors.filter(v => v.risk === 'critical').length;
  const highCount = vectors.filter(v => v.risk === 'high').length;
  const totalExposure = vectors.length;

  return (
    <Page className={className} data-testid="attack-surface">
      <PageHeader
        icon={<AttackSurfaceIcon size={24} />}
        title="Attack Surface"
        description="Live analysis of potential attack vectors and vulnerabilities"
        actions={
          <LastScan>
            <LastScanInfo>
              <Clock size={14} />
              Last scan: 2 minutes ago
            </LastScanInfo>
            <ScanButton onClick={handleScan} disabled={isScanning}>
              <RefreshCw size={14} className={isScanning ? 'spinning' : ''} />
              {isScanning ? 'Scanning...' : 'Rescan'}
            </ScanButton>
          </LastScan>
        }
      />

      {/* Surface Overview */}
      <SurfaceOverview>
        <SurfaceCard $color="red">
          <SurfaceIcon $color="red">
            <AlertTriangle size={20} />
          </SurfaceIcon>
          <SurfaceContent>
            <SurfaceLabel>Critical Vectors</SurfaceLabel>
            <SurfaceValue>{criticalCount}</SurfaceValue>
            <SurfaceDetail>Require immediate attention</SurfaceDetail>
          </SurfaceContent>
        </SurfaceCard>
        <SurfaceCard $color="orange">
          <SurfaceIcon $color="orange">
            <Shield size={20} />
          </SurfaceIcon>
          <SurfaceContent>
            <SurfaceLabel>High Risk Vectors</SurfaceLabel>
            <SurfaceValue>{highCount}</SurfaceValue>
            <SurfaceDetail>Review recommended</SurfaceDetail>
          </SurfaceContent>
        </SurfaceCard>
        <SurfaceCard $color="cyan">
          <SurfaceIcon $color="cyan">
            <Layers size={20} />
          </SurfaceIcon>
          <SurfaceContent>
            <SurfaceLabel>Total Exposure</SurfaceLabel>
            <SurfaceValue>{totalExposure}</SurfaceValue>
            <SurfaceDetail>Attack vectors identified</SurfaceDetail>
          </SurfaceContent>
        </SurfaceCard>
        <SurfaceCard $color="purple">
          <SurfaceIcon $color="purple">
            <Network size={20} />
          </SurfaceIcon>
          <SurfaceContent>
            <SurfaceLabel>Coverage</SurfaceLabel>
            <SurfaceValue>85%</SurfaceValue>
            <SurfaceDetail>Of agent surface scanned</SurfaceDetail>
          </SurfaceContent>
        </SurfaceCard>
      </SurfaceOverview>

      {/* Visualization Area */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Radar size={16} />}>Attack Surface Visualization</Section.Title>
        </Section.Header>
        <Section.Content>
          <VisualizationArea>
            <VisualizationPlaceholder>
              <Radar size={64} />
              <h3>Interactive Attack Surface Map</h3>
              <p>Visual representation of your agent's attack surface with real-time threat indicators</p>
              <Badge variant="info">Coming Soon</Badge>
            </VisualizationPlaceholder>
          </VisualizationArea>
        </Section.Content>
      </Section>

      {/* Attack Vectors List */}
      <Section>
        <Section.Header>
          <Section.Title icon={<AlertTriangle size={16} />}>
            Identified Attack Vectors ({vectors.length})
          </Section.Title>
        </Section.Header>
        <Section.Content>
          <VectorList>
            {vectors.map((vector) => (
              <VectorItem key={vector.id}>
                <VectorIcon $color={getRiskColor(vector.risk)}>
                  <Target size={16} />
                </VectorIcon>
                <VectorInfo>
                  <VectorName>{vector.name}</VectorName>
                  <VectorDescription>{vector.description}</VectorDescription>
                  <Badge variant="medium">{vector.category}</Badge>
                </VectorInfo>
                <VectorRisk $color={getRiskColor(vector.risk)}>
                  {vector.risk.toUpperCase()}
                </VectorRisk>
              </VectorItem>
            ))}
          </VectorList>
        </Section.Content>
      </Section>
    </Page>
  );
};

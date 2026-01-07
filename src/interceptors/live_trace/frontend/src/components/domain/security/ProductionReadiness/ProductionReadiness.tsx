import type { FC } from 'react';

import { Check, X, Loader2, FileText, Wrench, Search, Activity, Rocket, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { ProductionReadinessStatus } from '@api/types/dashboard';

import {
  Container,
  TitleSection,
  TitleIcon,
  Title,
  StagesSection,
  Stage,
  StageIcon,
  StageLabel,
  StageBadge,
  Connector,
  StatusSection,
  StatusIndicator,
  StatusIcon,
  StatusText,
  StatusTitle,
  StatusSubtitle,
  ActionButton,
} from './ProductionReadiness.styles';

export interface AnalysisStageProps {
  status: ProductionReadinessStatus;
  criticalCount: number;
}

export interface ProductionReadinessProps {
  staticAnalysis: AnalysisStageProps;
  dynamicAnalysis: AnalysisStageProps;
  isBlocked: boolean;
  workflowId: string;
}

interface StageDisplayProps {
  label: string;
  icon: React.ReactNode;
  status: ProductionReadinessStatus;
  criticalCount: number;
  onClick?: () => void;
}

const StageDisplay: FC<StageDisplayProps> = ({ label, icon, status, criticalCount, onClick }) => {
  const hasCritical = status === 'completed' && criticalCount > 0;

  const renderStatusIndicator = () => {
    if (status === 'pending') {
      return null;
    }
    if (status === 'running') {
      return <Loader2 size={12} />;
    }
    // completed
    if (criticalCount > 0) {
      return <StageBadge $color="red">{criticalCount}</StageBadge>;
    }
    return <Check size={12} />;
  };

  return (
    <Stage $clickable={!!onClick} onClick={onClick}>
      <StageIcon $status={status} $hasCritical={hasCritical}>
        {icon}
      </StageIcon>
      <StageLabel>{label}</StageLabel>
      {renderStatusIndicator()}
    </Stage>
  );
};

export const ProductionReadiness: FC<ProductionReadinessProps> = ({
  staticAnalysis,
  dynamicAnalysis,
  isBlocked: _backendBlocked, // Keep for reference but compute locally
  workflowId,
}) => {
  const navigate = useNavigate();

  // Compute production readiness status
  // Both analyses must be COMPLETED and have NO critical issues to be production ready
  const staticComplete = staticAnalysis.status === 'completed';
  const dynamicComplete = dynamicAnalysis.status === 'completed';
  const staticGreen = staticComplete && staticAnalysis.criticalCount === 0;
  const dynamicGreen = dynamicComplete && dynamicAnalysis.criticalCount === 0;

  // Check if either is still running or pending
  const isRunning =
    staticAnalysis.status === 'running' || dynamicAnalysis.status === 'running';
  const isPending =
    staticAnalysis.status === 'pending' || dynamicAnalysis.status === 'pending';
  const isInProgress = isRunning || isPending;

  // Production ready only when BOTH are complete AND green
  const isProductionReady = staticGreen && dynamicGreen;

  const handleStaticClick = () => {
    // Navigate to recommendations filtered by static analysis + blocking severities
    navigate(`/agent-workflow/${workflowId}/recommendations?tab=by-severity&source_type=STATIC&severity=CRITICAL,HIGH`);
  };

  const handleDynamicClick = () => {
    // Navigate to recommendations filtered by dynamic analysis + blocking severities
    navigate(`/agent-workflow/${workflowId}/recommendations?tab=by-severity&source_type=DYNAMIC&severity=CRITICAL,HIGH`);
  };

  const handleActionClick = () => {
    if (isProductionReady) {
      navigate(`/agent-workflow/${workflowId}/reports`);
    } else {
      // "Fix Issues" shows all blocking (critical + high) issues
      navigate(`/agent-workflow/${workflowId}/recommendations?tab=by-severity&severity=CRITICAL,HIGH`);
    }
  };

  // Connector is active only when static is complete and green
  const connectorActive = staticGreen;

  // Determine status variant for styling
  const statusVariant = isInProgress ? 'pending' : isProductionReady ? 'ready' : 'blocked';

  // Get status text and details
  const getStatusInfo = () => {
    // Running state - at least one analysis is actively running
    if (isRunning) {
      return {
        title: 'Analysis In Progress',
        subtitle: 'Running security scans...',
      };
    }
    // Pending state - nothing running but not all complete
    if (isPending) {
      return {
        title: 'Analysis Required',
        subtitle: 'Complete all scans for production readiness',
      };
    }
    if (isProductionReady) {
      return {
        title: 'Production Ready',
        subtitle: 'All checks passed',
      };
    }
    const totalBlocking = staticAnalysis.criticalCount + dynamicAnalysis.criticalCount;
    return {
      title: 'Attention Required',
      subtitle: totalBlocking > 0 ? `${totalBlocking} blocking issues` : 'Analysis incomplete',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Container $variant={statusVariant}>
      <TitleSection>
        <TitleIcon>
          <Rocket size={16} />
        </TitleIcon>
        <Title>Production Readiness</Title>
      </TitleSection>
      <StagesSection>
        <StageDisplay
          label="Static Analysis"
          icon={<Search size={12} />}
          status={staticAnalysis.status}
          criticalCount={staticAnalysis.criticalCount}
          onClick={handleStaticClick}
        />
        <Connector $active={connectorActive} />
        <StageDisplay
          label="Dynamic Analysis"
          icon={<Activity size={12} />}
          status={dynamicAnalysis.status}
          criticalCount={dynamicAnalysis.criticalCount}
          onClick={handleDynamicClick}
        />
      </StagesSection>

      <StatusSection>
        <StatusIndicator $variant={statusVariant}>
          <StatusIcon $variant={statusVariant} $spinning={isRunning}>
            {isRunning ? (
              <Loader2 size={16} />
            ) : isPending ? (
              <Circle size={16} />
            ) : isProductionReady ? (
              <Check size={16} />
            ) : (
              <X size={16} />
            )}
          </StatusIcon>
          <StatusText>
            <StatusTitle $variant={statusVariant}>{statusInfo.title}</StatusTitle>
            <StatusSubtitle>{statusInfo.subtitle}</StatusSubtitle>
          </StatusText>
        </StatusIndicator>

        {!isInProgress && (
          <ActionButton
            $variant={isProductionReady ? 'success' : 'danger'}
            onClick={handleActionClick}
          >
            {isProductionReady ? (
              <>
                <FileText size={14} />
                Generate Report
              </>
            ) : (
              <>
                <Wrench size={14} />
                Fix Issues
              </>
            )}
          </ActionButton>
        )}
      </StatusSection>
    </Container>
  );
};

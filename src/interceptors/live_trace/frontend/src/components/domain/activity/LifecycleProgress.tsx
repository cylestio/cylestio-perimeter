import type { FC, ReactNode } from 'react';
import {
  ProgressContainer,
  StageContainer,
  StageIcon,
  StageLabel,
  StageStat,
  Connector,
} from './LifecycleProgress.styles';

// Types - matches SecurityCheckStatus from sidebar for consistency
export type StageStatus = 'inactive' | 'running' | 'ok' | 'warning' | 'critical';

export interface LifecycleStage {
  id: string;
  label: string;
  icon: ReactNode;
  status: StageStatus;
  stat?: string;
}

export interface LifecycleProgressProps {
  stages: LifecycleStage[];
}

// Component
export const LifecycleProgress: FC<LifecycleProgressProps> = ({ stages }) => {
  return (
    <ProgressContainer>
      {stages.map((stage, index) => (
        <div key={stage.id} style={{ display: 'contents' }}>
          <StageContainer>
            <StageIcon $status={stage.status}>{stage.icon}</StageIcon>
            <StageLabel $status={stage.status}>{stage.label}</StageLabel>
            {stage.stat && <StageStat $status={stage.status}>{stage.stat}</StageStat>}
          </StageContainer>
          {index < stages.length - 1 && (
            <Connector $status={stage.status} />
          )}
        </div>
      ))}
    </ProgressContainer>
  );
};

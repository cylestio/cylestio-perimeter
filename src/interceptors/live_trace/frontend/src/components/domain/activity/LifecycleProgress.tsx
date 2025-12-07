import type { FC, ReactNode } from 'react';
import {
  ProgressContainer,
  StageContainer,
  StageIcon,
  StageLabel,
  StageStat,
  Connector,
} from './LifecycleProgress.styles';

// Types
export type StageStatus = 'pending' | 'active' | 'completed';

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
            <Connector $completed={stage.status === 'completed'} />
          )}
        </div>
      ))}
    </ProgressContainer>
  );
};

import type { FC } from 'react';

import { Lightbulb } from 'lucide-react';

import { OrbLoader } from '@ui/feedback/OrbLoader';
import { ProgressBar } from '@ui/feedback/ProgressBar';

import {
  Container,
  HeaderSection,
  HeaderText,
  Title,
  Description,
  ProgressRow,
  ProgressBarWrapper,
  ProgressCount,
  ProgressHint,
  LoaderSection,
} from './GatheringData.styles';

export interface GatheringDataProps {
  currentSessions: number;
  minSessionsRequired: number;
}

export const GatheringData: FC<GatheringDataProps> = ({
  currentSessions,
  minSessionsRequired,
}) => {
  const progress = currentSessions / (minSessionsRequired || 5);

  return (
    <Container>
      <HeaderSection>
        <HeaderText>
          <Title>Analyzing Agent Behavior</Title>
          <Description>
            AI agents are non-deterministic - they can behave differently even with identical
            inputs. We analyze real sessions to detect security risks and behavioral patterns.
          </Description>
          <ProgressRow>
            <ProgressBarWrapper>
              <ProgressBar value={progress} variant="default" />
            </ProgressBarWrapper>
            <ProgressCount>
              {currentSessions} / {minSessionsRequired}
            </ProgressCount>
          </ProgressRow>
          <ProgressHint>
            <Lightbulb size={14} />
            <span>More sessions improve accuracy</span>
          </ProgressHint>
        </HeaderText>
        <LoaderSection>
          <OrbLoader size="sm" />
        </LoaderSection>
      </HeaderSection>


    </Container>
  );
};

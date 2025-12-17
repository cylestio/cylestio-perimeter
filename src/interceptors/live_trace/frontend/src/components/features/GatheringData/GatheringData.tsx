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
  /** Current number of sessions collected */
  currentSessions: number;
  /** Minimum sessions required for analysis */
  minSessionsRequired: number;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Hint text shown below progress bar */
  hint?: string;
}

const DEFAULT_TITLE = 'Analyzing Agent Behavior';
const DEFAULT_DESCRIPTION =
  'AI agents are non-deterministic - they can behave differently even with identical inputs. We analyze real sessions to detect security risks and behavioral patterns.';
const DEFAULT_HINT = 'More sessions improve accuracy';

export const GatheringData: FC<GatheringDataProps> = ({
  currentSessions,
  minSessionsRequired,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  hint = DEFAULT_HINT,
}) => {
  // ProgressBar expects 0-100, so multiply by 100
  const progress = (currentSessions / (minSessionsRequired || 5)) * 100;

  return (
    <Container>
      <HeaderSection>
        <HeaderText>
          <Title>{title}</Title>
          <Description>{description}</Description>
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
            <span>{hint}</span>
          </ProgressHint>
        </HeaderText>
        <LoaderSection>
          <OrbLoader size="sm" />
        </LoaderSection>
      </HeaderSection>
    </Container>
  );
};

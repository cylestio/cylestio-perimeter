import type { FC, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  ChainContainer,
  ChainStep,
  ChainArrow,
  BadgeContainer,
} from './ToolChain.styles';

// Types
export interface ToolChainStep {
  name: string;
  risky?: boolean;
}

export interface ToolChainProps {
  steps: ToolChainStep[];
  dangerous?: boolean;
  badge?: ReactNode;
}

// Component
export const ToolChain: FC<ToolChainProps> = ({
  steps,
  dangerous = false,
  badge,
}) => {
  return (
    <ChainContainer $dangerous={dangerous}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {steps.map((step, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChainStep $risky={step.risky}>{step.name}</ChainStep>
            {index < steps.length - 1 && (
              <ChainArrow>
                <ArrowRight size={14} />
              </ChainArrow>
            )}
          </div>
        ))}
      </div>
      {badge && <BadgeContainer>{badge}</BadgeContainer>}
    </ChainContainer>
  );
};

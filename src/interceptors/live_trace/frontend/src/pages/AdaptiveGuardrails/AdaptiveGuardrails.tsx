import type { FC } from 'react';

import {
  Brain,
  Coins,
  GitBranch,
  Lock,
  Shield,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { AdaptiveAutonomyIcon } from '@constants/pageIcons';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Button } from '@ui/core/Button';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';

import { usePageMeta } from '../../context';
import {
  PreviewCard,
  PreviewHeader,
  PreviewTitle,
  PreviewDescription,
  PreviewBody,
  PolicyGridTitle,
  PolicyGrid,
  PolicySection,
  PolicySectionTitle,
  PolicySectionIcon,
  PolicyContent,
  PolicyCode,
  FeatureGrid,
  FeatureItem,
  FeatureIcon,
  FeatureContent,
  FeatureLabel,
  FeatureDescription,
  CTASection,
} from './AdaptiveGuardrails.styles';

export interface AdaptiveGuardrailsProps {
  className?: string;
}

export const AdaptiveGuardrails: FC<AdaptiveGuardrailsProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Adaptive Autonomy' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Adaptive Autonomy' }],
  });

  const handleLearnMore = () => {
    window.open('https://www.cylestio.com/contact', '_blank');
  };

  return (
    <Page className={className} data-testid="adaptive-autonomy">
      <PageHeader
        icon={<AdaptiveAutonomyIcon size={24} />}
        title="Adaptive Autonomy"
        badge="PRO"
      />

      <PreviewCard>
        <PreviewHeader>
          <PreviewTitle>Bound What Executes Unattended - The Execution Envelope</PreviewTitle>
          <PreviewDescription>
            Autonomy must be restrained even within permissions. Using Behaviour Analysis, we auto-generate
            constraints that prevent "allowed but wrong" from causing harm.
          </PreviewDescription>
        </PreviewHeader>

        <PreviewBody>
          {/* Policy Examples */}
          <PolicyGridTitle>Example: Loan Decisioning Agent</PolicyGridTitle>
          <PolicyGrid>
            <PolicySection>
              <PolicySectionTitle>
                <PolicySectionIcon><Lock size={12} /></PolicySectionIcon>
                Tool Allowlist
              </PolicySectionTitle>
              <PolicyContent>
                <PolicyCode>{`allowed:
  - get_application
  - get_credit_score
  - calculate_rate
  - approve_loan
  - deny_loan`}</PolicyCode>
              </PolicyContent>
            </PolicySection>

            <PolicySection $tall>
              <PolicySectionTitle>
                <PolicySectionIcon><Shield size={12} /></PolicySectionIcon>
                Input Validation
              </PolicySectionTitle>
              <PolicyContent>
                <PolicyCode>{`get_application:
  application_id: /^APP-[0-9]{8}$/

get_credit_score:
  customer_id: == get_application.customer_id

calculate_rate:
  score: range [300, 850]
  amount: range [1000, 50000]

approve_loan:
  customer_id: == get_application.customer_id
  amount: range [1000, 50000]
  rate: range [3.5, 24.9]

deny_loan:
  customer_id: == get_application.customer_id
  reason: enum [credit, income, fraud]`}</PolicyCode>
              </PolicyContent>
            </PolicySection>

            <PolicySection $tall>
              <PolicySectionTitle>
                <PolicySectionIcon><GitBranch size={12} /></PolicySectionIcon>
                Call Sequences
              </PolicySectionTitle>
              <PolicyContent>
                <PolicyCode>{`entry_point:
  get_application

allowed:
  get_application → get_credit_score
  get_credit_score → calculate_rate
  calculate_rate → approve_loan
  calculate_rate → deny_loan

blocked:
  approve_loan → *
  deny_loan → *
  * → get_application

max_depth: 4
terminal: [approve_loan, deny_loan]`}</PolicyCode>
              </PolicyContent>
            </PolicySection>

            <PolicySection>
              <PolicySectionTitle>
                <PolicySectionIcon><Coins size={12} /></PolicySectionIcon>
                Resource Limits
              </PolicySectionTitle>
              <PolicyContent>
                <PolicyCode>{`max_tokens: 5000 per session
max_tool_calls: 10 per session
max_session_time: 60s
max_retries: 2 per tool`}</PolicyCode>
              </PolicyContent>
            </PolicySection>
          </PolicyGrid>

          {/* Features */}
          <FeatureGrid>
            <FeatureItem>
              <FeatureIcon>
                <Target size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Execution Envelope</FeatureLabel>
                <FeatureDescription>Define action depth, classes, and verification thresholds</FeatureDescription>
              </FeatureContent>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon>
                <Sparkles size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Blast Radius Control</FeatureLabel>
                <FeatureDescription>Bound what can execute unattended vs. what requires approval</FeatureDescription>
              </FeatureContent>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon>
                <Zap size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Hands-Free Generation</FeatureLabel>
                <FeatureDescription>Auto-generated from observed patterns—no manual config</FeatureDescription>
              </FeatureContent>
            </FeatureItem>

            <FeatureItem>
              <FeatureIcon>
                <Brain size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Adaptive Tightening</FeatureLabel>
                <FeatureDescription>Constraints calibrated to patterns, tightening as confidence grows</FeatureDescription>
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

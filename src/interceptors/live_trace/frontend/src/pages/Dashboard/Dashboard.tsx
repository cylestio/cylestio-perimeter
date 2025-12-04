import type { FC } from 'react';
import { Shield, Bug, Zap, Activity, Search, FileSearch, Link, Wrench, CheckCircle } from 'lucide-react';
import { Card } from '@ui/core/Card';
import { PageHeader } from '@ui/layout/PageHeader';
import { usePageMeta } from '../../context';
import { StatCard } from '@domain/metrics/StatCard';
import { RiskScore } from '@domain/metrics/RiskScore';
import { LifecycleProgress, type LifecycleStage } from '@domain/activity/LifecycleProgress';
import { ActivityFeed } from '@domain/activity/ActivityFeed';
import { Button } from '@ui/core/Button';
import { mockStats, mockLifecycleStages } from '@api/mocks/stats';
import { mockActivity } from '@api/mocks/activity';
import {
  StatsGrid,
  TwoColumnGrid,
  Section,
  SectionHeader,
  SectionTitle,
  RiskHero,
  LifecycleCard,
} from './Dashboard.styles';

// Map lifecycle icons
const lifecycleIcons = {
  discovery: <Search size={18} />,
  analysis: <FileSearch size={18} />,
  correlation: <Link size={18} />,
  remediation: <Wrench size={18} />,
  verification: <CheckCircle size={18} />,
};

// Create lifecycle stages with icons
const lifecycleStages: LifecycleStage[] = mockLifecycleStages.map(stage => ({
  ...stage,
  icon: lifecycleIcons[stage.id as keyof typeof lifecycleIcons],
}));

export const Dashboard: FC = () => {
  usePageMeta({
    breadcrumbs: [{ label: 'Dashboard' }],
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of agent security monitoring and findings"
      />

      <StatsGrid>
        <StatCard
          label="Risk Score"
          value={mockStats.riskScore}
          icon={<Shield size={20} />}
          iconColor="orange"
          detail={`${mockStats.riskChange > 0 ? '+' : ''}${mockStats.riskChange} from last week`}
        />
        <StatCard
          label="Open Findings"
          value={mockStats.openFindings}
          icon={<Bug size={20} />}
          iconColor="red"
          valueColor="red"
          detail={`${mockStats.criticalCount} critical, ${mockStats.highCount} high`}
        />
        <StatCard
          label="Auto-Fixed"
          value={mockStats.autoFixed}
          icon={<Zap size={20} />}
          iconColor="green"
          valueColor="green"
          detail={`+${mockStats.todayFixed} today`}
        />
        <StatCard
          label="Sessions"
          value={mockStats.sessions}
          icon={<Activity size={20} />}
          iconColor="cyan"
          detail={`${mockStats.liveSessions} active now`}
        />
      </StatsGrid>

      <TwoColumnGrid>
        <Card>
          <Card.Header title="Risk Assessment" />
          <Card.Content>
            <RiskHero>
              <RiskScore
                value={mockStats.riskScore}
                variant="hero"
                size="lg"
              />
            </RiskHero>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header title="Security Lifecycle" />
          <Card.Content>
            <LifecycleCard>
              <LifecycleProgress stages={lifecycleStages} />
            </LifecycleCard>
          </Card.Content>
        </Card>
      </TwoColumnGrid>

      <Section>
        <SectionHeader>
          <SectionTitle>Recent Activity</SectionTitle>
          <Button variant="ghost" size="sm">View All</Button>
        </SectionHeader>
        <Card>
          <Card.Content>
            <ActivityFeed items={mockActivity} />
          </Card.Content>
        </Card>
      </Section>
    </>
  );
};

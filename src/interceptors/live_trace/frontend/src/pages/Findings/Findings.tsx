import type { FC } from 'react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@ui/core/Button';
import { Badge } from '@ui/core/Badge';
import { PageHeader } from '@ui/layout/PageHeader';
import { usePageMeta } from '../../context';
import { Tabs } from '@ui/navigation/Tabs';
import { Table } from '@ui/data-display/Table';
import { mockFindings, type Finding, type Severity } from '@api/mocks/findings';
import {
  TabsWrapper,
  TableWrapper,
  SeverityCell,
  LocationCell,
  StatusCell,
  TitleCell,
} from './Findings.styles';

// Map severity to Badge variants
const severityVariants: Record<Severity, 'critical' | 'high' | 'medium' | 'low'> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

const tabs = [
  { id: 'all', label: 'All', count: mockFindings.length },
  { id: 'critical', label: 'Critical', count: mockFindings.filter(f => f.severity === 'critical').length },
  { id: 'high', label: 'High', count: mockFindings.filter(f => f.severity === 'high').length },
  { id: 'medium', label: 'Medium', count: mockFindings.filter(f => f.severity === 'medium').length },
  { id: 'low', label: 'Low', count: mockFindings.filter(f => f.severity === 'low').length },
];

const columns = [
  {
    key: 'severity' as const,
    header: 'Severity',
    width: '120px',
    render: (finding: Finding) => (
      <SeverityCell>
        <Badge variant={severityVariants[finding.severity]} size="sm">
          {finding.severity}
        </Badge>
      </SeverityCell>
    ),
  },
  {
    key: 'title' as const,
    header: 'Title',
    sortable: true,
    render: (finding: Finding) => (
      <TitleCell>{finding.title}</TitleCell>
    ),
  },
  {
    key: 'location' as const,
    header: 'Location',
    width: '160px',
    render: (finding: Finding) => (
      <LocationCell>
        {finding.location.file}:{finding.location.line}
      </LocationCell>
    ),
  },
  {
    key: 'source' as const,
    header: 'Source',
    width: '100px',
    render: (finding: Finding) => (
      <Badge variant="info" size="sm">
        {finding.source}
      </Badge>
    ),
  },
  {
    key: 'status' as const,
    header: 'Status',
    width: '100px',
    render: (finding: Finding) => (
      <StatusCell>
        <Badge
          variant={finding.status === 'fixed' ? 'success' : finding.status === 'ignored' ? 'low' : 'info'}
          size="sm"
        >
          {finding.status}
        </Badge>
      </StatusCell>
    ),
  },
];

export const Findings: FC = () => {
  usePageMeta({
    breadcrumbs: [{ label: 'Findings' }],
  });

  const [activeTab, setActiveTab] = useState('all');

  const filteredFindings = activeTab === 'all'
    ? mockFindings
    : mockFindings.filter(f => f.severity === activeTab);

  return (
    <>
      <PageHeader
        title="Findings"
        description="Security vulnerabilities and issues detected by agents"
        actions={
          <Button icon={<Plus size={16} />}>
            New Scan
          </Button>
        }
      />

      <TabsWrapper>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </TabsWrapper>

      <TableWrapper>
        <Table
          data={filteredFindings}
          columns={columns}
          keyExtractor={(row) => row.id}
        />
      </TableWrapper>
    </>
  );
};

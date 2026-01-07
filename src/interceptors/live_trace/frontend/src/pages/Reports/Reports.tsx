// 1. React
import { useState, useEffect, useCallback, useMemo, type FC } from 'react';

// 2. External
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Clock, FileText, Eye, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';

// 3. Internal
import { ReportsIcon } from '@constants/pageIcons';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import {
  fetchComplianceReport,
  fetchReportHistory,
  deleteReport,
  type ReportListItem,
  type ReportType,
} from '@api/endpoints/agentWorkflow';
import { fetchProductionReadiness } from '@api/endpoints/dashboard';

// 4. UI
import { Badge } from '@ui/core/Badge';
import { TimeAgo } from '@ui/core/TimeAgo';
import { Table, type Column } from '@ui/data-display/Table';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Section } from '@ui/layout/Section';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Tooltip } from '@ui/overlays/Tooltip';

// 6. Features/Pages
import { usePageMeta } from '../../context';

// 7. Relative
import {
  HeroSection,
  HeroTitle,
  HeroDescription,
  GenerateButton,
  ErrorMessage,
  StatusIcon,
  ActionsCell,
  IconButton,
} from './Reports.styles';

export interface ReportsProps {
  className?: string;
}

export const Reports: FC<ReportsProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const navigate = useNavigate();

  const [reportHistory, setReportHistory] = useState<ReportListItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalysisData, setHasAnalysisData] = useState(false);

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Reports' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Reports' }],
  });

  const loadHistory = useCallback(async () => {
    if (!agentWorkflowId) return;
    setHistoryLoading(true);
    try {
      const data = await fetchReportHistory(agentWorkflowId);
      setReportHistory(data.reports);
    } catch (err) {
      console.error('Failed to load report history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [agentWorkflowId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Check if there's analysis data to enable the generate button
  useEffect(() => {
    const checkAnalysisData = async () => {
      if (!agentWorkflowId) return;
      try {
        const data = await fetchProductionReadiness(agentWorkflowId);
        const hasStatic = data.static_analysis?.status === 'completed';
        const hasDynamic = data.dynamic_analysis?.status === 'completed';
        setHasAnalysisData(hasStatic || hasDynamic);
      } catch (err) {
        console.error('Failed to check analysis data:', err);
        setHasAnalysisData(false);
      }
    };
    checkAnalysisData();
  }, [agentWorkflowId]);

  const handleGenerateReport = async (reportType: ReportType) => {
    if (!agentWorkflowId) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await fetchComplianceReport(agentWorkflowId, reportType, true);
      if (data.report_id) {
        navigate(`/agent-workflow/${agentWorkflowId}/report/${data.report_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setGenerating(false);
    }
  };

  const handleViewReport = useCallback(
    (reportId: string) => {
      navigate(`/agent-workflow/${agentWorkflowId}/report/${reportId}`);
    },
    [agentWorkflowId, navigate]
  );

  const handleDeleteReport = useCallback(
    async (e: React.MouseEvent, reportId: string) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to delete this report?')) return;
      try {
        await deleteReport(reportId);
        loadHistory();
      } catch (err) {
        console.error('Failed to delete report:', err);
      }
    },
    [loadHistory]
  );

  const columns: Column<ReportListItem>[] = useMemo(
    () => [
      {
        key: 'gate_status',
        header: '',
        width: '48px',
        render: (row) => (
          <StatusIcon $status={row.gate_status === 'BLOCKED' ? 'blocked' : 'open'}>
            {row.gate_status === 'BLOCKED' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          </StatusIcon>
        ),
      },
      {
        key: 'generated_at',
        header: 'Created At',
        width: '140px',
        render: (row) => <TimeAgo timestamp={row.generated_at} />,
        sortable: true,
      },
      {
        key: 'report_name',
        header: 'Report',
        render: (row) => row.report_name,
        sortable: true,
      },
      {
        key: 'status',
        header: 'Status',
        width: '160px',
        render: (row) => (
          <Badge variant={row.gate_status === 'BLOCKED' ? 'high' : 'success'} size="sm">
            {row.gate_status === 'BLOCKED' ? 'Attention Required' : 'Production Ready'}
          </Badge>
        ),
      },
      {
        key: 'risk_score',
        header: 'Risk Score',
        width: '100px',
        align: 'center',
        render: (row) => row.risk_score,
        sortable: true,
      },
      {
        key: 'critical_count',
        header: 'Critical',
        width: '80px',
        align: 'center',
        render: (row) =>
          row.critical_count > 0 ? (
            <Badge variant="critical" size="sm">
              {row.critical_count}
            </Badge>
          ) : (
            <span style={{ color: 'var(--color-white-30)' }}>0</span>
          ),
        sortable: true,
      },
      {
        key: 'high_count',
        header: 'High',
        width: '80px',
        align: 'center',
        render: (row) =>
          row.high_count > 0 ? (
            <Badge variant="high" size="sm">
              {row.high_count}
            </Badge>
          ) : (
            <span style={{ color: 'var(--color-white-30)' }}>0</span>
          ),
        sortable: true,
      },
      {
        key: 'medium_count',
        header: 'Medium',
        width: '80px',
        align: 'center',
        render: (row) =>
          row.medium_count > 0 ? (
            <Badge variant="medium" size="sm">
              {row.medium_count}
            </Badge>
          ) : (
            <span style={{ color: 'var(--color-white-30)' }}>0</span>
          ),
        sortable: true,
      },
      {
        key: 'recommendations_count',
        header: 'Recommendations',
        width: '140px',
        align: 'center',
        render: (row) => row.recommendations_count,
        sortable: true,
      },
      {
        key: 'actions',
        header: '',
        width: '80px',
        align: 'right',
        render: (row) => (
          <ActionsCell>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleViewReport(row.report_id);
              }}
              title="View"
            >
              <Eye size={16} />
            </IconButton>
            <IconButton className="danger" onClick={(e) => handleDeleteReport(e, row.report_id)} title="Delete">
              <Trash2 size={16} />
            </IconButton>
          </ActionsCell>
        ),
      },
    ],
    [handleDeleteReport, handleViewReport]
  );

  return (
    <Page className={className} data-testid="reports">
      <PageHeader
        icon={<ReportsIcon size={24} />}
        title="Reports"
        description="Generate and view security assessment reports"
      />

      <HeroSection>
        <Shield size={32} />
        <HeroTitle>Generate Security Assessment Report</HeroTitle>
        <HeroDescription>
          Comprehensive CISO report with static/dynamic analysis, OWASP LLM Top 10 coverage,
          SOC2 compliance mapping, and actionable remediation plans.
        </HeroDescription>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!hasAnalysisData ? (
          <Tooltip content="Run at least one static or dynamic analysis for better results">
            <GenerateButton disabled>Generate Report</GenerateButton>
          </Tooltip>
        ) : (
          <GenerateButton
            onClick={() => handleGenerateReport('security_assessment')}
            disabled={generating}
          >
            {generating && <Loader2 size={16} className="animate-spin" />}
            Generate Report
          </GenerateButton>
        )}
      </HeroSection>

      <Section>
        <Section.Header>
          <Section.Title icon={<Clock size={16} />}>Report History</Section.Title>
        </Section.Header>
        <Section.Content noPadding>
          <Table
            columns={columns}
            data={reportHistory}
            loading={historyLoading}
            onRowClick={(row) => handleViewReport(row.report_id)}
            keyExtractor={(row) => row.report_id}
            emptyState={
              <EmptyState
                icon={<FileText size={40} />}
                title="No previous reports"
                description="Generate a report above to see it saved here for future reference."
              />
            }
          />
        </Section.Content>
      </Section>
    </Page>
  );
};

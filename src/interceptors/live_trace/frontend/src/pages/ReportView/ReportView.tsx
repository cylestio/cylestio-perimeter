// 1. React
import { useState, useEffect, type FC } from 'react';

// 2. External
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

// 3. Internal
import { ReportsIcon } from '@constants/pageIcons';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import {
  fetchStoredReport,
  type ComplianceReportResponse,
  type ReportType,
} from '@api/endpoints/agentWorkflow';

// 4. UI
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';

// 5. Domain
import { ReportDisplay } from '@domain/reports';

// 6. Features/Pages
import { usePageMeta } from '../../context';

// 7. Relative
import { LoadingContainer, ErrorContainer, BackButton } from './ReportView.styles';

export const ReportView: FC = () => {
  const { agentWorkflowId, reportId } = useParams<{ agentWorkflowId: string; reportId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ComplianceReportResponse | null>(null);
  const [reportType, setReportType] = useState<ReportType>('security_assessment');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    breadcrumbs: buildAgentWorkflowBreadcrumbs(
      agentWorkflowId || '',
      { label: 'Reports', href: `/agent-workflow/${agentWorkflowId}/reports` },
      { label: reportId?.substring(0, 8) + '...' || '' }
    ),
  });

  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) return;
      setLoading(true);
      try {
        const stored = await fetchStoredReport(reportId);
        setReport(stored.report_data);
        setReportType(stored.report_type);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [reportId]);

  const handleBack = () => navigate(`/agent-workflow/${agentWorkflowId}/reports`);

  if (loading) {
    return (
      <Page data-testid="report-view">
        <PageHeader
          icon={<ReportsIcon size={24} />}
          title="Security Assessment Report"
          description="Loading report..."
        />
        <LoadingContainer>
          <Loader2 size={32} className="animate-spin" />
        </LoadingContainer>
      </Page>
    );
  }

  if (error || !report) {
    return (
      <Page data-testid="report-view">
        <PageHeader
          icon={<ReportsIcon size={24} />}
          title="Security Assessment Report"
          description="Error loading report"
          actions={
            <BackButton onClick={handleBack}>
              <ArrowLeft size={14} /> Back to Reports
            </BackButton>
          }
        />
        <ErrorContainer>{error || 'Report not found'}</ErrorContainer>
      </Page>
    );
  }

  return (
    <Page data-testid="report-view">
      <PageHeader
        icon={<ReportsIcon size={24} />}
        title="Security Assessment Report"
        description={`Report for ${agentWorkflowId}`}
        actions={
          <BackButton onClick={handleBack}>
            <ArrowLeft size={14} /> Back to Reports
          </BackButton>
        }
      />
      <ReportDisplay
        report={report}
        workflowId={agentWorkflowId || ''}
        reportType={reportType}
      />
    </Page>
  );
};

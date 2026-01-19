// 1. React
import { useState, useEffect, type FC } from 'react';

// 2. External
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronDown, FileText, Code } from 'lucide-react';

// 3. Internal
import { ReportsIcon } from '@constants/pageIcons';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import {
  fetchStoredReport,
  type ComplianceReportResponse,
  type ReportType,
} from '@api/endpoints/agentWorkflow';
import {
  generateMarkdownReport,
  generateHTMLReport,
  generateFullMarkdownReport,
  generateFullHTMLReport,
} from '@utils/reportExport';

// 4. UI
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Button } from '@ui/core/Button';
import { Dropdown, type DropdownItemData } from '@ui/overlays/Dropdown';

// 5. Domain
import { ReportDisplay } from '@domain/reports';

// 6. Features/Pages
import { usePageMeta } from '../../context';

// 7. Relative
import { LoadingContainer, ErrorContainer, BackLink } from './ReportView.styles';

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

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSummaryMarkdown = () => {
    if (!report) return;
    const md = generateMarkdownReport(report, agentWorkflowId || '');
    downloadFile(md, `security-summary-${agentWorkflowId}-${new Date().toISOString().split('T')[0]}.md`, 'text/markdown');
  };

  const handleExportSummaryHTML = () => {
    if (!report) return;
    const html = generateHTMLReport(report, agentWorkflowId || '');
    downloadFile(html, `security-summary-${agentWorkflowId}-${new Date().toISOString().split('T')[0]}.html`, 'text/html');
  };

  const handleExportFullMarkdown = () => {
    if (!report) return;
    const md = generateFullMarkdownReport(report, agentWorkflowId || '');
    downloadFile(md, `security-full-report-${agentWorkflowId}-${new Date().toISOString().split('T')[0]}.md`, 'text/markdown');
  };

  const handleExportFullHTML = () => {
    if (!report) return;
    const html = generateFullHTMLReport(report, agentWorkflowId || '');
    downloadFile(html, `security-full-report-${agentWorkflowId}-${new Date().toISOString().split('T')[0]}.html`, 'text/html');
  };

  const summaryExportItems: DropdownItemData[] = [
    { id: 'summary-md', label: 'Markdown', icon: <Code size={14} />, onClick: handleExportSummaryMarkdown },
    { id: 'summary-html', label: 'HTML', icon: <FileText size={14} />, onClick: handleExportSummaryHTML },
  ];

  const fullReportExportItems: DropdownItemData[] = [
    { id: 'full-md', label: 'Markdown', icon: <Code size={14} />, onClick: handleExportFullMarkdown },
    { id: 'full-html', label: 'HTML', icon: <FileText size={14} />, onClick: handleExportFullHTML },
  ];

  if (loading) {
    return (
      <Page data-testid="report-view">
        <BackLink onClick={handleBack}>
          <ArrowLeft size={14} /> Reports
        </BackLink>
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
        <BackLink onClick={handleBack}>
          <ArrowLeft size={14} /> Reports
        </BackLink>
        <PageHeader
          icon={<ReportsIcon size={24} />}
          title="Security Assessment Report"
          description="Error loading report"
        />
        <ErrorContainer>{error || 'Report not found'}</ErrorContainer>
      </Page>
    );
  }

  return (
    <Page data-testid="report-view">
      <BackLink onClick={handleBack}>
        <ArrowLeft size={14} /> Reports
      </BackLink>
      <PageHeader
        icon={<ReportsIcon size={24} />}
        title="Security Assessment Report"
        description={`Report for ${agentWorkflowId}`}
        actions={
          <>
            <Dropdown
              trigger={
                <Button variant="primary" size="sm">
                  Export Summary <ChevronDown size={14} />
                </Button>
              }
              items={summaryExportItems}
              align="right"
            />
            <Dropdown
              trigger={
                <Button variant="secondary" size="sm">
                  Export Full Report <ChevronDown size={14} />
                </Button>
              }
              items={fullReportExportItems}
              align="right"
            />
          </>
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

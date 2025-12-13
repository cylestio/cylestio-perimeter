import { useState, type FC } from 'react';

import {
  Download,
  Calendar,
  Users,
  Shield,
  Briefcase,
  Plus,
  Eye,
  FileText,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { ReportsIcon } from '@constants/pageIcons';
import { buildWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';
import { Button } from '@ui/core/Button';

import { usePageMeta } from '../../context';
import {
  ReportTemplates,
  TemplateCard,
  TemplateIcon,
  TemplateContent,
  TemplateName,
  TemplateDescription,
  ReportsList,
  ReportCard,
  ReportInfo,
  ReportName,
  ReportMeta,
  MetaItem,
  ReportActions,
  EmptyState,
  GenerateButton,
} from './Reports.styles';

export interface ReportsProps {
  className?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  audience: string;
}

interface GeneratedReport {
  id: string;
  name: string;
  template: string;
  createdAt: string;
  format: 'PDF' | 'HTML' | 'JSON';
  size: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'executive',
    name: 'Executive Summary',
    description: 'High-level overview of agent security posture for leadership',
    icon: Briefcase,
    audience: 'C-Suite',
  },
  {
    id: 'security',
    name: 'Security Assessment',
    description: 'Detailed security findings, vulnerabilities, and remediation steps',
    icon: Shield,
    audience: 'Security Team',
  },
  {
    id: 'compliance',
    name: 'Compliance Report',
    description: 'OWASP LLM Top 10 compliance status and audit trail',
    icon: FileText,
    audience: 'Compliance',
  },
  {
    id: 'developer',
    name: 'Developer Report',
    description: 'Technical details, code snippets, and implementation guidance',
    icon: Users,
    audience: 'Development',
  },
];

// Mock data - would come from API
const mockReports: GeneratedReport[] = [];

export const Reports: FC<ReportsProps> = ({ className }) => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [reports] = useState<GeneratedReport[]>(mockReports);

  usePageMeta({
    breadcrumbs: workflowId
      ? buildWorkflowBreadcrumbs(workflowId, { label: 'Reports' })
      : [{ label: 'Workflows', href: '/' }, { label: 'Reports' }],
  });

  const handleGenerateReport = (templateId: string) => {
    // Would trigger report generation
    console.log('Generate report:', templateId);
    alert('Report generation coming soon! This feature will allow you to generate custom reports for different stakeholders.');
  };

  return (
    <Page className={className} data-testid="reports">
      <PageHeader
        icon={<ReportsIcon size={24} />}
        title="Reports"
        description="Generate and manage security reports for different stakeholders"
      />

      {/* Report Templates */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Plus size={16} />}>Generate New Report</Section.Title>
        </Section.Header>
        <Section.Content>
          <ReportTemplates>
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <TemplateCard key={template.id} onClick={() => handleGenerateReport(template.id)}>
                  <TemplateIcon>
                    <Icon size={24} />
                  </TemplateIcon>
                  <TemplateContent>
                    <TemplateName>{template.name}</TemplateName>
                    <TemplateDescription>{template.description}</TemplateDescription>
                    <Badge variant="info">{template.audience}</Badge>
                  </TemplateContent>
                  <GenerateButton>
                    <Plus size={16} />
                    Generate
                  </GenerateButton>
                </TemplateCard>
              );
            })}
          </ReportTemplates>
        </Section.Content>
      </Section>

      {/* Generated Reports */}
      <Section>
        <Section.Header>
          <Section.Title icon={<FileText size={16} />}>
            Generated Reports ({reports.length})
          </Section.Title>
        </Section.Header>
        <Section.Content>
          {reports.length > 0 ? (
            <ReportsList>
              {reports.map((report) => (
                <ReportCard key={report.id}>
                  <ReportInfo>
                    <ReportName>{report.name}</ReportName>
                    <ReportMeta>
                      <MetaItem>
                        <Calendar size={12} />
                        {report.createdAt}
                      </MetaItem>
                      <MetaItem>
                        <FileText size={12} />
                        {report.format}
                      </MetaItem>
                      <MetaItem>
                        {report.size}
                      </MetaItem>
                    </ReportMeta>
                  </ReportInfo>
                  <Badge variant="medium">{report.template}</Badge>
                  <ReportActions>
                    <Button variant="ghost" size="sm">
                      <Eye size={14} />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download size={14} />
                      Download
                    </Button>
                  </ReportActions>
                </ReportCard>
              ))}
            </ReportsList>
          ) : (
            <EmptyState>
              <FileText size={48} />
              <h3>No reports generated yet</h3>
              <p>Select a template above to generate your first report. Reports will be stored here for easy access.</p>
            </EmptyState>
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};

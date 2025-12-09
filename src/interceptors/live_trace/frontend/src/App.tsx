import { useState, useCallback, useEffect } from 'react';

import { FileSearch, LayoutDashboard, Plug, History, Home } from 'lucide-react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import type { ConfigResponse } from '@api/types/config';
import type { DashboardResponse, DashboardFindingsSummary } from '@api/types/dashboard';
import type { APIWorkflow } from '@api/types/workflows';
import { fetchConfig } from '@api/endpoints/config';
import { fetchDashboard, fetchWorkflows } from '@api/endpoints/dashboard';
import { useIsInitialLoad, usePolling } from '@hooks/index';
import { theme, GlobalStyles } from '@theme/index';
import { workflowLink } from '@utils/breadcrumbs';

import { Main } from '@ui/layout/Main';
import { Content } from '@ui/layout/Content';
import { NavItem, NavGroup } from '@ui/navigation/NavItem';
import { Label } from '@ui/core/Label';

import { Shell } from '@domain/layout/Shell';
import { Sidebar } from '@domain/layout/Sidebar';
import { TopBar } from '@domain/layout/TopBar';
import { LocalModeIndicator } from '@domain/layout/LocalModeIndicator';
import { Logo } from '@domain/layout/Logo';
import { AgentListItem } from '@domain/agents/AgentListItem';
import { WorkflowSelector, type Workflow } from '@domain/workflows';
import { AnalysisStatusItem, type AnalysisStatus } from '@domain/analysis';

import { PageMetaProvider, usePageMetaValue } from './context';
import { AgentDetail, AgentReport, Connect, Portfolio, SessionDetail, Sessions, StaticAnalysis, WorkflowDetail, WorkflowsHome } from '@pages/index';

// Derive analysis status from findings summary
function getStaticAnalysisStatus(summary: DashboardFindingsSummary | undefined): AnalysisStatus {
  if (!summary || summary.total_findings === 0) {
    return 'inactive';
  }

  const openCritical = summary.by_severity?.CRITICAL ?? 0;
  const openHigh = summary.by_severity?.HIGH ?? 0;

  if (openCritical > 0) {
    return 'critical';
  }
  if (openHigh > 0) {
    return 'warning';
  }

  return 'ok';
}

// Get open findings count from summary
function getOpenFindingsCount(summary: DashboardFindingsSummary | undefined): number | undefined {
  if (!summary) return undefined;
  const openCount = summary.by_status?.OPEN ?? 0;
  return openCount > 0 ? openCount : undefined;
}

// Convert API workflow to component workflow
const toWorkflow = (api: APIWorkflow): Workflow => ({
  id: api.id,
  name: api.name,
  agentCount: api.agent_count,
});

// Extract workflowId from URL pathname (e.g., /workflow/abc123/agent/xyz -> abc123)
function getWorkflowIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/workflow\/([^/]+)/);
  return match ? match[1] : null;
}

// Extract agentId from URL pathname
function getAgentIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/agent\/([^/]+)/);
  return match ? match[1] : null;
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // URL is source of truth for workflow
  const urlWorkflowId = getWorkflowIdFromPath(location.pathname);
  const currentAgentId = getAgentIdFromPath(location.pathname);

  // Detect if we're on the root page or in unassigned context
  const isRootPage = location.pathname === '/' || location.pathname === '/connect';
  const isUnassignedContext = urlWorkflowId === 'unassigned';

  // Workflow list state (for dropdown)
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  // Config state (for storage mode indicator)
  const [config, setConfig] = useState<ConfigResponse | null>(null);

  // Derive selected workflow from URL
  const selectedWorkflow = (() => {
    if (!urlWorkflowId) return null;
    if (urlWorkflowId === 'unassigned') {
      return { id: 'unassigned', name: 'Unassigned', agentCount: 0 };
    }
    return workflows.find(w => w.id === urlWorkflowId) ?? null;
  })();

  // Get breadcrumbs from page context
  const { breadcrumbs, hide: hideTopBar } = usePageMetaValue();

  // Fetch workflows on mount
  useEffect(() => {
    fetchWorkflows()
      .then((response) => {
        setWorkflows(response.workflows.map(toWorkflow));
      })
      .catch((error) => {
        console.error('Failed to fetch workflows:', error);
      });
  }, []);

  // Fetch config on mount (for storage mode indicator)
  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch((error) => {
        console.error('Failed to fetch config:', error);
      });
  }, []);

  // Refresh workflows periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWorkflows()
        .then((response) => {
          setWorkflows(response.workflows.map(toWorkflow));
        })
        .catch(() => {
          // Silently ignore refresh errors
        });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle workflow selection - navigate to new URL
  const handleWorkflowSelect = useCallback((workflow: Workflow) => {
    if (workflow.id === null) {
      // Unassigned workflow - use 'unassigned' in URL
      navigate('/workflow/unassigned');
    } else {
      // Specific workflow - go to workflow overview
      navigate(`/workflow/${workflow.id}`);
    }
  }, [navigate]);

  // Poll dashboard data filtered by URL workflow
  const workflowIdForFetch = urlWorkflowId === 'unassigned' ? 'unassigned' : urlWorkflowId ?? undefined;
  const fetchFn = useCallback(
    () => fetchDashboard(workflowIdForFetch),
    [workflowIdForFetch]
  );
  const { data, loading } = usePolling<DashboardResponse>(fetchFn, {
    interval: 2000,
    enabled: true,
  });

  const agents = data?.agents ?? [];

  // Check if this is the initial load (fires once when data first loads)
  const isInitialLoad = useIsInitialLoad(!loading && data !== null);

  // Redirect to /connect on first load if no workflows exist and no unassigned agents
  useEffect(() => {
    if (isInitialLoad && location.pathname === '/' && workflows.length === 0 && agents.length === 0) {
      navigate('/connect', { replace: true });
    }
  }, [isInitialLoad, location.pathname, workflows.length, agents.length, navigate]);

  return (
    <Shell>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        hideCollapse
      >
        <Sidebar.Header>
          <Logo />
        </Sidebar.Header>
        {/* Workflow Selector - only show if there are workflows and NOT on root page */}
        {workflows.length > 0 && !isRootPage && (
          <WorkflowSelector
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            onSelect={handleWorkflowSelect}
            collapsed={sidebarCollapsed}
          />
        )}
        <Sidebar.Section>
          {/* Start Here - show on root page and connect page */}
          {isRootPage && (
            <NavItem
              icon={<Home size={18} />}
              label="Start Here"
              active={location.pathname === '/'}
              to="/"
              collapsed={sidebarCollapsed}
            />
          )}

          {/* Analysis Section - only show when in a workflow (not on root) */}
          {urlWorkflowId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Analysis' : undefined}>
              <AnalysisStatusItem
                label="Static Analysis"
                status={getStaticAnalysisStatus(data?.findings_summary)}
                count={getOpenFindingsCount(data?.findings_summary)}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/workflow/${urlWorkflowId}/static-analysis`}
                active={location.pathname === `/workflow/${urlWorkflowId}/static-analysis`}
              />
              <AnalysisStatusItem
                label="Dynamic Analysis"
                status="inactive"
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
              />
              <AnalysisStatusItem
                label="Recommendations"
                status="inactive"
                isRecommendation
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
              />
            </NavGroup>
          )}

          {/* Navigate Section - only show when in a workflow (not on root) */}
          {!isRootPage && (
            <NavGroup label={urlWorkflowId && !sidebarCollapsed ? 'Navigate' : undefined}>
              {urlWorkflowId && (
                <NavItem
                  icon={<FileSearch size={18} />}
                  label="Overview"
                  active={location.pathname === `/workflow/${urlWorkflowId}`}
                  to={`/workflow/${urlWorkflowId}`}
                  collapsed={sidebarCollapsed}
                />
              )}
              <NavItem
                label="Agents"
                icon={<LayoutDashboard size={18} />}
                badge={agents.length > 0 ? agents.length : undefined}
                active={urlWorkflowId ? location.pathname === `/workflow/${urlWorkflowId}/agents` : location.pathname === '/'}
                to={urlWorkflowId ? `/workflow/${urlWorkflowId}/agents` : '/'}
                collapsed={sidebarCollapsed}
              />
              {urlWorkflowId && (
                <NavItem
                  icon={<History size={18} />}
                  label="Sessions"
                  badge={data?.sessions_count ? data.sessions_count : undefined}
                  active={location.pathname === `/workflow/${urlWorkflowId}/sessions`}
                  to={`/workflow/${urlWorkflowId}/sessions`}
                  collapsed={sidebarCollapsed}
                />
              )}
            </NavGroup>
          )}

          {/* Agent List - only show when NOT on root page */}
          {!isRootPage && !sidebarCollapsed && agents.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 8, paddingLeft: 12 }}>
              <Label size="xs" uppercase>
                Agents ({agents.length})
              </Label>
            </div>
          )}
          {!isRootPage && agents.map((agent) => (
            <AgentListItem
              key={agent.id}
              agent={agent}
              active={currentAgentId === agent.id}
              collapsed={sidebarCollapsed}
              to={workflowLink(agent.workflow_id, `/agent/${agent.id}`)}
            />
          ))}
        </Sidebar.Section>
        <Sidebar.Footer>
          <NavItem
            label="How to Connect"
            icon={<Plug size={18} />}
            active={location.pathname === '/connect'}
            to="/connect"
            collapsed={sidebarCollapsed}
          />
          <LocalModeIndicator
            collapsed={sidebarCollapsed}
            storageMode={config?.storage_mode}
            storagePath={config?.db_path ?? undefined}
          />
        </Sidebar.Footer>
      </Sidebar>
      <Main>

        {!hideTopBar && <TopBar
          breadcrumb={breadcrumbs}
          // search={{
          //   onSearch: (query: string) => { console.log(query); },
          //   placeholder: 'Search sessions...',
          //   shortcut: '⌘K'
          // }}
        />}

        <Content>
          <Outlet context={{ agents, sessionsCount: data?.sessions_count ?? 0, loading }} />
        </Content>
      </Main>
    </Shell>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <PageMetaProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              {/* Root routes - Workflows landing page */}
              <Route path="/" element={<WorkflowsHome />} />
              <Route path="/connect" element={<Connect />} />
              {/* Workflow-prefixed routes */}
              <Route path="/workflow/:workflowId" element={<WorkflowDetail />} />
              <Route path="/workflow/:workflowId/agents" element={<Portfolio />} />
              <Route path="/workflow/:workflowId/sessions" element={<Sessions />} />
              <Route path="/workflow/:workflowId/static-analysis" element={<StaticAnalysis />} />
              <Route path="/workflow/:workflowId/agent/:agentId" element={<AgentDetail />} />
              <Route path="/workflow/:workflowId/agent/:agentId/report" element={<AgentReport />} />
              <Route path="/workflow/:workflowId/session/:sessionId" element={<SessionDetail />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PageMetaProvider>
    </ThemeProvider>
  );
}

export default App;

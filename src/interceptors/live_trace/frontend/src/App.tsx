import { useState, useCallback, useEffect } from 'react';

import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import {
  AttackSurfaceIcon,
  ConnectIcon,
  DevConnectionIcon,
  HomeIcon,
  OverviewIcon,
  ProductionIcon,
  RecommendationsIcon,
  ReportsIcon,
  SessionsIcon,
  SystemPromptsIcon,
} from '@constants/pageIcons';
import type { ConfigResponse } from '@api/types/config';
import type { DashboardResponse, AnalysisStage } from '@api/types/dashboard';
import type { IDEConnectionStatus } from '@api/types/ide';
import type { APIWorkflow } from '@api/types/workflows';
import { fetchConfig } from '@api/endpoints/config';
import { fetchDashboard, fetchWorkflows } from '@api/endpoints/dashboard';
import { fetchIDEConnectionStatus } from '@api/endpoints/ide';
import { usePolling } from '@hooks/index';
import { theme, GlobalStyles } from '@theme/index';

import { Main } from '@ui/layout/Main';
import { Content } from '@ui/layout/Content';
import { NavItem, NavGroup } from '@ui/navigation/NavItem';

import { Shell } from '@domain/layout/Shell';
import { Sidebar } from '@domain/layout/Sidebar';
import { TopBar } from '@domain/layout/TopBar';
import { LocalModeIndicator } from '@domain/layout/LocalModeIndicator';
import { Logo } from '@domain/layout/Logo';
import { WorkflowSelector, type Workflow } from '@domain/workflows';
import { SecurityCheckItem, type SecurityCheckStatus } from '@domain/analysis';

import { PageMetaProvider, usePageMetaValue } from './context';
import { 
  AgentDetail, 
  AgentReport, 
  AttackSurface,
  Connect, 
  DevConnection,
  DynamicAnalysis, 
  Overview,
  Portfolio, 
  Recommendations,
  Reports,
  SessionDetail, 
  Sessions, 
  StaticAnalysis,
  WorkflowsHome 
} from '@pages/index';

// Convert backend stage status to SecurityCheckStatus
function stageToSecurityStatus(stage: AnalysisStage | undefined): SecurityCheckStatus {
  if (!stage) return 'inactive';

  switch (stage.status) {
    case 'active':
      return 'running';
    case 'completed':
      // For completed analysis, derive severity from embedded findings
      if (stage.findings) {
        const openCritical = stage.findings.by_severity?.CRITICAL ?? 0;
        const openHigh = stage.findings.by_severity?.HIGH ?? 0;
        if (openCritical > 0) return 'critical';
        if (openHigh > 0) return 'warning';
        return 'ok';
      }
      return 'ok';
    case 'pending':
    default:
      return 'inactive';
  }
}

// Get open findings count from stage
function getOpenFindingsCount(stage: AnalysisStage | undefined): number | undefined {
  if (!stage?.findings) return undefined;
  const openCount = stage.findings.by_status?.OPEN ?? 0;
  return openCount > 0 ? openCount : undefined;
}

// Get dynamic analysis stat text (sessions progress or findings count)
function getDynamicAnalysisStat(stage: AnalysisStage | undefined): string | undefined {
  if (!stage) return undefined;
  
  // If we have sessions progress and status is active, show progress
  if (stage.sessions_progress && stage.status === 'active') {
    const { current, required } = stage.sessions_progress;
    return `${current}/${required}`;
  }
  
  return undefined;
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

// Determine if all security checks are passed (for Production unlock)
function areAllChecksGreen(data: DashboardResponse | null): boolean {
  if (!data?.security_analysis) return false;
  const staticStatus = stageToSecurityStatus(data.security_analysis.static);
  const dynamicStatus = stageToSecurityStatus(data.security_analysis.dynamic);
  return staticStatus === 'ok' && dynamicStatus === 'ok';
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // URL is source of truth for workflow
  const urlWorkflowId = getWorkflowIdFromPath(location.pathname);

  // Detect if we're on the root page or in unassigned context
  const isRootPage = location.pathname === '/' || location.pathname === '/connect';
  const isUnassignedContext = urlWorkflowId === 'unassigned';

  // Workflow list state (for dropdown)
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoaded, setWorkflowsLoaded] = useState(false);

  // Config state (for storage mode indicator)
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  
  // IDE connection state
  const [ideConnectionStatus, setIDEConnectionStatus] = useState<IDEConnectionStatus | null>(null);

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
        setWorkflowsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to fetch workflows:', error);
        setWorkflowsLoaded(true); // Mark as loaded even on error to unblock redirect
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
  
  // Fetch IDE connection status
  useEffect(() => {
    const fetchIDE = async () => {
      try {
        const workflowIdForIDE = urlWorkflowId === 'unassigned' ? undefined : urlWorkflowId ?? undefined;
        const status = await fetchIDEConnectionStatus(workflowIdForIDE);
        setIDEConnectionStatus(status);
      } catch {
        // Silently fail - IDE connection is optional
      }
    };

    fetchIDE();
    // Poll IDE status every 5 seconds
    const interval = setInterval(fetchIDE, 5000);
    return () => clearInterval(interval);
  }, [urlWorkflowId]);

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
  const dashboardLoaded = !loading && data !== null;

  // Derive if we have any data (workflows or agents)
  const hasData = workflows.length > 0 || agents.length > 0;

  // Redirect logic based on data availability
  useEffect(() => {
    // Only act when both data sources have loaded
    if (!workflowsLoaded || !dashboardLoaded) return;

    if (location.pathname === '/' && !hasData) {
      // No data → show Connect page
      navigate('/connect', { replace: true });
    }
  }, [location.pathname, workflowsLoaded, dashboardLoaded, hasData, navigate]);

  // Security check states
  const staticStatus = stageToSecurityStatus(data?.security_analysis?.static);
  const dynamicStatus = stageToSecurityStatus(data?.security_analysis?.dynamic);
  const allChecksGreen = areAllChecksGreen(data);
  
  // Dev connection status - from actual IDE connection
  // States:
  // - 'running': Actively developing (pulsing green animation)
  // - 'ok': Connected or was connected (solid green)
  // - 'inactive': Never connected (gray)
  const devConnectionStatus: SecurityCheckStatus = (() => {
    if (!ideConnectionStatus) return 'inactive';
    if (ideConnectionStatus.is_developing) return 'running'; // Actively developing shows as pulsing
    if (ideConnectionStatus.is_connected) return 'ok'; // Currently connected shows as green
    if (ideConnectionStatus.has_ever_connected) return 'ok'; // Was connected shows as green (idle)
    return 'inactive';
  })();

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
          {/* Start Here - show on root page only if there's data */}
          {isRootPage && hasData && (
            <NavItem
              icon={<HomeIcon size={18} />}
              label="Start Here"
              active={location.pathname === '/'}
              to="/"
              collapsed={sidebarCollapsed}
            />
          )}

          {/* ===== DEVELOPER SECTION ===== */}
          {urlWorkflowId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Developer' : undefined}>
              <NavItem
                icon={<OverviewIcon size={18} />}
                label="Overview"
                active={location.pathname === `/workflow/${urlWorkflowId}/overview`}
                to={`/workflow/${urlWorkflowId}/overview`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                label="Agents"
                icon={<SystemPromptsIcon size={18} />}
                badge={agents.length > 0 ? agents.length : undefined}
                active={location.pathname === `/workflow/${urlWorkflowId}/agents` || location.pathname === `/workflow/${urlWorkflowId}`}
                to={`/workflow/${urlWorkflowId}/agents`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<SessionsIcon size={18} />}
                label="Sessions"
                badge={data?.sessions_count ? data.sessions_count : undefined}
                active={location.pathname === `/workflow/${urlWorkflowId}/sessions`}
                to={`/workflow/${urlWorkflowId}/sessions`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<RecommendationsIcon size={18} />}
                label="Recommendations"
                active={location.pathname === `/workflow/${urlWorkflowId}/recommendations`}
                to={`/workflow/${urlWorkflowId}/recommendations`}
                collapsed={sidebarCollapsed}
              />
            </NavGroup>
          )}

          {/* ===== SECURITY CHECKS SECTION (with Timeline) ===== */}
          {urlWorkflowId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Security Checks' : undefined}>
              <SecurityCheckItem
                label="Dev"
                status={devConnectionStatus}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/workflow/${urlWorkflowId}/dev-connection`}
                active={location.pathname === `/workflow/${urlWorkflowId}/dev-connection`}
                showConnectorBelow
                isFirst
                icon={<DevConnectionIcon size={10} />}
              />
              <SecurityCheckItem
                label="Static Analysis"
                status={staticStatus}
                count={getOpenFindingsCount(data?.security_analysis?.static)}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/workflow/${urlWorkflowId}/static-analysis`}
                active={location.pathname === `/workflow/${urlWorkflowId}/static-analysis`}
                showConnectorAbove
                showConnectorBelow
              />
              <SecurityCheckItem
                label="Dynamic Analysis"
                status={dynamicStatus}
                count={getOpenFindingsCount(data?.security_analysis?.dynamic)}
                stat={getDynamicAnalysisStat(data?.security_analysis?.dynamic)}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/workflow/${urlWorkflowId}/dynamic-analysis`}
                active={location.pathname === `/workflow/${urlWorkflowId}/dynamic-analysis`}
                showConnectorAbove
                showConnectorBelow
              />
              <SecurityCheckItem
                label="Production"
                status={allChecksGreen ? 'premium' : 'locked'}
                collapsed={sidebarCollapsed}
                disabled={!allChecksGreen}
                isLocked={!allChecksGreen}
                isLast
                showConnectorAbove
                icon={<ProductionIcon size={10} />}
                lockedTooltip="Enterprise Edition • Production monitoring, alerting & compliance. Complete all security checks to unlock."
              />
            </NavGroup>
          )}

          {/* ===== REPORTS SECTION ===== */}
          {urlWorkflowId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Reports' : undefined}>
              <NavItem
                icon={<ReportsIcon size={18} />}
                label="Reports"
                active={location.pathname === `/workflow/${urlWorkflowId}/reports`}
                to={`/workflow/${urlWorkflowId}/reports`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<AttackSurfaceIcon size={18} />}
                label="Attack Surface"
                active={location.pathname === `/workflow/${urlWorkflowId}/attack-surface`}
                to={`/workflow/${urlWorkflowId}/attack-surface`}
                collapsed={sidebarCollapsed}
              />
            </NavGroup>
          )}
        </Sidebar.Section>
        
        <Sidebar.Footer>
          <NavItem
            label="How to Connect"
            icon={<ConnectIcon size={18} />}
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
          <Outlet context={{ agents, sessionsCount: data?.sessions_count ?? 0, loading, securityAnalysis: data?.security_analysis }} />
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

              {/* Workflow-prefixed routes - redirect base path to overview */}
              <Route path="/workflow/:workflowId" element={<Navigate to="overview" replace />} />

              {/* Developer section */}
              <Route path="/workflow/:workflowId/overview" element={<Overview />} />
              <Route path="/workflow/:workflowId/agents" element={<Portfolio />} />
              <Route path="/workflow/:workflowId/sessions" element={<Sessions />} />
              <Route path="/workflow/:workflowId/recommendations" element={<Recommendations />} />

              {/* Security Checks section */}
              <Route path="/workflow/:workflowId/dev-connection" element={<DevConnection />} />
              <Route path="/workflow/:workflowId/static-analysis" element={<StaticAnalysis />} />
              <Route path="/workflow/:workflowId/dynamic-analysis" element={<DynamicAnalysis />} />

              {/* Reports section */}
              <Route path="/workflow/:workflowId/reports" element={<Reports />} />
              <Route path="/workflow/:workflowId/attack-surface" element={<AttackSurface />} />

              {/* Detail pages */}
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

import { useState, useCallback, useEffect } from 'react';

import { 
  LayoutDashboard, 
  Plug, 
  History, 
  Home,
  Monitor,
  Lock,
  FileText,
  Target,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import type { ConfigResponse } from '@api/types/config';
import type { DashboardResponse, AnalysisStage } from '@api/types/dashboard';
import type { APIWorkflow } from '@api/types/workflows';
import { fetchConfig } from '@api/endpoints/config';
import { fetchDashboard, fetchWorkflows } from '@api/endpoints/dashboard';
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

// Convert API workflow to component workflow
const toWorkflow = (api: APIWorkflow): Workflow => ({
  id: api.id,
  name: api.name,
  agentCount: api.agent_count,
});

// Extract agentId from URL pathname (e.g., /agent/abc123/system-prompt/xyz -> abc123)
function getAgentIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/agent\/([^/]+)/);
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

  // URL is source of truth for agent
  const urlAgentId = getAgentIdFromPath(location.pathname);

  // Detect if we're on the root page or in unassigned context
  const isRootPage = location.pathname === '/' || location.pathname === '/connect';
  const isUnassignedContext = urlAgentId === 'unassigned';

  // Agent list state (for dropdown)
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoaded, setWorkflowsLoaded] = useState(false);

  // Config state (for storage mode indicator)
  const [config, setConfig] = useState<ConfigResponse | null>(null);

  // Derive selected agent from URL
  const selectedWorkflow = (() => {
    if (!urlAgentId) return null;
    if (urlAgentId === 'unassigned') {
      return { id: 'unassigned', name: 'Unassigned', agentCount: 0 };
    }
    return workflows.find(w => w.id === urlAgentId) ?? null;
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

  // Handle agent selection - navigate to new URL
  const handleWorkflowSelect = useCallback((workflow: Workflow) => {
    if (workflow.id === null) {
      // Unassigned agent - use 'unassigned' in URL
      navigate('/agent/unassigned');
    } else {
      // Specific agent - go to agent overview
      navigate(`/agent/${workflow.id}`);
    }
  }, [navigate]);

  // Poll dashboard data filtered by URL agent
  const workflowIdForFetch = urlAgentId === 'unassigned' ? 'unassigned' : urlAgentId ?? undefined;
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
    } else if (location.pathname === '/connect' && hasData) {
      // Has data → redirect away from Connect page
      if (workflows.length > 0) {
        // Go to first agent
        navigate(`/agent/${workflows[0].id}`, { replace: true });
      } else {
        // No agents but has system prompts → go to home
        navigate('/', { replace: true });
      }
    }
  }, [location.pathname, workflowsLoaded, dashboardLoaded, hasData, workflows, navigate]);

  // Security check states
  const staticStatus = stageToSecurityStatus(data?.security_analysis?.static);
  const dynamicStatus = stageToSecurityStatus(data?.security_analysis?.dynamic);
  const allChecksGreen = areAllChecksGreen(data);
  
  // Dev connection status - would come from actual MCP status, for now assume inactive
  const devConnectionStatus: SecurityCheckStatus = 'inactive';

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
              icon={<Home size={18} />}
              label="Start Here"
              active={location.pathname === '/'}
              to="/"
              collapsed={sidebarCollapsed}
            />
          )}

          {/* ===== DEVELOPER SECTION ===== */}
          {urlAgentId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Developer' : undefined}>
              <NavItem
                icon={<BarChart3 size={18} />}
                label="Overview"
                active={location.pathname === `/agent/${urlAgentId}/overview`}
                to={`/agent/${urlAgentId}/overview`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                label="System prompts"
                icon={<LayoutDashboard size={18} />}
                badge={agents.length > 0 ? agents.length : undefined}
                active={location.pathname === `/agent/${urlAgentId}/system-prompts` || location.pathname === `/agent/${urlAgentId}`}
                to={`/agent/${urlAgentId}/system-prompts`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<History size={18} />}
                label="Sessions"
                badge={data?.sessions_count ? data.sessions_count : undefined}
                active={location.pathname === `/agent/${urlAgentId}/sessions`}
                to={`/agent/${urlAgentId}/sessions`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<Lightbulb size={18} />}
                label="Recommendations"
                active={location.pathname === `/agent/${urlAgentId}/recommendations`}
                to={`/agent/${urlAgentId}/recommendations`}
                collapsed={sidebarCollapsed}
              />
            </NavGroup>
          )}

          {/* ===== SECURITY CHECKS SECTION (with Timeline) ===== */}
          {urlAgentId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Security Checks' : undefined}>
              <SecurityCheckItem
                label="Dev"
                status={devConnectionStatus}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/agent/${urlAgentId}/dev-connection`}
                active={location.pathname === `/agent/${urlAgentId}/dev-connection`}
                showConnectorBelow
                isFirst
                icon={<Monitor size={10} />}
              />
              <SecurityCheckItem
                label="Static Analysis"
                status={staticStatus}
                count={getOpenFindingsCount(data?.security_analysis?.static)}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/agent/${urlAgentId}/static-analysis`}
                active={location.pathname === `/agent/${urlAgentId}/static-analysis`}
                showConnectorAbove
                showConnectorBelow
              />
              <SecurityCheckItem
                label="Dynamic Analysis"
                status={dynamicStatus}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/agent/${urlAgentId}/dynamic-analysis`}
                active={location.pathname === `/agent/${urlAgentId}/dynamic-analysis`}
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
                icon={<Lock size={10} />}
                lockedTooltip="Complete all security checks to unlock Production deployment. Enterprise feature."
              />
            </NavGroup>
          )}

          {/* ===== REPORTS SECTION ===== */}
          {urlAgentId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Reports' : undefined}>
              <NavItem
                icon={<FileText size={18} />}
                label="Reports"
                active={location.pathname === `/agent/${urlAgentId}/reports`}
                to={`/agent/${urlAgentId}/reports`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<Target size={18} />}
                label="Attack Surface"
                active={location.pathname === `/agent/${urlAgentId}/attack-surface`}
                to={`/agent/${urlAgentId}/attack-surface`}
                collapsed={sidebarCollapsed}
              />
            </NavGroup>
          )}
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
              {/* Root routes - Agents landing page */}
              <Route path="/" element={<WorkflowsHome />} />
              <Route path="/connect" element={<Connect />} />
              
              {/* Agent-prefixed routes */}
              <Route path="/agent/:agentId" element={<Portfolio />} />
              
              {/* Developer section */}
              <Route path="/agent/:agentId/overview" element={<Overview />} />
              <Route path="/agent/:agentId/system-prompts" element={<Portfolio />} />
              <Route path="/agent/:agentId/sessions" element={<Sessions />} />
              <Route path="/agent/:agentId/recommendations" element={<Recommendations />} />
              
              {/* Security Checks section */}
              <Route path="/agent/:agentId/dev-connection" element={<DevConnection />} />
              <Route path="/agent/:agentId/static-analysis" element={<StaticAnalysis />} />
              <Route path="/agent/:agentId/dynamic-analysis" element={<DynamicAnalysis />} />
              
              {/* Reports section */}
              <Route path="/agent/:agentId/reports" element={<Reports />} />
              <Route path="/agent/:agentId/attack-surface" element={<AttackSurface />} />
              
              {/* Detail pages */}
              <Route path="/agent/:agentId/system-prompt/:systemPromptId" element={<AgentDetail />} />
              <Route path="/agent/:agentId/system-prompt/:systemPromptId/report" element={<AgentReport />} />
              <Route path="/agent/:agentId/session/:sessionId" element={<SessionDetail />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PageMetaProvider>
    </ThemeProvider>
  );
}

export default App;

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
import type { APIAgentWorkflow } from '@api/types/agentWorkflows';
import { fetchConfig } from '@api/endpoints/config';
import { fetchDashboard, fetchAgentWorkflows } from '@api/endpoints/dashboard';
import { fetchIDEConnectionStatus } from '@api/endpoints/ide';
import { fetchRecommendations } from '@api/endpoints/agentWorkflow';
import type { Recommendation } from '@api/types/findings';
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
import { AgentWorkflowSelector, type AgentWorkflow } from '@domain/agent-workflows';
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
  AgentWorkflowsHome
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
        const openMedium = stage.findings.by_severity?.MEDIUM ?? 0;
        if (openCritical > 0 || openHigh > 0) return 'critical';
        if (openMedium > 0) return 'warning';
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

// Get badge color based on highest severity of open findings
function getSeverityBadgeColor(stage: AnalysisStage | undefined): 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | undefined {
  if (!stage?.findings?.by_severity) return undefined;
  const sev = stage.findings.by_severity;
  // Check highest severity first
  if ((sev.CRITICAL ?? 0) > 0) return 'red';
  if ((sev.HIGH ?? 0) > 0) return 'red';
  if ((sev.MEDIUM ?? 0) > 0) return 'yellow';
  if ((sev.LOW ?? 0) > 0) return 'cyan';
  return undefined;
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

// Convert API agent workflow to component agent workflow
const toAgentWorkflow = (api: APIAgentWorkflow): AgentWorkflow => ({
  id: api.id,
  name: api.name,
  agentCount: api.agent_count,
});

// Extract agentWorkflowId from URL pathname (e.g., /agent-workflow/abc123/agent/xyz -> abc123)
function getAgentWorkflowIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/agent-workflow\/([^/]+)/);
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

  // URL is source of truth for agent workflow
  const urlAgentWorkflowId = getAgentWorkflowIdFromPath(location.pathname);

  // Detect if we're on the root page or in unassigned context
  const isRootPage = location.pathname === '/' || location.pathname === '/connect';
  const isUnassignedContext = urlAgentWorkflowId === 'unassigned';

  // Agent workflow list state (for dropdown)
  const [agentWorkflows, setAgentWorkflows] = useState<AgentWorkflow[]>([]);
  const [agentWorkflowsLoaded, setAgentWorkflowsLoaded] = useState(false);

  // Config state (for storage mode indicator)
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  
  // IDE connection state
  const [ideConnectionStatus, setIDEConnectionStatus] = useState<IDEConnectionStatus | null>(null);

  // Open recommendations state (for sidebar badge)
  const [openRecommendations, setOpenRecommendations] = useState<{
    count: number;
    highestSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
    hasFixing: boolean;
  }>({ count: 0, highestSeverity: null, hasFixing: false });

  // Derive selected agent workflow from URL
  const selectedAgentWorkflow = (() => {
    if (!urlAgentWorkflowId) return null;
    if (urlAgentWorkflowId === 'unassigned') {
      return { id: 'unassigned', name: 'Unassigned', agentCount: 0 };
    }
    return agentWorkflows.find(w => w.id === urlAgentWorkflowId) ?? null;
  })();

  // Get breadcrumbs from page context
  const { breadcrumbs, hide: hideTopBar } = usePageMetaValue();

  // Fetch agent workflows on mount
  useEffect(() => {
    fetchAgentWorkflows()
      .then((response) => {
        setAgentWorkflows(response.agent_workflows.map(toAgentWorkflow));
        setAgentWorkflowsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to fetch agent workflows:', error);
        setAgentWorkflowsLoaded(true); // Mark as loaded even on error to unblock redirect
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
        const agentWorkflowIdForIDE = urlAgentWorkflowId === 'unassigned' ? undefined : urlAgentWorkflowId ?? undefined;
        const status = await fetchIDEConnectionStatus(agentWorkflowIdForIDE);
        setIDEConnectionStatus(status);
      } catch {
        // Silently fail - IDE connection is optional
      }
    };

    fetchIDE();
    // Poll IDE status every 5 seconds
    const interval = setInterval(fetchIDE, 5000);
    return () => clearInterval(interval);
  }, [urlAgentWorkflowId]);

  // Refresh agent workflows periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAgentWorkflows()
        .then((response) => {
          setAgentWorkflows(response.agent_workflows.map(toAgentWorkflow));
        })
        .catch(() => {
          // Silently ignore refresh errors
        });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch open recommendations count for sidebar badge
  useEffect(() => {
    if (!urlAgentWorkflowId || urlAgentWorkflowId === 'unassigned') {
      setOpenRecommendations({ count: 0, highestSeverity: null, hasFixing: false });
      return;
    }

    const fetchRecs = async () => {
      try {
        const response = await fetchRecommendations(urlAgentWorkflowId, { limit: 500 });
        const open = response.recommendations.filter((r: Recommendation) => 
          ['PENDING', 'FIXING'].includes(r.status)
        );
        
        // Check if any are in FIXING state
        const hasFixing = response.recommendations.some((r: Recommendation) => r.status === 'FIXING');
        
        // Determine highest severity
        let highestSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null = null;
        if (open.some((r: Recommendation) => r.severity === 'CRITICAL')) highestSeverity = 'CRITICAL';
        else if (open.some((r: Recommendation) => r.severity === 'HIGH')) highestSeverity = 'HIGH';
        else if (open.some((r: Recommendation) => r.severity === 'MEDIUM')) highestSeverity = 'MEDIUM';
        else if (open.length > 0) highestSeverity = 'LOW';

        setOpenRecommendations({ count: open.length, highestSeverity, hasFixing });
      } catch {
        // Silently fail
        setOpenRecommendations({ count: 0, highestSeverity: null, hasFixing: false });
      }
    };

    fetchRecs();
    // Poll every 5 seconds
    const interval = setInterval(fetchRecs, 5000);
    return () => clearInterval(interval);
  }, [urlAgentWorkflowId]);

  // Handle agent workflow selection - navigate to new URL
  const handleAgentWorkflowSelect = useCallback((agentWorkflow: AgentWorkflow) => {
    if (agentWorkflow.id === null) {
      // Unassigned agent workflow - use 'unassigned' in URL
      navigate('/agent-workflow/unassigned');
    } else {
      // Specific agent workflow - go to agent workflow overview
      navigate(`/agent-workflow/${agentWorkflow.id}`);
    }
  }, [navigate]);

  // Poll dashboard data filtered by URL agent workflow
  const agentWorkflowIdForFetch = urlAgentWorkflowId === 'unassigned' ? 'unassigned' : urlAgentWorkflowId ?? undefined;
  const fetchFn = useCallback(
    () => fetchDashboard(agentWorkflowIdForFetch),
    [agentWorkflowIdForFetch]
  );
  const { data, loading } = usePolling<DashboardResponse>(fetchFn, {
    interval: 2000,
    enabled: true,
  });

  const agents = data?.agents ?? [];
  const dashboardLoaded = !loading && data !== null;

  // Derive if we have any data (agent workflows or agents)
  const hasData = agentWorkflows.length > 0 || agents.length > 0;

  // Redirect logic based on data availability
  useEffect(() => {
    // Only act when both data sources have loaded
    if (!agentWorkflowsLoaded || !dashboardLoaded) return;

    if (location.pathname === '/' && !hasData) {
      // No data → show Connect page
      navigate('/connect', { replace: true });
    }
  }, [location.pathname, agentWorkflowsLoaded, dashboardLoaded, hasData, navigate]);

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
        
        {/* Agent Workflow Selector - only show if there are agent workflows and NOT on root page */}
        {agentWorkflows.length > 0 && !isRootPage && (
          <AgentWorkflowSelector
            agentWorkflows={agentWorkflows}
            selectedAgentWorkflow={selectedAgentWorkflow}
            onSelect={handleAgentWorkflowSelect}
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
          {urlAgentWorkflowId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Developer' : undefined}>
              <NavItem
                icon={<OverviewIcon size={18} />}
                label="Overview"
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/overview`}
                to={`/agent-workflow/${urlAgentWorkflowId}/overview`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                label="Agents"
                icon={<SystemPromptsIcon size={18} />}
                badge={agents.length > 0 ? agents.length : undefined}
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/agents` || location.pathname === `/agent-workflow/${urlAgentWorkflowId}`}
                to={`/agent-workflow/${urlAgentWorkflowId}/agents`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<SessionsIcon size={18} />}
                label="Sessions"
                badge={data?.sessions_count ? data.sessions_count : undefined}
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/sessions`}
                to={`/agent-workflow/${urlAgentWorkflowId}/sessions`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<RecommendationsIcon size={18} />}
                label="Recommendations"
                badge={openRecommendations.count > 0 ? openRecommendations.count : undefined}
                badgeColor={
                  openRecommendations.highestSeverity === 'CRITICAL' || openRecommendations.highestSeverity === 'HIGH'
                    ? 'red'
                    : openRecommendations.highestSeverity === 'MEDIUM'
                    ? 'orange'
                    : 'cyan'
                }
                iconPulsing={openRecommendations.hasFixing}
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/recommendations`}
                to={`/agent-workflow/${urlAgentWorkflowId}/recommendations`}
                collapsed={sidebarCollapsed}
              />
            </NavGroup>
          )}

          {/* ===== SECURITY CHECKS SECTION (with Timeline) ===== */}
          {urlAgentWorkflowId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Security Checks' : undefined}>
              <SecurityCheckItem
                label="Dev"
                status={devConnectionStatus}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/agent-workflow/${urlAgentWorkflowId}/dev-connection`}
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/dev-connection`}
                showConnectorBelow
                isFirst
                icon={<DevConnectionIcon size={10} />}
              />
              <SecurityCheckItem
                label="Static Analysis"
                status={staticStatus}
                count={getOpenFindingsCount(data?.security_analysis?.static)}
                badgeColor={getSeverityBadgeColor(data?.security_analysis?.static)}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/agent-workflow/${urlAgentWorkflowId}/static-analysis`}
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/static-analysis`}
                showConnectorAbove
                showConnectorBelow
              />
              <SecurityCheckItem
                label="Dynamic Analysis"
                status={dynamicStatus}
                count={getOpenFindingsCount(data?.security_analysis?.dynamic)}
                badgeColor={getSeverityBadgeColor(data?.security_analysis?.dynamic)}
                stat={getDynamicAnalysisStat(data?.security_analysis?.dynamic)}
                collapsed={sidebarCollapsed}
                disabled={isUnassignedContext}
                to={isUnassignedContext ? undefined : `/agent-workflow/${urlAgentWorkflowId}/dynamic-analysis`}
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/dynamic-analysis`}
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
          {urlAgentWorkflowId && !isRootPage && (
            <NavGroup label={!sidebarCollapsed ? 'Reports' : undefined}>
              <NavItem
                icon={<ReportsIcon size={18} />}
                label="Reports"
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/reports`}
                to={`/agent-workflow/${urlAgentWorkflowId}/reports`}
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon={<AttackSurfaceIcon size={18} />}
                label="Attack Surface"
                active={location.pathname === `/agent-workflow/${urlAgentWorkflowId}/attack-surface`}
                to={`/agent-workflow/${urlAgentWorkflowId}/attack-surface`}
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
              {/* Root routes - Agent Workflows landing page */}
              <Route path="/" element={<AgentWorkflowsHome />} />
              <Route path="/connect" element={<Connect />} />

              {/* Agent-workflow-prefixed routes - redirect base path to overview */}
              <Route path="/agent-workflow/:agentWorkflowId" element={<Navigate to="overview" replace />} />

              {/* Developer section */}
              <Route path="/agent-workflow/:agentWorkflowId/overview" element={<Overview />} />
              <Route path="/agent-workflow/:agentWorkflowId/agents" element={<Portfolio />} />
              <Route path="/agent-workflow/:agentWorkflowId/sessions" element={<Sessions />} />
              <Route path="/agent-workflow/:agentWorkflowId/recommendations" element={<Recommendations />} />

              {/* Security Checks section */}
              <Route path="/agent-workflow/:agentWorkflowId/dev-connection" element={<DevConnection />} />
              <Route path="/agent-workflow/:agentWorkflowId/static-analysis" element={<StaticAnalysis />} />
              <Route path="/agent-workflow/:agentWorkflowId/dynamic-analysis" element={<DynamicAnalysis />} />

              {/* Reports section */}
              <Route path="/agent-workflow/:agentWorkflowId/reports" element={<Reports />} />
              <Route path="/agent-workflow/:agentWorkflowId/attack-surface" element={<AttackSurface />} />

              {/* Detail pages */}
              <Route path="/agent-workflow/:agentWorkflowId/agent/:agentId" element={<AgentDetail />} />
              <Route path="/agent-workflow/:agentWorkflowId/agent/:agentId/report" element={<AgentReport />} />
              <Route path="/agent-workflow/:agentWorkflowId/session/:sessionId" element={<SessionDetail />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PageMetaProvider>
    </ThemeProvider>
  );
}

export default App;

import { useState, useCallback, useEffect } from 'react';

import { FileSearch, LayoutDashboard, Plug } from 'lucide-react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import type { ConfigResponse } from '@api/types/config';
import type { DashboardResponse } from '@api/types/dashboard';
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

import { PageMetaProvider, usePageMetaValue } from './context';
import { AgentDetail, AgentReport, Connect, Portfolio, SessionDetail, WorkflowDetail } from '@pages/index';

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
  const handleWorkflowSelect = useCallback((workflow: Workflow | null) => {
    if (workflow === null) {
      // All Workflows - go to root
      navigate('/');
    } else if (workflow.id === null) {
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

  // Redirect to /connect on first load if no agents and on root path
  useEffect(() => {
    if (isInitialLoad && location.pathname === '/' && data?.agents.length === 0) {
      navigate('/connect', { replace: true });
    }
  }, [isInitialLoad, location.pathname, data?.agents.length, navigate]);

  return (
    <Shell>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <Sidebar.Header>
          <Logo />
        </Sidebar.Header>
        {/* Workflow Selector - only show if there are workflows */}
        {workflows.length > 0 && (
          <WorkflowSelector
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            onSelect={handleWorkflowSelect}
            collapsed={sidebarCollapsed}
          />
        )}
        <Sidebar.Section>
          <NavGroup>
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
          </NavGroup>
          {!sidebarCollapsed && agents.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 8, paddingLeft: 12 }}>
              <Label size="xs" uppercase>
                Agents ({agents.length})
              </Label>
            </div>
          )}
          {agents.map((agent) => (
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
          <Outlet context={{ agents, sessions: data?.sessions ?? [], loading }} />
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
              {/* Root routes - All Workflows view */}
              <Route path="/" element={<Portfolio />} />
              <Route path="/connect" element={<Connect />} />
              {/* Workflow-prefixed routes */}
              <Route path="/workflow/:workflowId" element={<WorkflowDetail />} />
              <Route path="/workflow/:workflowId/agents" element={<Portfolio />} />
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

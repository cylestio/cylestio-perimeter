import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { LayoutDashboard, Plug } from 'lucide-react';

import type { DashboardResponse } from '@api/types/dashboard';
import { fetchDashboard } from '@api/endpoints/dashboard';
import { theme, GlobalStyles } from '@theme/index';
import { usePolling } from '@hooks/usePolling';

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

import { PageMetaProvider, usePageMetaValue } from './context';
import { AgentDetail, AgentReport, Connect, Portfolio, SessionDetail } from '@pages/index';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get breadcrumbs from page context
  const { breadcrumbs, hide: hideTopBar } = usePageMetaValue();

  // Poll dashboard data at app level
  const fetchFn = useCallback(() => fetchDashboard(), []);
  const { data, loading } = usePolling<DashboardResponse>(fetchFn, {
    interval: 2000,
    enabled: true,
  });

  const agents = data?.agents ?? [];

  // Check if we're on an agent detail page to highlight it
  const currentAgentId = params.agentId;

  return (
    <Shell>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <Sidebar.Header>
          <Logo />
        </Sidebar.Header>
        <Sidebar.Section>
          <NavGroup>
            <NavItem
              label="Portfolio"
              icon={<LayoutDashboard size={18} />}
              active={location.pathname === '/'}
              onClick={() => navigate('/')}
            />
            <NavItem
              label="How to Connect"
              icon={<Plug size={18} />}
              active={location.pathname === '/connect'}
              onClick={() => navigate('/connect')}
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
              onClick={() => navigate(`/dashboard/agent/${agent.id}`)}
            />
          ))}
        </Sidebar.Section>
        <Sidebar.Footer>
          <LocalModeIndicator storageMode="in-memory" />
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
          <Outlet context={{ dashboardData: data, dashboardLoading: loading }} />
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
              <Route path="/" element={<Portfolio />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/dashboard/session/:sessionId" element={<SessionDetail />} />
              <Route path="/dashboard/agent/:agentId" element={<AgentDetail />} />
              <Route path="/dashboard/agent/:agentId/report" element={<AgentReport />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PageMetaProvider>
    </ThemeProvider>
  );
}

export default App;

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { LayoutDashboard, Bug, Activity, Settings as SettingsIcon, File, Plug } from 'lucide-react';

import { theme, GlobalStyles } from '@theme/index';
import { Main } from '@ui/layout/Main';
import { Content } from '@ui/layout/Content';
import { NavItem, NavGroup } from '@ui/navigation/NavItem';

import { Shell } from '@domain/layout/Shell';
import { Sidebar } from '@domain/layout/Sidebar';
import { TopBar } from '@domain/layout/TopBar';
import { AgentSelector, type Agent } from '@domain/agents/AgentSelector';
import { LocalModeIndicator } from '@domain/layout/LocalModeIndicator';
import { Logo } from '@domain/layout/Logo';

import { PageMetaProvider, usePageMetaValue } from './context';
import { AgentDetail, AgentReport, Connect, Dashboard, Findings, Portfolio, SessionDetail, Sessions, Settings } from '@pages/index';

const agents: Agent[] = [
  { id: '1', name: 'CustomerAgent', initials: 'CA', status: 'online' },
  { id: '2', name: 'DataAgent', initials: 'DA', status: 'online' },
  { id: '3', name: 'FileAgent', initials: 'FA', status: 'offline' },
];

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get breadcrumbs from page context
  const { breadcrumbs } = usePageMetaValue();

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
          <AgentSelector
            agents={agents}
            selectedAgent={selectedAgent}
            onSelect={setSelectedAgent}
          />
          <NavGroup>
            <NavItem
              label="How to Connect"
              icon={<Plug size={18} />}
              active={location.pathname === '/connect'}
              onClick={() => navigate('/connect')}
            />
            <NavItem
              label="Agents"
              icon={<File size={18} />}
              active={location.pathname === '/portfolio'}
              onClick={() => navigate('/portfolio')}
            />
          </NavGroup>
          <NavGroup label="Example Pages">
            <NavItem
              label="Dashboard"
              icon={<LayoutDashboard size={18} />}
              active={location.pathname === '/'}
              onClick={() => navigate('/')}
            />
            <NavItem
              label="Findings"
              icon={<Bug size={18} />}
              badge={5}
              badgeColor="red"
              active={location.pathname === '/findings'}
              onClick={() => navigate('/findings')}
            />
            <NavItem
              label="Sessions"
              icon={<Activity size={18} />}
              active={location.pathname === '/sessions'}
              onClick={() => navigate('/sessions')}
            />
            <NavItem
              label="Settings"
              icon={<SettingsIcon size={18} />}
              active={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
            />
          </NavGroup>
        </Sidebar.Section>
        <Sidebar.Footer>
          <LocalModeIndicator storageMode="in-memory" />
        </Sidebar.Footer>
      </Sidebar>
      <Main>
        <TopBar
          breadcrumb={breadcrumbs}
          search={{
            onSearch: (query: string) => { console.log(query); },
            placeholder: 'Search sessions...',
            shortcut: '⌘K'
          }}
        />

        <Content>
          <Outlet />
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
              <Route path="/" element={<Dashboard />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/findings" element={<Findings />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portfolio/session/:sessionId" element={<SessionDetail />} />
              <Route path="/portfolio/agent/:agentId" element={<AgentDetail />} />
              <Route path="/portfolio/agent/:agentId/report" element={<AgentReport />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PageMetaProvider>
    </ThemeProvider>
  );
}

export default App;

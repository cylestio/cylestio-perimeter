import type { FC } from 'react';
import { useState } from 'react';
import { User, Shield, Bell, Key } from 'lucide-react';
import { Button } from '@ui/core/Button';
import { Input } from '@ui/form/Input';
import { Select } from '@ui/form/Select';
import { Checkbox } from '@ui/form/Checkbox';
import { PageHeader } from '@ui/layout/PageHeader';
import { usePageMeta } from '../../context';
import {
  SettingsGrid,
  SettingsNav,
  NavItem,
  SettingsContent,
  Section,
  SectionTitle,
  SectionDescription,
  FormGrid,
  FormRow,
  FormActions,
  CheckboxGroup,
} from './Settings.styles';

type SettingsTab = 'general' | 'security' | 'notifications' | 'api';

const navItems = [
  { id: 'general' as const, label: 'General', icon: User },
  { id: 'security' as const, label: 'Security', icon: Shield },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'api' as const, label: 'API Keys', icon: Key },
];

export const Settings: FC = () => {
  usePageMeta({
    breadcrumbs: [{ label: 'Settings' }],
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [notifications, setNotifications] = useState({
    criticalFindings: true,
    highFindings: true,
    sessionComplete: false,
    dailyDigest: true,
  });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure your agent monitoring preferences"
      />

      <SettingsGrid>
        <SettingsNav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <NavItem
              key={id}
              $active={activeTab === id}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              {label}
            </NavItem>
          ))}
        </SettingsNav>

        <SettingsContent>
          {activeTab === 'general' && (
            <Section>
              <SectionTitle>General Settings</SectionTitle>
              <SectionDescription>
                Configure your basic account and display preferences
              </SectionDescription>
              <FormGrid>
                <FormRow>
                  <Input label="Display Name" defaultValue="Security Team" />
                  <Input label="Email" type="email" defaultValue="team@company.com" />
                </FormRow>
                <Select
                  label="Default Dashboard View"
                  options={[
                    { value: 'overview', label: 'Overview' },
                    { value: 'findings', label: 'Findings Focus' },
                    { value: 'sessions', label: 'Sessions Focus' },
                  ]}
                />
                <Select
                  label="Time Zone"
                  options={[
                    { value: 'utc', label: 'UTC' },
                    { value: 'est', label: 'Eastern Time (EST)' },
                    { value: 'pst', label: 'Pacific Time (PST)' },
                  ]}
                />
              </FormGrid>
              <FormActions>
                <Button variant="secondary">Cancel</Button>
                <Button>Save Changes</Button>
              </FormActions>
            </Section>
          )}

          {activeTab === 'security' && (
            <Section>
              <SectionTitle>Security Settings</SectionTitle>
              <SectionDescription>
                Configure security scanning and agent behavior
              </SectionDescription>
              <FormGrid>
                <Select
                  label="Scan Mode"
                  options={[
                    { value: 'passive', label: 'Passive - Monitor only' },
                    { value: 'active', label: 'Active - Full scanning' },
                    { value: 'aggressive', label: 'Aggressive - Deep analysis' },
                  ]}
                />
                <Select
                  label="Risk Threshold"
                  options={[
                    { value: 'critical', label: 'Critical only' },
                    { value: 'high', label: 'High and above' },
                    { value: 'medium', label: 'Medium and above' },
                    { value: 'low', label: 'All findings' },
                  ]}
                />
                <CheckboxGroup>
                  <Checkbox
                    label="Enable auto-remediation for low-risk findings"
                    checked
                  />
                  <Checkbox
                    label="Require approval for critical findings"
                    checked
                  />
                  <Checkbox
                    label="Enable correlation analysis"
                    checked
                  />
                </CheckboxGroup>
              </FormGrid>
              <FormActions>
                <Button variant="secondary">Cancel</Button>
                <Button>Save Changes</Button>
              </FormActions>
            </Section>
          )}

          {activeTab === 'notifications' && (
            <Section>
              <SectionTitle>Notification Preferences</SectionTitle>
              <SectionDescription>
                Choose what events trigger notifications
              </SectionDescription>
              <FormGrid>
                <CheckboxGroup>
                  <Checkbox
                    label="Critical findings"
                    checked={notifications.criticalFindings}
                    onChange={(checked) => setNotifications(n => ({ ...n, criticalFindings: checked }))}
                  />
                  <Checkbox
                    label="High severity findings"
                    checked={notifications.highFindings}
                    onChange={(checked) => setNotifications(n => ({ ...n, highFindings: checked }))}
                  />
                  <Checkbox
                    label="Session completion"
                    checked={notifications.sessionComplete}
                    onChange={(checked) => setNotifications(n => ({ ...n, sessionComplete: checked }))}
                  />
                  <Checkbox
                    label="Daily digest email"
                    checked={notifications.dailyDigest}
                    onChange={(checked) => setNotifications(n => ({ ...n, dailyDigest: checked }))}
                  />
                </CheckboxGroup>
                <Select
                  label="Notification Channel"
                  options={[
                    { value: 'email', label: 'Email' },
                    { value: 'slack', label: 'Slack' },
                    { value: 'both', label: 'Email & Slack' },
                  ]}
                />
              </FormGrid>
              <FormActions>
                <Button variant="secondary">Cancel</Button>
                <Button>Save Changes</Button>
              </FormActions>
            </Section>
          )}

          {activeTab === 'api' && (
            <Section>
              <SectionTitle>API Keys</SectionTitle>
              <SectionDescription>
                Manage API keys for external integrations
              </SectionDescription>
              <FormGrid>
                <Input
                  label="API Key"
                  value="sk_live_****************************"
                  readOnly
                />
                <Input
                  label="Webhook URL"
                  placeholder="https://your-server.com/webhook"
                />
              </FormGrid>
              <FormActions>
                <Button variant="danger">Regenerate Key</Button>
                <Button>Save Changes</Button>
              </FormActions>
            </Section>
          )}
        </SettingsContent>
      </SettingsGrid>
    </>
  );
};

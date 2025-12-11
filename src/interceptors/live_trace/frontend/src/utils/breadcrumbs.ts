import type { BreadcrumbItem } from '@ui/navigation/Breadcrumb';

export type { BreadcrumbItem };

/**
 * Builds breadcrumbs with agent context.
 * Always starts with Agents, then adds agent name (or Unassigned), then page-specific items.
 */
export function buildAgentBreadcrumbs(
  agentId: string | null | undefined,
  ...pageItems: BreadcrumbItem[]
): BreadcrumbItem[] {
  const id = agentId || 'unassigned';

  return [
    { label: 'Agents', href: '/' },
    ...(id !== 'unassigned'
      ? [{ label: id, href: `/agent/${id}` }]
      : [{ label: 'Unassigned', href: '/agent/unassigned' }]),
    ...pageItems,
  ];
}

/**
 * Builds an agent-prefixed link path.
 * Ensures agentId is never undefined/null in the URL.
 */
export function agentLink(agentId: string | null | undefined, path: string): string {
  return `/agent/${agentId || 'unassigned'}${path}`;
}

// Legacy aliases for backwards compatibility during migration
export const buildWorkflowBreadcrumbs = buildAgentBreadcrumbs;
export const workflowLink = agentLink;

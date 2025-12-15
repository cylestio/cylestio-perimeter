import type { BreadcrumbItem } from '@ui/navigation/Breadcrumb';

export type { BreadcrumbItem };

/**
 * Builds breadcrumbs with agent workflow context.
 * Always starts with Agent Workflows, then adds agent workflow name (or Unassigned), then page-specific items.
 */
export function buildAgentWorkflowBreadcrumbs(
  agentWorkflowId: string | null | undefined,
  ...pageItems: BreadcrumbItem[]
): BreadcrumbItem[] {
  const id = agentWorkflowId || 'unassigned';

  return [
    { label: 'Agent Workflows', href: '/' },
    ...(id !== 'unassigned'
      ? [{ label: id, href: `/agent-workflow/${id}` }]
      : [{ label: 'Unassigned', href: '/agent-workflow/unassigned' }]),
    ...pageItems,
  ];
}

/**
 * Builds an agent-workflow-prefixed link path.
 * Ensures agentWorkflowId is never undefined/null in the URL.
 */
export function agentWorkflowLink(agentWorkflowId: string | null | undefined, path: string): string {
  return `/agent-workflow/${agentWorkflowId || 'unassigned'}${path}`;
}

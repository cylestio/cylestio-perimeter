import type { BreadcrumbItem } from '@ui/navigation/Breadcrumb';

export type { BreadcrumbItem };

/**
 * Builds breadcrumbs with workflow context.
 * Always starts with Workflows, then adds workflow name (or Unassigned), then page-specific items.
 */
export function buildWorkflowBreadcrumbs(
  workflowId: string | null | undefined,
  ...pageItems: BreadcrumbItem[]
): BreadcrumbItem[] {
  const id = workflowId || 'unassigned';

  return [
    { label: 'Workflows', href: '/' },
    ...(id !== 'unassigned'
      ? [{ label: id, href: `/workflow/${id}` }]
      : [{ label: 'Unassigned', href: '/workflow/unassigned' }]),
    ...pageItems,
  ];
}

/**
 * Builds a workflow-prefixed link path.
 * Ensures workflowId is never undefined/null in the URL.
 */
export function workflowLink(workflowId: string | null | undefined, path: string): string {
  return `/workflow/${workflowId || 'unassigned'}${path}`;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Builds breadcrumbs with workflow context.
 * Always starts with Portfolio, then adds workflow (or Unassigned), then page-specific items.
 */
export function buildWorkflowBreadcrumbs(
  workflowId: string | undefined,
  ...pageItems: BreadcrumbItem[]
): BreadcrumbItem[] {
  const wfId = workflowId || 'unassigned';

  return [
    { label: 'Portfolio', href: '/' },
    ...(wfId !== 'unassigned'
      ? [{ label: 'Workflow', href: `/workflow/${wfId}` }]
      : [{ label: 'Unassigned', href: '/workflow/unassigned' }]),
    ...pageItems,
  ];
}

/**
 * Builds a workflow-prefixed link path.
 * Ensures workflowId is never undefined in the URL.
 */
export function workflowLink(workflowId: string | undefined, path: string): string {
  return `/workflow/${workflowId || 'unassigned'}${path}`;
}

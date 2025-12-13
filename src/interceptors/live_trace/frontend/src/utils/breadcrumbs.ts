export interface BreadcrumbItem {
  label: string;
  to?: string;
  href?: string;
}

/**
 * Build breadcrumbs for agent pages
 * @param agentId - The agent ID (or null/undefined for unassigned)
 * @param additionalCrumbs - Additional breadcrumb items to append after the agent
 */
export const buildAgentBreadcrumbs = (
  agentId: string | null | undefined,
  ...additionalCrumbs: BreadcrumbItem[]
): BreadcrumbItem[] => {
  const crumbs: BreadcrumbItem[] = [
    { label: 'Agents', to: '/' },
  ];
  
  if (agentId && agentId !== 'unassigned') {
    crumbs.push({
      label: agentId,
      to: `/agent/${agentId}`,
    });
  } else {
    crumbs.push({
      label: 'Unassigned',
      to: '/agent/unassigned',
    });
  }
  
  // Append any additional breadcrumb items
  crumbs.push(...additionalCrumbs);
  
  return crumbs;
};

/**
 * Generate link to agent page with optional path suffix
 * @param agentId - The agent ID (or null/undefined for unassigned)
 * @param path - Optional additional path to append (e.g., '/system-prompt/xyz')
 */
export const agentLink = (agentId: string | null | undefined, path?: string): string => {
  const basePath = agentId && agentId !== 'unassigned' 
    ? `/agent/${agentId}` 
    : '/agent/unassigned';
  return path ? `${basePath}${path}` : basePath;
};

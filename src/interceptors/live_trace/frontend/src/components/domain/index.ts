// Domain Components - AI security monitoring specific
// These are specific to the Cylestio product domain

export * from './layout';
export * from './metrics';
export * from './activity';
export * from './analysis';
export * from './findings';
export * from './recommendations';
export * from './security';
export * from './sessions';
export * from './visualization';
export * from './dynamic';

// System prompt components (for selecting and displaying system prompts within an agent)
// Previously called "agents" - keeping that folder name for now
export {
  AgentCard as SystemPromptCard,
  type AgentCardProps as SystemPromptCardProps,
  AgentListItem as SystemPromptListItem,
  type AgentListItemProps as SystemPromptListItemProps,
  AgentSelector as SystemPromptSelector,
  type AgentSelectorProps as SystemPromptSelectorProps,
  type Agent as SystemPrompt,
  ModeIndicators,
  type ModeIndicatorsProps,
} from './agents';

// Agent selector (for selecting top-level agents)
// Previously called "workflows" - these are now the primary agent components
export {
  WorkflowSelector as AgentSelector,
  type WorkflowSelectorProps as AgentSelectorProps,
  type Workflow as Agent,
  WorkflowCard as AgentCard,
  type WorkflowCardProps as AgentCardProps,
} from './workflows';

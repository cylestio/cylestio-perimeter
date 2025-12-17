import { useState, useCallback } from 'react';
import type { FC } from 'react';
import { Wrench, Copy, Check, ExternalLink, Terminal } from 'lucide-react';

import {
  ActionCardWrapper,
  ActionIcon,
  ActionContent,
  ActionTitle,
  ActionCommand,
  ActionDescription,
  CopyButton,
  ViewRecommendationLink,
} from './FixActionCard.styles';

export type ConnectedIde = 'cursor' | 'claude-code' | null;

export interface FixActionCardProps {
  /** The recommendation ID to fix (e.g., "REC-001") */
  recommendationId: string;
  /** The finding ID this is linked to (optional) */
  findingId?: string;
  /** Currently connected IDE type */
  connectedIde?: ConnectedIde;
  /** Brief description of the fix */
  description?: string;
  /** URL to the recommendation detail page */
  recommendationUrl?: string;
  /** Callback when copy is successful */
  onCopy?: (command: string) => void;
  className?: string;
}

/**
 * FixActionCard displays a "Fix with Cursor/IDE" action card
 * with a copy-able command for fixing a security issue.
 */
export const FixActionCard: FC<FixActionCardProps> = ({
  recommendationId,
  connectedIde,
  description,
  recommendationUrl,
  onCopy,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate the fix command
  const fixCommand = `/fix ${recommendationId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fixCommand);
      setCopied(true);
      onCopy?.(fixCommand);
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [fixCommand, onCopy]);

  const ideName = connectedIde === 'cursor' 
    ? 'Cursor' 
    : connectedIde === 'claude-code' 
    ? 'Claude Code' 
    : 'IDE';

  return (
    <ActionCardWrapper className={className}>
      <ActionIcon>
        <Wrench size={16} />
      </ActionIcon>
      
      <ActionContent>
        <ActionTitle>Fix with {ideName}</ActionTitle>
        <ActionCommand title={fixCommand}>{fixCommand}</ActionCommand>
        {description && (
          <ActionDescription>{description}</ActionDescription>
        )}
        {recommendationUrl && (
          <ViewRecommendationLink href={recommendationUrl}>
            View Recommendation {recommendationId} <ExternalLink size={10} />
          </ViewRecommendationLink>
        )}
      </ActionContent>

      <CopyButton onClick={handleCopy} $copied={copied}>
        {copied ? (
          <>
            <Check size={12} />
            Copied!
          </>
        ) : (
          <>
            <Copy size={12} />
            Copy
          </>
        )}
      </CopyButton>
    </ActionCardWrapper>
  );
};

/**
 * Compact version for inline use within finding cards
 */
export interface FixActionInlineProps {
  recommendationId: string;
  className?: string;
}

export const FixActionInline: FC<FixActionInlineProps> = ({
  recommendationId,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const fixCommand = `/fix ${recommendationId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fixCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [fixCommand]);

  return (
    <CopyButton onClick={handleCopy} $copied={copied} className={className}>
      {copied ? (
        <>
          <Check size={12} />
          Copied!
        </>
      ) : (
        <>
          <Terminal size={12} />
          {fixCommand}
        </>
      )}
    </CopyButton>
  );
};

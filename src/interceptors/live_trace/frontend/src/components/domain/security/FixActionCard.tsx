import { useState, useCallback } from 'react';
import type { FC } from 'react';

import { Wrench, Copy, Check } from 'lucide-react';

import {
  ActionCardWrapper,
  ActionIcon,
  ActionContent,
  ActionTitle,
  ActionCommand,
  CopyButton,
  CopiedIndicator,
} from './FixActionCard.styles';

export type IdeType = 'cursor' | 'claude-code' | 'vscode' | null;

export interface FixActionCardProps {
  /** Recommendation ID (e.g., 'REC-001') */
  recommendationId: string;
  /** Connected IDE type, if any */
  connectedIde?: IdeType;
  /** Custom command override */
  customCommand?: string;
  /** Callback when command is copied */
  onCopy?: (command: string) => void;
  className?: string;
}

const getIdeName = (ide: IdeType | undefined): string => {
  switch (ide) {
    case 'cursor':
      return 'Cursor';
    case 'claude-code':
      return 'Claude Code';
    case 'vscode':
      return 'VS Code';
    default:
      return 'IDE';
  }
};

/**
 * FixActionCard - Action card for fixing security issues with IDE
 * 
 * Shows:
 * - Fix icon and title
 * - Copy-able command for the IDE
 * - Copy button with feedback
 */
export const FixActionCard: FC<FixActionCardProps> = ({
  recommendationId,
  connectedIde,
  customCommand,
  onCopy,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const command = customCommand || `Fix security issue ${recommendationId}`;
  const ideName = getIdeName(connectedIde);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      onCopy?.(command);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [command, onCopy]);

  return (
    <ActionCardWrapper className={className}>
      <ActionIcon>
        <Wrench size={18} />
      </ActionIcon>
      <ActionContent>
        <ActionTitle>Fix with {ideName}</ActionTitle>
        <ActionCommand title={command}>{command}</ActionCommand>
      </ActionContent>
      {copied ? (
        <CopiedIndicator>
          <Check size={14} />
          Copied!
        </CopiedIndicator>
      ) : (
        <CopyButton onClick={handleCopy}>
          <Copy size={12} />
          Copy
        </CopyButton>
      )}
    </ActionCardWrapper>
  );
};

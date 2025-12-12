import { useState, type FC } from 'react';

import { Check, Copy, Search } from 'lucide-react';

import {
  HintCard,
  HintIcon,
  HintContent,
  HintTitle,
  HintCommand,
  CopyButton,
  IdeBadge,
} from './InvestigateHint.styles';

export interface OutlierInfo {
  id: string;
  session_id: string;
}

export interface InvestigateHintProps {
  outlier?: OutlierInfo;
  connectedIde?: 'cursor' | 'claude-code';
  className?: string;
}

/**
 * InvestigateHint - Shows IDE-aware hints for investigating security issues
 * 
 * Shows:
 * - Icon indicating investigation action
 * - IDE-specific command hint
 * - Copy button to copy the command
 */
export const InvestigateHint: FC<InvestigateHintProps> = ({
  outlier,
  connectedIde,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const ideName = connectedIde === 'cursor' ? 'Cursor' : 
                  connectedIde === 'claude-code' ? 'Claude Code' : 
                  'IDE';

  const command = outlier 
    ? `Investigate outlier session ${outlier.session_id.slice(0, 8)}` 
    : 'Investigate security issues';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <HintCard className={className} data-testid="investigate-hint">
      <HintIcon>
        <Search />
      </HintIcon>
      <HintContent>
        <HintTitle>
          Investigate with {ideName}
          {connectedIde && <IdeBadge>{connectedIde}</IdeBadge>}
        </HintTitle>
        <HintCommand title={command}>
          In {ideName}: "{command}"
        </HintCommand>
      </HintContent>
      <CopyButton onClick={handleCopy} title={copied ? 'Copied!' : 'Copy command'}>
        {copied ? <Check /> : <Copy />}
      </CopyButton>
    </HintCard>
  );
};

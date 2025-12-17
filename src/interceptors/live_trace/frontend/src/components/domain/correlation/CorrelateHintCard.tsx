import { useState, type FC } from 'react';
import { Copy, Check, Lightbulb } from 'lucide-react';

import {
  HintCard,
  HintIconWrapper,
  HintContent,
  HintTitle,
  HintDescription,
  HintCommand,
  CommandCode,
  CopyButton,
  IdeBadge,
  OrText,
} from './CorrelateHintCard.styles';

export interface CorrelateHintCardProps {
  /** Number of static findings available for correlation */
  staticFindingsCount: number;
  /** Number of dynamic sessions available for correlation */
  dynamicSessionsCount: number;
  /** Currently connected IDE, if any */
  connectedIde?: 'cursor' | 'claude-code';
  /** Optional className for styling */
  className?: string;
}

/**
 * CorrelateHintCard displays a hint card suggesting correlation
 * when both static and dynamic data exist.
 */
export const CorrelateHintCard: FC<CorrelateHintCardProps> = ({
  staticFindingsCount,
  dynamicSessionsCount,
  connectedIde,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const command = '/correlate';
  const fullCommand = 'Correlate my static findings with runtime data';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const ideName = connectedIde === 'claude-code' ? 'Claude Code' : 'Cursor';

  return (
    <HintCard className={className}>
      <HintIconWrapper><Lightbulb size={18} /></HintIconWrapper>
      <HintContent>
        <HintTitle>Correlate Your Findings</HintTitle>
        <HintDescription>
          You have <strong>{staticFindingsCount}</strong> static finding{staticFindingsCount !== 1 ? 's' : ''} and{' '}
          <strong>{dynamicSessionsCount}</strong> runtime session{dynamicSessionsCount !== 1 ? 's' : ''}.
          Correlation helps prioritize which issues are actively triggered at runtime.
        </HintDescription>
        <HintCommand>
          <IdeBadge>In {ideName}</IdeBadge>
          <span>Type:</span>
          <CommandCode>{command}</CommandCode>
          <OrText>or</OrText>
          <CommandCode>{fullCommand}</CommandCode>
        </HintCommand>
      </HintContent>
      <CopyButton onClick={handleCopy} title="Copy command">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </CopyButton>
    </HintCard>
  );
};

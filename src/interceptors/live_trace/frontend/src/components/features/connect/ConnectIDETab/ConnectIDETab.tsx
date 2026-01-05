import type { FC } from 'react';
import { useState } from 'react';

import { Copy, Check } from 'lucide-react';

import { Button } from '@ui/core/Button';
import { Text } from '@ui/core/Text';
import { CursorIcon } from '@ui/icons/CursorIcon';
import { ClaudeCodeIcon } from '@ui/icons/ClaudeCodeIcon';

import {
  IDESection,
  IDEInstructionBlock,
  IDEHeader,
  IDETitle,
  CommandList,
  CommandBlock,
  CommandNumber,
  CommandText,
} from './ConnectIDETab.styles';

const CURSOR_COMMAND =
  'Fetch and follow instructions from https://raw.githubusercontent.com/cylestio/agent-inspector/main/integrations/AGENT_INSPECTOR_SETUP.md';

const CLAUDE_CODE_COMMANDS = [
  '/plugin marketplace add cylestio/agent-inspector',
  '/plugin install agent-inspector@cylestio',
];

export interface ConnectIDETabProps {
  className?: string;
}

export const ConnectIDETab: FC<ConnectIDETabProps> = ({ className }) => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const handleCopy = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <IDESection className={className}>
      {/* Cursor Instructions */}
      <IDEInstructionBlock>
        <IDEHeader>
          <CursorIcon size={24} />
          <IDETitle>Cursor</IDETitle>
        </IDEHeader>
        <Text size="sm" color="muted">
          Run this command in Cursor:
        </Text>
        <CommandBlock>
          <CommandText>{CURSOR_COMMAND}</CommandText>
          <Button
            variant={copiedCommand === CURSOR_COMMAND ? 'success' : 'ghost'}
            size="sm"
            icon={
              copiedCommand === CURSOR_COMMAND ? (
                <Check size={14} />
              ) : (
                <Copy size={14} />
              )
            }
            onClick={() => handleCopy(CURSOR_COMMAND)}
          />
        </CommandBlock>
      </IDEInstructionBlock>

      {/* Claude Code Instructions */}
      <IDEInstructionBlock>
        <IDEHeader>
          <ClaudeCodeIcon size={24} />
          <IDETitle>Claude Code</IDETitle>
        </IDEHeader>
        <Text size="sm" color="muted">
          Run these commands in Claude Code:
        </Text>
        <CommandList>
          {CLAUDE_CODE_COMMANDS.map((cmd, index) => (
            <CommandBlock key={cmd}>
              <CommandNumber>{index + 1}</CommandNumber>
              <CommandText>{cmd}</CommandText>
              <Button
                variant={copiedCommand === cmd ? 'success' : 'ghost'}
                size="sm"
                icon={
                  copiedCommand === cmd ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )
                }
                onClick={() => handleCopy(cmd)}
              />
            </CommandBlock>
          ))}
        </CommandList>
      </IDEInstructionBlock>
    </IDESection>
  );
};

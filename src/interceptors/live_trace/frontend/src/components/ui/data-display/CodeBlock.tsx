import type { FC, ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import {
  CodeContainer,
  CodeHeader,
  Filename,
  Language,
  HeaderActions,
  CopyButton,
  CodeContent,
  CodeLine,
  LineNumber,
  LineContent,
} from './CodeBlock.styles';

// Types
export interface CodeLineData {
  number?: number;
  content: string;
  highlight?: boolean;
  added?: boolean;
  removed?: boolean;
}

export interface CodeBlockProps {
  filename?: string;
  language?: string;
  lines: CodeLineData[];
  showLineNumbers?: boolean;
  maxHeight?: string;
  actions?: ReactNode;
}

// Component
export const CodeBlock: FC<CodeBlockProps> = ({
  filename,
  language,
  lines,
  showLineNumbers = false,
  maxHeight,
  actions,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const code = lines.map((line) => line.content).join('\n');
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showHeader = filename || language || actions;

  return (
    <CodeContainer>
      {showHeader && (
        <CodeHeader>
          <div>
            {filename && <Filename>{filename}</Filename>}
            {language && <Language>{language}</Language>}
          </div>
          <HeaderActions>
            {actions}
            <CopyButton
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy code'}
              aria-label={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </CopyButton>
          </HeaderActions>
        </CodeHeader>
      )}
      <CodeContent $maxHeight={maxHeight}>
        {lines.map((line, index) => (
          <CodeLine
            key={index}
            $highlight={line.highlight}
            $added={line.added}
            $removed={line.removed}
          >
            {showLineNumbers && (
              <LineNumber>{line.number ?? index + 1}</LineNumber>
            )}
            <LineContent $added={line.added} $removed={line.removed}>
              {line.content}
            </LineContent>
          </CodeLine>
        ))}
      </CodeContent>
    </CodeContainer>
  );
};

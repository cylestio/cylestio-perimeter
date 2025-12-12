import { useState, useEffect, type FC } from 'react';
import { JsonEditor as JsonEdit } from 'json-edit-react';

import {
  JsonEditorWrapper,
  JsonEditorLabel,
  JsonEditorContainer,
  JsonEditorEmpty,
  EmptyText,
  AddButton,
  ErrorContainer,
  ErrorTitle,
  ErrorMessage,
  FallbackTextarea,
} from './JsonEditor.styles';

// Custom dark theme matching the app's design system
// Colors from theme.ts
const customTheme = {
  displayName: 'Cylestio Dark',
  fragments: {
    edit: '#00f0ff', // cyan
  },
  styles: {
    container: {
      backgroundColor: '#1a1a24', // surface3
      fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, Consolas, monospace",
      fontSize: '12px',
      lineHeight: '1.5',
    },
    collection: {},
    collectionInner: {},
    collectionElement: {
      paddingTop: '2px',
      paddingBottom: '2px',
    },
    dropZone: {
      backgroundColor: 'rgba(0, 240, 255, 0.12)', // cyanSoft
    },
    property: {
      color: 'rgba(255, 255, 255, 0.90)', // white90
      fontWeight: '500',
    },
    bracket: {
      color: 'rgba(255, 255, 255, 0.50)', // white50
      fontWeight: '600',
    },
    itemCount: {
      color: 'rgba(255, 255, 255, 0.30)', // white30
      fontStyle: 'italic',
      fontSize: '11px',
    },
    string: '#00ff88', // green
    number: '#00f0ff', // cyan
    boolean: '#a855f7', // purple
    null: {
      color: 'rgba(255, 255, 255, 0.30)', // white30
      fontStyle: 'italic',
    },
    input: {
      color: '#ffffff', // white
      backgroundColor: '#22222e', // surface4
      border: '1px solid rgba(255, 255, 255, 0.20)', // borderStrong
      borderRadius: '6px',
      padding: '4px 8px',
      fontSize: '12px',
      outline: 'none',
    },
    inputHighlight: 'rgba(0, 240, 255, 0.12)', // cyanSoft
    error: {
      fontSize: '11px',
      color: '#ff4757', // red
      fontWeight: '500',
    },
    iconCollection: 'rgba(255, 255, 255, 0.50)', // white50
    iconEdit: '#00f0ff', // cyan
    iconDelete: '#ff4757', // red
    iconAdd: '#00ff88', // green
    iconCopy: 'rgba(255, 255, 255, 0.50)', // white50
    iconOk: '#00ff88', // green
    iconCancel: '#ff4757', // red
  },
};

// Types
export interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

// Component
export const JsonEditor: FC<JsonEditorProps> = ({
  value,
  onChange,
  label,
  placeholder,
  className,
}) => {
  const [jsonData, setJsonData] = useState<unknown>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      setJsonData(parsed);
      setParseError(null);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }, [value]);

  const handleSetData = (newData: unknown) => {
    setJsonData(newData);
    onChange(JSON.stringify(newData, null, 2));
  };

  if (parseError) {
    return (
      <JsonEditorWrapper className={className}>
        {label && <JsonEditorLabel>{label}</JsonEditorLabel>}
        <ErrorContainer>
          <ErrorTitle>Invalid JSON</ErrorTitle>
          <ErrorMessage>{parseError}</ErrorMessage>
          <FallbackTextarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder={placeholder}
          />
        </ErrorContainer>
      </JsonEditorWrapper>
    );
  }

  if (!jsonData || (Array.isArray(jsonData) && jsonData.length === 0)) {
    return (
      <JsonEditorWrapper className={className}>
        {label && <JsonEditorLabel>{label}</JsonEditorLabel>}
        <JsonEditorEmpty>
          <EmptyText>{placeholder || 'Empty array'}</EmptyText>
          <AddButton
            type="button"
            onClick={() => {
              const newData = Array.isArray(jsonData) ? [{ role: 'user', content: '' }] : {};
              setJsonData(newData);
              onChange(JSON.stringify(newData, null, 2));
            }}
          >
            + Add Item
          </AddButton>
        </JsonEditorEmpty>
      </JsonEditorWrapper>
    );
  }

  return (
    <JsonEditorWrapper className={className}>
      {label && <JsonEditorLabel>{label}</JsonEditorLabel>}
      <JsonEditorContainer>
        <JsonEdit
          data={jsonData}
          setData={handleSetData}
          collapse={2}
          theme={customTheme}
          rootFontSize={13}
          indent={3}
          minWidth={200}
          maxWidth="100%"
        />
      </JsonEditorContainer>
    </JsonEditorWrapper>
  );
};

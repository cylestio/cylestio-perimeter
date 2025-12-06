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

// Custom theme matching the app's design system
const customTheme = {
  displayName: 'Cylestio',
  fragments: {
    edit: '#0891b2',
  },
  styles: {
    container: {
      backgroundColor: '#ffffff',
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
      backgroundColor: '#dbeafe',
    },
    property: {
      color: '#1e293b',
      fontWeight: '500',
    },
    bracket: {
      color: '#64748b',
      fontWeight: '600',
    },
    itemCount: {
      color: '#94a3b8',
      fontStyle: 'italic',
      fontSize: '11px',
    },
    string: '#059669',
    number: '#0891b2',
    boolean: '#7c3aed',
    null: {
      color: '#94a3b8',
      fontStyle: 'italic',
    },
    input: {
      color: '#1e293b',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '12px',
      outline: 'none',
    },
    inputHighlight: '#dbeafe',
    error: {
      fontSize: '11px',
      color: '#dc2626',
      fontWeight: '500',
    },
    iconCollection: '#64748b',
    iconEdit: '#0891b2',
    iconDelete: '#dc2626',
    iconAdd: '#059669',
    iconCopy: '#64748b',
    iconOk: '#059669',
    iconCancel: '#dc2626',
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

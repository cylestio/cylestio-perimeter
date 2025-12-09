import type { FC } from 'react';

import { HardDrive, Database } from 'lucide-react';

import { Code } from '@ui/core/Code';
import { Text } from '@ui/core/Text';
import { Tooltip } from '@ui/overlays/Tooltip';

import {
  LocalModeContainer,
  LocalModeIcon,
  LocalModeInfo,
  StorageBadge,
  TooltipPath,
} from './LocalModeIndicator.styles';

export type StorageMode = 'memory' | 'sqlite';

export interface LocalModeIndicatorProps {
  collapsed?: boolean;
  /** Storage mode: 'memory' or 'sqlite' */
  storageMode?: StorageMode;
  /** Path when storageMode is 'sqlite' (optional) */
  storagePath?: string;
}

export const LocalModeIndicator: FC<LocalModeIndicatorProps> = ({
  collapsed = false,
  storageMode = 'memory',
  storagePath,
}) => {
  const isInMemory = storageMode === 'memory';
  const storageLabel = isInMemory ? 'In-memory' : 'Saved to disk';

  const tooltipContent = isInMemory ? (
    'Running in local mode. Data is stored in memory only and will be lost on restart.'
  ) : (
    <div>
      <div>Running in local mode. Data is saved to:</div>
      <TooltipPath>
        <Code>{storagePath || 'local disk'}</Code>
      </TooltipPath>
    </div>
  );

  const indicator = (
    <LocalModeContainer $collapsed={collapsed}>
      <LocalModeIcon>
        <HardDrive size={16} />
      </LocalModeIcon>
      {!collapsed && (
        <LocalModeInfo>
          <Text size="sm" weight="medium">
            Local Mode
          </Text>
          <StorageBadge $mode={storageMode}>
            {isInMemory ? <Database size={10} /> : <HardDrive size={10} />}
            {storageLabel}
          </StorageBadge>
        </LocalModeInfo>
      )}
    </LocalModeContainer>
  );

  return (
    <Tooltip content={tooltipContent} position="right">
      {indicator}
    </Tooltip>
  );
};

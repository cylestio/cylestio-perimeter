import type { FC } from 'react';
import { HardDrive, Database } from 'lucide-react';
import { Text } from '@ui/core/Text';
import { Tooltip } from '@ui/overlays/Tooltip';
import {
  LocalModeContainer,
  LocalModeIcon,
  LocalModeInfo,
  StorageBadge,
} from './LocalModeIndicator.styles';

export type StorageMode = 'in-memory' | 'disk';

export interface LocalModeIndicatorProps {
  collapsed?: boolean;
  /** Storage mode: 'in-memory' or 'disk' */
  storageMode?: StorageMode;
  /** Path when storageMode is 'disk' (optional) */
  storagePath?: string;
}

export const LocalModeIndicator: FC<LocalModeIndicatorProps> = ({
  collapsed = false,
  storageMode = 'in-memory',
  storagePath,
}) => {
  const isInMemory = storageMode === 'in-memory';
  const storageLabel = isInMemory ? 'In-memory' : 'Saved to disk';

  const tooltipContent = isInMemory
    ? 'Running in local mode. Data is stored in memory only and will be lost on restart.'
    : `Running in local mode. Data is saved to: ${storagePath || 'local disk'}`;

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

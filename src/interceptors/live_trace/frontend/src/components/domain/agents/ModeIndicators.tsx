import type { FC } from 'react';
import { ModePill } from '@ui/core/Badge';
import { ModeIndicatorsContainer } from './ModeIndicators.styles';

// Types
export interface ModeIndicatorsProps {
  autoFix?: boolean;
  staticMode?: boolean;
  dynamicMode?: boolean;
  collapsed?: boolean;
}

// Component
export const ModeIndicators: FC<ModeIndicatorsProps> = ({
  autoFix = false,
  staticMode = false,
  dynamicMode = false,
  collapsed = false,
}) => {
  const hasActiveModes = autoFix || staticMode || dynamicMode;

  if (!hasActiveModes) {
    return null;
  }

  return (
    <ModeIndicatorsContainer $collapsed={collapsed}>
      {autoFix && <ModePill>{collapsed ? 'AF' : 'Auto-Fix'}</ModePill>}
      {staticMode && <ModePill>{collapsed ? 'S' : 'Static'}</ModePill>}
      {dynamicMode && <ModePill>{collapsed ? 'D' : 'Dynamic'}</ModePill>}
    </ModeIndicatorsContainer>
  );
};

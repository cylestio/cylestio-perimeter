import type { FC } from 'react';
import { LogoContainer, Orb, OrbInner, LogoText } from './Logo.styles';

// Types
export interface LogoProps {
  collapsed?: boolean;
  text?: string;
}

// Component
export const Logo: FC<LogoProps> = ({ collapsed = false, text = 'Agent Inspector' }) => {
  return (
    <LogoContainer $collapsed={collapsed}>
      <Orb>
        <OrbInner />
      </Orb>
      {!collapsed && <LogoText>{text}</LogoText>}
    </LogoContainer>
  );
};

import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { LogoContainer, Orb, OrbInner, LogoText } from './Logo.styles';

// Types
export interface LogoProps {
  collapsed?: boolean;
  text?: string;
}

// Component
export const Logo: FC<LogoProps> = ({ collapsed = false, text = 'Agent Inspector' }) => {
  return (
    <Link to="/" style={{ textDecoration: 'none' }}>
      <LogoContainer $collapsed={collapsed}>
        <Orb>
          <OrbInner />
        </Orb>
        {!collapsed && <LogoText>{text}</LogoText>}
      </LogoContainer>
    </Link>
  );
};

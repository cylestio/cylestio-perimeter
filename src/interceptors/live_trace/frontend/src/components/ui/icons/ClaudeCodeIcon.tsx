import type { FC, ImgHTMLAttributes } from 'react';
import claudeCodeLogo from '../../../assets/claude-code-logo.png';

interface ClaudeCodeIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  size?: number;
}

export const ClaudeCodeIcon: FC<ClaudeCodeIconProps> = ({ size = 24, style, ...props }) => (
  <img
    src={claudeCodeLogo}
    alt="Claude Code"
    width={size}
    height={size}
    style={{ objectFit: 'contain', ...style }}
    {...props}
  />
);

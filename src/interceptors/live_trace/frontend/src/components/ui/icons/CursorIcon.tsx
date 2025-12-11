import type { FC, ImgHTMLAttributes } from 'react';
import cursorLogo from '../../../assets/cursor-logo.png';

interface CursorIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  size?: number;
}

export const CursorIcon: FC<CursorIconProps> = ({ size = 24, style, ...props }) => (
  <img
    src={cursorLogo}
    alt="Cursor"
    width={size}
    height={size}
    style={{ objectFit: 'contain', ...style }}
    {...props}
  />
);

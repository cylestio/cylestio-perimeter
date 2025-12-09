import type { FC, ReactNode } from 'react';

import { Link } from 'react-router-dom';

import {
  BreadcrumbContainer,
  BreadcrumbLink,
  BreadcrumbCurrent,
  BreadcrumbSeparator,
} from './Breadcrumb.styles';

// Types
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

// Component
export const Breadcrumb: FC<BreadcrumbProps> = ({
  items,
  separator = '/',
  className,
}) => {
  return (
    <BreadcrumbContainer className={className}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLast ? (
              <BreadcrumbCurrent>{item.label}</BreadcrumbCurrent>
            ) : (
              <>
                {item.href ? (
                  <BreadcrumbLink as={Link} to={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbCurrent>{item.label}</BreadcrumbCurrent>
                )}
                <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
              </>
            )}
          </span>
        );
      })}
    </BreadcrumbContainer>
  );
};

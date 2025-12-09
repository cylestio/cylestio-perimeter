import type { FC, ReactNode } from 'react';

import {
  StyledSection,
  StyledSectionHeader,
  StyledSectionTitle,
  StyledSectionContent,
} from './Section.styles';

// Types
export interface SectionProps {
  children: ReactNode;
  className?: string;
}

export interface SectionHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface SectionTitleProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export interface SectionContentProps {
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
}

// ===========================================
// SECTION HEADER
// ===========================================

export const SectionHeader: FC<SectionHeaderProps> = ({ children, className }) => {
  return <StyledSectionHeader className={className}>{children}</StyledSectionHeader>;
};

// ===========================================
// SECTION TITLE
// ===========================================

export const SectionTitle: FC<SectionTitleProps> = ({ children, icon, className }) => {
  return (
    <StyledSectionTitle className={className}>
      {icon}
      {children}
    </StyledSectionTitle>
  );
};

// ===========================================
// SECTION CONTENT
// ===========================================

export const SectionContent: FC<SectionContentProps> = ({
  children,
  noPadding = false,
  className,
}) => {
  return (
    <StyledSectionContent $noPadding={noPadding} className={className}>
      {children}
    </StyledSectionContent>
  );
};

// ===========================================
// SECTION (Compound Component)
// ===========================================

interface SectionComponent extends FC<SectionProps> {
  Header: typeof SectionHeader;
  Title: typeof SectionTitle;
  Content: typeof SectionContent;
}

export const Section: SectionComponent = ({ children, className }) => {
  return <StyledSection className={className}>{children}</StyledSection>;
};

// Attach subcomponents
Section.Header = SectionHeader;
Section.Title = SectionTitle;
Section.Content = SectionContent;

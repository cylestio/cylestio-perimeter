import type { FC, ReactNode } from 'react';
import {
  StyledPageHeader,
  HeaderContent,
  PageTitle,
  PageDescription,
  ActionsContainer,
} from './PageHeader.styles';

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional page description */
  description?: string;
  /** Optional actions (buttons, filters) displayed on the right side */
  actions?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, description, actions }) => {
  const hasActions = Boolean(actions);

  return (
    <StyledPageHeader $hasActions={hasActions}>
      <HeaderContent>
        <PageTitle>{title}</PageTitle>
        {description && <PageDescription>{description}</PageDescription>}
      </HeaderContent>
      {actions && <ActionsContainer>{actions}</ActionsContainer>}
    </StyledPageHeader>
  );
};

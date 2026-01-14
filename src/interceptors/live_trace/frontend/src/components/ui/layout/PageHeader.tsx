import type { FC, ReactNode } from 'react';
import {
  StyledPageHeader,
  HeaderContent,
  PageTitle,
  TitleContent,
  TitleIcon,
  TitleBadge,
  PageDescription,
  ActionsContainer,
} from './PageHeader.styles';

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional icon displayed before the title */
  icon?: ReactNode;
  /** Optional badge displayed after the title (e.g., "PRO") */
  badge?: string;
  /** Optional page description */
  description?: string;
  /** Optional actions (buttons, filters) displayed on the right side */
  actions?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, icon, badge, description, actions }) => {
  const hasActions = Boolean(actions);

  return (
    <StyledPageHeader $hasActions={hasActions}>
      <HeaderContent>
        <PageTitle>
          <TitleContent>
            {icon && <TitleIcon>{icon}</TitleIcon>}
            {title}
            {badge && <TitleBadge>{badge}</TitleBadge>}
          </TitleContent>
        </PageTitle>
        {description && <PageDescription>{description}</PageDescription>}
      </HeaderContent>
      {actions && <ActionsContainer>{actions}</ActionsContainer>}
    </StyledPageHeader>
  );
};

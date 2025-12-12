import type { FC, ReactNode } from 'react';
import {
  StyledPageHeader,
  HeaderContent,
  PageTitle,
  TitleContent,
  TitleIcon,
  PageDescription,
  ActionsContainer,
} from './PageHeader.styles';

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional icon displayed before the title */
  icon?: ReactNode;
  /** Optional page description */
  description?: string;
  /** Optional actions (buttons, filters) displayed on the right side */
  actions?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, icon, description, actions }) => {
  const hasActions = Boolean(actions);

  return (
    <StyledPageHeader $hasActions={hasActions}>
      <HeaderContent>
        <PageTitle>
          {icon ? (
            <TitleContent>
              <TitleIcon>{icon}</TitleIcon>
              {title}
            </TitleContent>
          ) : (
            title
          )}
        </PageTitle>
        {description && <PageDescription>{description}</PageDescription>}
      </HeaderContent>
      {actions && <ActionsContainer>{actions}</ActionsContainer>}
    </StyledPageHeader>
  );
};

import type { FC } from 'react';

import {
  Check,
  X,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from 'lucide-react';

import type { DynamicSecurityCheck, DynamicCategoryId } from '@api/types/security';
import { DYNAMIC_CATEGORY_ICONS } from '@constants/securityChecks';

import {
  ItemWrapper,
  StatusIconContainer,
  ContentContainer,
  TitleRow,
  CheckTitle,
  ValueText,
  DescriptionText,
  StatusBadge,
  CategoryBadge,
  RightSection,
  ChevronIcon,
} from './DynamicCheckItem.styles';

// Types
export interface DynamicCheckItemProps {
  /** The security check data */
  check: DynamicSecurityCheck;
  /** Display variant */
  variant?: 'compact' | 'detailed';
  /** Whether clicking opens detail view */
  clickable?: boolean;
  /** Show category badge */
  showCategory?: boolean;
  /** Show description text */
  showDescription?: boolean;
  /** Click handler */
  onClick?: (check: DynamicSecurityCheck) => void;
  /** Additional class name */
  className?: string;
}

// Get status icon
const getStatusIcon = (status: DynamicSecurityCheck['status'], size = 14) => {
  switch (status) {
    case 'passed':
      return <Check size={size} strokeWidth={2.5} />;
    case 'warning':
      return <AlertTriangle size={size} />;
    case 'critical':
      return <X size={size} strokeWidth={2.5} />;
    case 'analyzing':
      return <Loader2 size={size} />;
    default:
      return null;
  }
};

// Get status label
const getStatusLabel = (status: DynamicSecurityCheck['status']): string => {
  switch (status) {
    case 'passed':
      return 'OK';
    case 'warning':
      return 'WARN';
    case 'critical':
      return 'FAIL';
    case 'analyzing':
      return 'ANALYZING';
    default:
      return '';
  }
};

/**
 * DynamicCheckItem displays a single dynamic security check
 * with status indicator, name, and optional details.
 *
 * Variants:
 * - compact: Single line, minimal info (for lists)
 * - detailed: Multi-line with description (for cards)
 */
export const DynamicCheckItem: FC<DynamicCheckItemProps> = ({
  check,
  variant = 'compact',
  clickable = false,
  showCategory = false,
  showDescription = false,
  onClick,
  className,
}) => {
  const isAnalyzing = check.status === 'analyzing';
  const CategoryIcon = DYNAMIC_CATEGORY_ICONS[check.category_id as DynamicCategoryId];

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(check);
    }
  };

  return (
    <ItemWrapper
      $status={check.status}
      $clickable={clickable}
      $variant={variant}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      className={className}
    >
      <StatusIconContainer $status={check.status} $isAnalyzing={isAnalyzing}>
        {getStatusIcon(check.status)}
      </StatusIconContainer>

      <ContentContainer>
        <TitleRow>
          <CheckTitle>{check.title}</CheckTitle>
          {check.value && <ValueText>{check.value}</ValueText>}
        </TitleRow>

        {variant === 'detailed' && showDescription && check.description && (
          <DescriptionText>{check.description}</DescriptionText>
        )}
      </ContentContainer>

      <RightSection>
        {showCategory && CategoryIcon && (
          <CategoryBadge $categoryId={check.category_id}>
            <CategoryIcon size={10} />
          </CategoryBadge>
        )}

        <StatusBadge $status={check.status}>{getStatusLabel(check.status)}</StatusBadge>

        {clickable && (
          <ChevronIcon>
            <ChevronRight size={16} />
          </ChevronIcon>
        )}
      </RightSection>
    </ItemWrapper>
  );
};

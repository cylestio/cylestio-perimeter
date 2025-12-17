import type { FC } from 'react';
import { Lock, Unlock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

import { Badge } from '@ui/core/Badge';
import { Button } from '@ui/core/Button';

import {
  GateCard,
  GateHeader,
  GateIcon,
  GateContent,
  GateTitle,
  GateDescription,
  BlockingList,
  BlockingItemRow,
  BlockingItemInfo,
  BlockingItemTitle,
  BlockingItemMeta,
  FixButton,
  GateActions,
  SuccessMessage,
  SuccessItem,
  MoreItemsText,
} from './ProductionGateCard.styles';

// Types
export interface BlockingItem {
  recommendation_id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH';
  category: string;
  source_type: string;
  file_path?: string;
}

export interface ProductionGateCardProps {
  isBlocked: boolean;
  blockingCount: number;
  blockingCritical: number;
  blockingHigh: number;
  blockingItems?: BlockingItem[];
  onFixIssue?: (recommendationId: string) => void;
  onViewAll?: () => void;
}

// Component
export const ProductionGateCard: FC<ProductionGateCardProps> = ({
  isBlocked,
  blockingCount,
  blockingCritical,
  blockingHigh,
  blockingItems = [],
  onFixIssue,
  onViewAll,
}) => {
  if (!isBlocked) {
    return (
      <GateCard $isBlocked={false}>
        <GateHeader>
          <GateIcon $isBlocked={false}>
            <Unlock size={24} />
          </GateIcon>
          <GateContent>
            <GateTitle $isBlocked={false}>Production Ready</GateTitle>
            <GateDescription>
              All critical and high severity security issues have been addressed.
              Your agent workflow is cleared for production deployment.
            </GateDescription>
          </GateContent>
        </GateHeader>
        <SuccessMessage>
          <SuccessItem>
            <CheckCircle size={16} />
            All security gates passed
          </SuccessItem>
          <SuccessItem>
            <CheckCircle size={16} />
            No blocking issues remaining
          </SuccessItem>
        </SuccessMessage>
      </GateCard>
    );
  }

  const severityText = [];
  if (blockingCritical > 0) severityText.push(`${blockingCritical} critical`);
  if (blockingHigh > 0) severityText.push(`${blockingHigh} high`);

  return (
    <GateCard $isBlocked={true}>
      <GateHeader>
        <GateIcon $isBlocked={true}>
          <Lock size={24} />
        </GateIcon>
        <GateContent>
          <GateTitle $isBlocked={true}>Production Blocked</GateTitle>
          <GateDescription>
            Fix {blockingCount} issue{blockingCount !== 1 ? 's' : ''} ({severityText.join(' and ')}) to unlock production deployment.
          </GateDescription>
        </GateContent>
      </GateHeader>

      {blockingItems.length > 0 && (
        <BlockingList>
          {blockingItems.slice(0, 5).map((item) => (
            <BlockingItemRow key={item.recommendation_id}>
              <Badge variant={item.severity === 'CRITICAL' ? 'critical' : 'high'}>
                {item.severity}
              </Badge>
              <BlockingItemInfo>
                <BlockingItemTitle>{item.title}</BlockingItemTitle>
                <BlockingItemMeta>
                  {item.recommendation_id} • {item.category}
                  {item.file_path && ` • ${item.file_path}`}
                </BlockingItemMeta>
              </BlockingItemInfo>
              {onFixIssue && (
                <FixButton onClick={() => onFixIssue(item.recommendation_id)}>
                  Fix
                  <ArrowRight size={12} />
                </FixButton>
              )}
            </BlockingItemRow>
          ))}
          {blockingItems.length > 5 && (
            <MoreItemsText>
              +{blockingItems.length - 5} more blocking issues
            </MoreItemsText>
          )}
        </BlockingList>
      )}

      <GateActions>
        {onViewAll && (
          <Button variant="secondary" size="sm" onClick={onViewAll}>
            <AlertTriangle size={14} />
            View All Blocking Issues
          </Button>
        )}
      </GateActions>
    </GateCard>
  );
};

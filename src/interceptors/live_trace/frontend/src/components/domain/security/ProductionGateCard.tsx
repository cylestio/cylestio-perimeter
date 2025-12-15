import type { FC } from 'react';
import styled from 'styled-components';
import { Lock, Unlock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@ui/core/Badge';
import { Button } from '@ui/core/Button';

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

// Styled Components
const GateCard = styled.div<{ $isBlocked: boolean }>`
  background: ${({ $isBlocked, theme }) =>
    $isBlocked
      ? `linear-gradient(135deg, ${theme.colors.redSoft}, ${theme.colors.surface})`
      : `linear-gradient(135deg, ${theme.colors.greenSoft}, ${theme.colors.surface})`};
  border: 2px solid ${({ $isBlocked, theme }) =>
    $isBlocked ? theme.colors.red : theme.colors.green};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

const GateHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[5]};
`;

const GateIcon = styled.div<{ $isBlocked: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $isBlocked, theme }) =>
    $isBlocked ? theme.colors.red : theme.colors.green};
  color: white;
  flex-shrink: 0;
`;

const GateContent = styled.div`
  flex: 1;
`;

const GateTitle = styled.h3<{ $isBlocked: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $isBlocked, theme }) =>
    $isBlocked ? theme.colors.red : theme.colors.green};
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
`;

const GateDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
  line-height: 1.4;
`;

const BlockingList = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const BlockingItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.red}30;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const BlockingItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const BlockingItemTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BlockingItemMeta = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

const FixButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.cyan};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.cyanSoft};
    border-color: ${({ theme }) => theme.colors.cyan};
  }
`;

const GateActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface2};
`;

const SuccessMessage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.greenSoft}30;
`;

const SuccessItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.green};
`;

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
            <div style={{ fontSize: '12px', color: 'var(--color-white50)', textAlign: 'center' }}>
              +{blockingItems.length - 5} more blocking issues
            </div>
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

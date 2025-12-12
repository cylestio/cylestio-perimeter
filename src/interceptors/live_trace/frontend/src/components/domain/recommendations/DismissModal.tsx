import { useState } from 'react';
import type { FC } from 'react';
import { AlertTriangle, Ban } from 'lucide-react';

import { Modal } from '@ui/overlays/Modal';
import { Button } from '@ui/core/Button';
import { Radio } from '@ui/form/Radio';
import { TextArea } from '@ui/form/TextArea';

import {
  ModalContent,
  ModalDescription,
  DismissTypeSection,
  SectionLabel,
  DismissOption,
  OptionContent,
  OptionTitle,
  OptionDescription,
  ReasonSection,
  RequiredNote,
  ModalActions,
} from './DismissModal.styles';

export type DismissType = 'DISMISSED' | 'IGNORED';

export interface DismissModalProps {
  open: boolean;
  recommendationId: string;
  recommendationTitle?: string;
  onConfirm: (type: DismissType, reason: string) => void;
  onCancel: () => void;
}

/**
 * DismissModal - Modal for dismissing recommendations with reason
 * 
 * CISO requirement: dismissals must have reasons logged for audit trail.
 * 
 * Options:
 * - DISMISSED: Risk Accepted - User understands the risk but won't fix it
 * - IGNORED: False Positive - Not actually a security issue
 */
export const DismissModal: FC<DismissModalProps> = ({
  open,
  recommendationId,
  recommendationTitle,
  onConfirm,
  onCancel,
}) => {
  const [dismissType, setDismissType] = useState<DismissType>('DISMISSED');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(dismissType, reason.trim());
      // Reset state
      setDismissType('DISMISSED');
      setReason('');
    }
  };

  const handleCancel = () => {
    setDismissType('DISMISSED');
    setReason('');
    onCancel();
  };

  const isValid = reason.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={`Dismiss ${recommendationId}`}
      size="md"
    >
      <ModalContent>
        <ModalDescription>
          {recommendationTitle && (
            <>
              <strong>{recommendationTitle}</strong>
              <br /><br />
            </>
          )}
          Choose how to dismiss this recommendation. A reason is required for audit compliance.
        </ModalDescription>

        <DismissTypeSection>
          <SectionLabel>Dismissal Type</SectionLabel>
          
          <DismissOption
            $selected={dismissType === 'DISMISSED'}
            onClick={() => setDismissType('DISMISSED')}
          >
            <Radio
              checked={dismissType === 'DISMISSED'}
              onChange={() => setDismissType('DISMISSED')}
            />
            <AlertTriangle size={20} style={{ color: '#f97316', marginTop: 2 }} />
            <OptionContent>
              <OptionTitle>Risk Accepted</OptionTitle>
              <OptionDescription>
                I understand the security risk but won't fix this issue now. 
                It will be tracked as an accepted risk.
              </OptionDescription>
            </OptionContent>
          </DismissOption>

          <DismissOption
            $selected={dismissType === 'IGNORED'}
            onClick={() => setDismissType('IGNORED')}
          >
            <Radio
              checked={dismissType === 'IGNORED'}
              onChange={() => setDismissType('IGNORED')}
            />
            <Ban size={20} style={{ color: '#6b7280', marginTop: 2 }} />
            <OptionContent>
              <OptionTitle>False Positive</OptionTitle>
              <OptionDescription>
                This is not actually a security issue in my context. 
                The scanner incorrectly flagged it.
              </OptionDescription>
            </OptionContent>
          </DismissOption>
        </DismissTypeSection>

        <ReasonSection>
          <TextArea
            label="Reason"
            placeholder="Explain why this is being dismissed (for audit trail)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            fullWidth
          />
          <RequiredNote>* Required for CISO compliance and audit trail</RequiredNote>
        </ReasonSection>

        <ModalActions>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!isValid}
          >
            Dismiss Recommendation
          </Button>
        </ModalActions>
      </ModalContent>
    </Modal>
  );
};


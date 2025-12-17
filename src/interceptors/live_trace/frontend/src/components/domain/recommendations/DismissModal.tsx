import { type FC, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info } from 'lucide-react';
import {
  Overlay,
  ModalContainer,
  ModalHeader,
  ModalIcon,
  ModalTitle,
  ModalSubtitle,
  ModalContent,
  RadioGroup,
  RadioOption,
  RadioInput,
  RadioContent,
  RadioTitle,
  RadioDescription,
  TextAreaLabel,
  TextArea,
  RequiredNote,
  ModalFooter,
  Button,
} from './DismissModal.styles';

export type DismissType = 'DISMISSED' | 'IGNORED';

export interface DismissModalProps {
  recommendationId: string;
  defaultType?: DismissType;
  onConfirm: (type: DismissType, reason: string) => void;
  onCancel: () => void;
}

export const DismissModal: FC<DismissModalProps> = ({
  recommendationId,
  defaultType = 'DISMISSED',
  onConfirm,
  onCancel,
}) => {
  const [type, setType] = useState<DismissType>(defaultType);
  const [reason, setReason] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = () => {
    if (reason.trim()) {
      onConfirm(type, reason.trim());
    }
  };

  const modalContent = (
    <Overlay onClick={onCancel}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalIcon>
            <AlertTriangle size={20} />
          </ModalIcon>
          <div>
            <ModalTitle>Dismiss Recommendation</ModalTitle>
            <ModalSubtitle>{recommendationId}</ModalSubtitle>
          </div>
        </ModalHeader>

        <ModalContent>
          <RadioGroup>
            <RadioOption $selected={type === 'DISMISSED'}>
              <RadioInput
                type="radio"
                name="dismissType"
                value="DISMISSED"
                checked={type === 'DISMISSED'}
                onChange={() => setType('DISMISSED')}
              />
              <RadioContent>
                <RadioTitle>Risk Accepted</RadioTitle>
                <RadioDescription>
                  I understand the security risk but have decided not to fix it. 
                  This will be logged for audit purposes.
                </RadioDescription>
              </RadioContent>
            </RadioOption>

            <RadioOption $selected={type === 'IGNORED'}>
              <RadioInput
                type="radio"
                name="dismissType"
                value="IGNORED"
                checked={type === 'IGNORED'}
                onChange={() => setType('IGNORED')}
              />
              <RadioContent>
                <RadioTitle>False Positive</RadioTitle>
                <RadioDescription>
                  This is not actually a security issue in my specific context 
                  (e.g., test code, internal tool, already mitigated).
                </RadioDescription>
              </RadioContent>
            </RadioOption>
          </RadioGroup>

          <TextAreaLabel htmlFor="dismiss-reason">
            Reason (required for compliance)
          </TextAreaLabel>
          <TextArea
            id="dismiss-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              type === 'DISMISSED'
                ? 'Explain why you are accepting this risk...\n\nExample: "Internal tool only, not exposed to external users. Risk is acceptable for MVP."'
                : 'Explain why this is not a real issue...\n\nExample: "This code is test fixtures only, never runs in production."'
            }
          />
          <RequiredNote>
            <Info size={12} />
            This reason will be included in compliance reports and audit logs.
          </RequiredNote>
        </ModalContent>

        <ModalFooter>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button
            $variant="danger"
            onClick={handleSubmit}
            disabled={!reason.trim()}
          >
            {type === 'DISMISSED' ? 'Accept Risk & Dismiss' : 'Mark as False Positive'}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );

  return createPortal(modalContent, document.body);
};

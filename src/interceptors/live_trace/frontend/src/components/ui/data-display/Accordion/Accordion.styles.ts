import styled from 'styled-components';

export const AccordionContainer = styled.details`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;

  &[open] > summary {
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  }
`;

export const AccordionSummary = styled.summary`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  user-select: none;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.white90};
    background: ${({ theme }) => theme.colors.surface3};
  }

  svg {
    flex-shrink: 0;
  }
`;

export const AccordionContent = styled.div`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white90};
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

export const ChevronIcon = styled.span<{ $open?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  color: ${({ theme }) => theme.colors.white50};
`;

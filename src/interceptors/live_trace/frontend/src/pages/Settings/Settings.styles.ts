import styled from 'styled-components';
import { Heading } from '@ui/core/Heading';

export const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SettingsNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const NavItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ $active, theme }) => $active ? theme.colors.white08 : 'transparent'};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ $active, theme }) => $active ? theme.colors.white90 : theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.white04};
    color: ${({ theme }) => theme.colors.white70};
  }
`;

export const SettingsContent = styled.div``;

export const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const SectionTitle = styled(Heading).attrs({ level: 2, size: 'sm' })`
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const SectionDescription = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightNormal};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white50};
  margin-top: 0;
`;

export const FormGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

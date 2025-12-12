import styled from 'styled-components';

export const ReportTemplates = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const TemplateCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.cyan};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const TemplateIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.cyanSoft};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.cyan};
  flex-shrink: 0;
`;

export const TemplateContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const TemplateName = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const TemplateDescription = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  line-height: 1.4;
`;

export const GenerateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.cyan};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.void};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.white};
  }
`;

export const ReportsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ReportCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

export const ReportInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const ReportName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

export const ReportMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const ReportActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[12]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white30};

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.white70};
    margin: ${({ theme }) => theme.spacing[4]} 0 ${({ theme }) => theme.spacing[2]};
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.white50};
    margin: 0;
    max-width: 400px;
  }
`;

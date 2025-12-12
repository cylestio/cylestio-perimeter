import { useState, type FC, type ReactNode } from 'react';

import { ChevronDown } from 'lucide-react';

import {
  AccordionContainer,
  AccordionSummary,
  AccordionContent,
  ChevronIcon,
} from './Accordion.styles';

// Types
export interface AccordionProps {
  title: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

// Component
export const Accordion: FC<AccordionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <AccordionContainer open={isOpen} className={className}>
      <AccordionSummary onClick={handleToggle}>
        {icon}
        {title}
        <ChevronIcon $open={isOpen}>
          <ChevronDown size={14} />
        </ChevronIcon>
      </AccordionSummary>
      <AccordionContent>{children}</AccordionContent>
    </AccordionContainer>
  );
};

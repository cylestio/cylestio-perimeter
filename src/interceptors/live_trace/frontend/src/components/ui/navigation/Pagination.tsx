import type { FC } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
  PaginationContainer,
  PaginationButton,
  PageInfo,
} from './Pagination.styles';

// Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// Component
export const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  return (
    <PaginationContainer className={className}>
      <PaginationButton
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
        Previous
      </PaginationButton>

      <PageInfo>
        Page {currentPage} of {totalPages}
      </PageInfo>

      <PaginationButton
        onClick={handleNext}
        disabled={!canGoNext}
        aria-label="Next page"
      >
        Next
        <ChevronRight size={16} />
      </PaginationButton>
    </PaginationContainer>
  );
};


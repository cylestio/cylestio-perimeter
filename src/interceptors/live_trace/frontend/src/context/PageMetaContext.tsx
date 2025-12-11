import {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type FC,
  type ReactNode,
} from 'react';
import type { BreadcrumbItem } from '@ui/navigation/Breadcrumb';

// Types
export interface PageMeta {
  breadcrumbs?: BreadcrumbItem[];
  hide: boolean;
}

interface PageMetaContextValue {
  pageMeta: PageMeta;
  setPageMeta: (meta: Partial<PageMeta>) => void;
}

// Context
const PageMetaContext = createContext<PageMetaContextValue | null>(null);

// Provider
export const PageMetaProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [pageMeta, setPageMetaState] = useState<PageMeta>({ breadcrumbs: [], hide: false });

  const setPageMeta = useCallback((meta: Partial<PageMeta>) => {
    setPageMetaState((prev) => ({ ...prev, ...meta }));
  }, []);

  const contextValue = useMemo(
    () => ({ pageMeta, setPageMeta }),
    [pageMeta, setPageMeta]
  );

  return (
    <PageMetaContext.Provider value={contextValue}>
      {children}
    </PageMetaContext.Provider>
  );
};

// Hook for pages to set their metadata
export const usePageMeta = (meta: Partial<PageMeta>) => {
  const context = useContext(PageMetaContext);

  useEffect(() => {
    context?.setPageMeta(meta);
    // Reset breadcrumbs on unmount
    return () => context?.setPageMeta({ breadcrumbs: [], hide: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(meta)]);
};

// Hook for layout to read metadata
export const usePageMetaValue = () => {
  const context = useContext(PageMetaContext);
  return context?.pageMeta ?? { breadcrumbs: [], hide: false };
};

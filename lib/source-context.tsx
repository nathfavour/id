import { createContext, useContext, useState, useCallback } from 'react';
import { getAppOrigin } from './app-origin';

interface SourceContextType {
  source: string | null;
  setSource: (source: string | null) => void;
  getBackUrl: () => string;
}

const SourceContext = createContext<SourceContextType | undefined>(undefined);

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<string | null>(null);

  const getBackUrl = useCallback(() => {
    return source || getAppOrigin();
  }, [source]);

  return (
    <SourceContext.Provider value={{ source, setSource, getBackUrl }}>
      {children}
    </SourceContext.Provider>
  );
}

export function useSource() {
  const context = useContext(SourceContext);
  if (!context) {
    throw new Error('useSource must be used within SourceProvider');
  }
  return context;
}

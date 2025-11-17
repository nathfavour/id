import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAppOrigin } from './app-origin';

interface SourceContextType {
  source: string | null;
  setSource: (source: string | null) => void;
  getBackUrl: () => string | null;
}

const SourceContext = createContext<SourceContextType | undefined>(undefined);

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSource = localStorage.getItem('id_redirect_source');
      if (storedSource) {
        setSource(storedSource);
      }
      setIsInitialized(true);
    }
  }, []);

  const handleSetSource = useCallback((newSource: string | null) => {
    setSource(newSource);
    if (newSource) {
      localStorage.setItem('id_redirect_source', newSource);
    } else {
      localStorage.removeItem('id_redirect_source');
    }
  }, []);

  const getBackUrl = useCallback(() => {
    if (!source) {
      return null;
    }
    
    if (!source.startsWith('http://') && !source.startsWith('https://')) {
      return `https://${source}`;
    }
    
    return source;
  }, [source]);

  return (
    <SourceContext.Provider value={{ source, setSource: handleSetSource, getBackUrl }}>
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

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface DocumentMetadata {
  id: string;
  title: string;
  ownerId: string;
  collaboratorIds: string[];
  isPublic: boolean;
  shareCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document extends DocumentMetadata {
  content: string;
}

interface DocumentContextValue {
  documents: DocumentMetadata[];
  isLoading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  createDocument: (title: string) => Promise<Document>;
  getDocument: (id: string) => Promise<Document | null>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

interface DocumentProviderProps {
  children: ReactNode;
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Fetch from server
      // Mock data for now
      setDocuments([
        {
          id: 'doc-1',
          title: 'Getting Started',
          ownerId: 'user-1',
          collaboratorIds: [],
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDocument = useCallback(async (title: string): Promise<Document> => {
    // TODO: Create on server
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title,
      content: `# ${title}\n\nStart writing here...`,
      ownerId: 'user-1',
      collaboratorIds: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [...prev, newDoc]);
    return newDoc;
  }, []);

  const getDocument = useCallback(async (id: string): Promise<Document | null> => {
    // TODO: Fetch from server
    // First check if we already have it in memory
    let metadata = documents.find((d) => d.id === id);

    // If not found and documents haven't been loaded, use mock data
    // In a real app, this would fetch from the server
    if (!metadata && id === 'doc-1') {
      metadata = {
        id: 'doc-1',
        title: 'Getting Started',
        ownerId: 'user-1',
        collaboratorIds: [],
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Add to documents so subsequent calls find it
      setDocuments((prev) => {
        if (prev.find(d => d.id === id)) return prev;
        return [...prev, metadata!];
      });
    }

    if (!metadata) return null;
    return {
      ...metadata,
      content: `# ${metadata.title}\n\nThis is the content of the document.`,
    };
  }, [documents]);

  const updateDocument = useCallback(
    async (id: string, updates: Partial<Document>) => {
      // TODO: Update on server
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id
            ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
            : doc
        )
      );
    },
    []
  );

  const deleteDocument = useCallback(async (id: string) => {
    // TODO: Delete on server
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  const value: DocumentContextValue = {
    documents,
    isLoading,
    error,
    fetchDocuments,
    createDocument,
    getDocument,
    updateDocument,
    deleteDocument,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments(): DocumentContextValue {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}

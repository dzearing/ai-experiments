import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

export interface DocumentMetadata {
  id: string;
  title: string;
  ownerId: string;
  workspaceId?: string;
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
  fetchDocuments: (workspaceId?: string) => Promise<void>;
  createDocument: (title: string, workspaceId?: string) => Promise<Document>;
  getDocument: (id: string) => Promise<Document | null>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

interface DocumentProviderProps {
  children: ReactNode;
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (workspaceId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = workspaceId
        ? `${API_URL}/api/documents?workspaceId=${workspaceId}`
        : `${API_URL}/api/documents`;

      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createDocument = useCallback(
    async (title: string, workspaceId?: string): Promise<Document> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ title, workspaceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create document');
      }

      const document = await response.json();
      setDocuments((prev) => [document, ...prev]);
      return document;
    },
    [user]
  );

  const getDocument = useCallback(
    async (id: string): Promise<Document | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/documents/${id}`, {
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return null;
        }

        return await response.json();
      } catch {
        return null;
      }
    },
    [user]
  );

  const updateDocument = useCallback(
    async (id: string, updates: Partial<Document>): Promise<Document | null> => {
      if (!user) return null;

      try {
        const response = await fetch(`${API_URL}/api/documents/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          return null;
        }

        const document = await response.json();
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? document : d))
        );
        return document;
      } catch {
        return null;
      }
    },
    [user]
  );

  const deleteDocument = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await fetch(`${API_URL}/api/documents/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.id,
          },
        });

        if (!response.ok) {
          return false;
        }

        setDocuments((prev) => prev.filter((d) => d.id !== id));
        return true;
      } catch {
        return false;
      }
    },
    [user]
  );

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

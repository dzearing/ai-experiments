import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

export interface NetworkDocument {
  id: string;
  title: string;
  hostName: string;
  hostAvatarUrl: string;
  collaboratorCount: number;
  startedAt: string;
  address: string;
}

interface NetworkContextValue {
  networkDocuments: NetworkDocument[];
  isDiscovering: boolean;
  startDiscovery: () => void;
  stopDiscovery: () => void;
  joinDocument: (address: string) => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [networkDocuments, setNetworkDocuments] = useState<NetworkDocument[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const startDiscovery = useCallback(() => {
    setIsDiscovering(true);
    // TODO: Implement mDNS discovery via server
  }, []);

  const stopDiscovery = useCallback(() => {
    setIsDiscovering(false);
    setNetworkDocuments([]);
  }, []);

  const joinDocument = useCallback(async (address: string) => {
    // TODO: Connect to document via WebSocket
    console.log('Joining document at:', address);
  }, []);

  // Simulate network documents appearing (demo only)
  useEffect(() => {
    if (isDiscovering) {
      // Mock: simulate a document appearing after 2 seconds
      const timer = setTimeout(() => {
        setNetworkDocuments([
          {
            id: 'network-doc-1',
            title: 'Project Planning',
            hostName: 'John Doe',
            hostAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
            collaboratorCount: 3,
            startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            address: 'ws://192.168.1.100:3002/doc/network-doc-1',
          },
        ]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isDiscovering]);

  const value: NetworkContextValue = {
    networkDocuments,
    isDiscovering,
    startDiscovery,
    stopDiscovery,
    joinDocument,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

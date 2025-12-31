import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Avatar, Button, Card, Spinner, SplitPane, Table, Tabs, type TableColumn } from '@ui-kit/react';
import { useParams, useNavigate } from '@ui-kit/router';
import { RefreshIcon } from '@ui-kit/icons/RefreshIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { DIAGNOSTICS_WS_URL } from '../config';
import { ClaudeDiagnostics } from '../components/ClaudeDiagnostics';
import styles from './Diagnostics.module.css';

interface DiagnosticEvent {
  id: string;
  timestamp: number;
  type: string;
  roomName?: string;
  clientId?: number;
  details?: Record<string, unknown>;
}

interface RoomData {
  name: string;
  title: string | null;
  clientCount: number;
  docSize: number;
  clients: Array<{
    clientId: number;
    username: string | null;
    color: string;
    awarenessClientId: number | null;
  }>;
}

interface ClientData {
  clientId: number;
  username: string | null;
  roomName: string;
  color: string;
  awarenessClientId: number | null;
}

interface DiagnosticSnapshot {
  uptime: number;
  roomCount: number;
  clientCount: number;
  rooms: RoomData[];
  clients: ClientData[];
  events: DiagnosticEvent[];
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  server_start: '#22d3ee',
  server_stop: '#f43f5e',
  client_join: '#10b981',
  client_leave: '#ef4444',
  room_create: '#3b82f6',
  room_destroy: '#f59e0b',
  sync: '#8b5cf6',
  awareness: '#06b6d4',
  persist: '#84cc16',
};

/**
 * Overview tab content - the original diagnostics view
 */
function OverviewContent() {
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null);
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [displayUptime, setDisplayUptime] = useState<number>(0);
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(0);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const eventLogRef = useRef<HTMLDivElement>(null);
  const isAtTopRef = useRef(true);
  const serverStartTimeRef = useRef<number | null>(null);

  // Measure left pane width on mount and resize
  useEffect(() => {
    const measureWidth = () => {
      if (leftPaneRef.current) {
        setLeftPaneWidth(leftPaneRef.current.offsetWidth);
      }
    };
    measureWidth();
    const resizeObserver = new ResizeObserver(measureWidth);
    if (leftPaneRef.current) {
      resizeObserver.observe(leftPaneRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Determine if we have space for 2-column layout (needs ~700px minimum)
  const useTwoColumnLayout = leftPaneWidth >= 700;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(DIAGNOSTICS_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('[Diagnostics] Connected to server');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[Diagnostics] Disconnected from server');
      // Reconnect after 2 seconds
      setTimeout(connect, 2000);
    };

    ws.onerror = (error) => {
      console.error('[Diagnostics] WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'snapshot') {
          setSnapshot(message.data);
          setEvents(message.data.events || []);
          // Calculate server start time for dynamic uptime display
          serverStartTimeRef.current = Date.now() - message.data.uptime;
          setDisplayUptime(message.data.uptime);
        } else if (message.type === 'event') {
          setEvents((prev) => {
            const newEvents = [...prev, message.event];
            // Keep last 200 events
            if (newEvents.length > 200) {
              return newEvents.slice(-200);
            }
            return newEvents;
          });

          // Update snapshot with new rooms/clients data if provided
          setSnapshot((prev) => {
            if (!prev) return prev;

            // If the event includes rooms/clients data, use it
            if (message.rooms && message.clients) {
              return {
                ...prev,
                rooms: message.rooms,
                clients: message.clients,
                roomCount: message.rooms.length,
                clientCount: message.clients.length,
              };
            }

            return prev;
          });
        }
      } catch (error) {
        console.error('[Diagnostics] Failed to parse message:', error);
      }
    };
  }, []);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Track scroll position to know if user is at top
  const handleEventLogScroll = useCallback(() => {
    if (eventLogRef.current) {
      // At top when scrollTop is 0
      isAtTopRef.current = eventLogRef.current.scrollTop === 0;
    }
  }, []);

  // Auto-scroll to top only when user is already at top (streaming mode)
  useEffect(() => {
    if (isAtTopRef.current && eventLogRef.current) {
      eventLogRef.current.scrollTop = 0;
    }
  }, [events]);

  // Update uptime counter every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (serverStartTimeRef.current !== null) {
        setDisplayUptime(Date.now() - serverStartTimeRef.current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Request refresh
  const handleRefresh = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'refresh' }));
    }
  };

  // Clear events display
  const handleClearEvents = () => {
    setEvents([]);
  };

  // Filter and reverse events (newest first)
  const filteredEvents = (filterType === 'all'
    ? events
    : events.filter((e) => e.type === filterType)
  ).slice().reverse();

  // Document table columns
  const roomColumns: TableColumn<RoomData>[] = useMemo(() => [
    {
      id: 'title',
      header: 'Document',
      accessor: (room) => room.title || 'Untitled',
      cell: (value, room) => (
        <span className={styles.documentCell}>
          <span className={styles.documentTitle}>{value as string}</span>
          <span className={styles.documentId}>{room.name.slice(0, 8)}...</span>
        </span>
      ),
    },
    {
      id: 'clientCount',
      header: 'Editors',
      accessor: 'clientCount',
      width: 70,
      align: 'center',
    },
    {
      id: 'docSize',
      header: 'Size',
      accessor: (room) => formatBytes(room.docSize),
      width: 80,
      align: 'right',
    },
  ], []);

  // Create last activity lookup from events
  const lastActivityLookup = useMemo(() => {
    const lookup: Record<number, number> = {};
    for (const event of events) {
      if (event.clientId !== undefined) {
        // Keep the most recent timestamp for each client
        if (!lookup[event.clientId] || event.timestamp > lookup[event.clientId]) {
          lookup[event.clientId] = event.timestamp;
        }
      }
    }
    return lookup;
  }, [events]);

  // Format relative time (e.g., "2s ago", "5m ago")
  const formatRelativeTime = useCallback((timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, []);

  // Client table columns
  const clientColumns: TableColumn<ClientData>[] = useMemo(() => [
    {
      id: 'client',
      header: 'Client',
      accessor: (client) => client.username || `Client #${client.clientId}`,
      cell: (value, client) => (
        <span className={styles.clientInfo}>
          <Avatar
            size="xs"
            fallback={client.username || '?'}
            color={client.color}
          />
          {value as string}
        </span>
      ),
    },
    {
      id: 'clientId',
      header: 'ID',
      accessor: (client) => `#${client.clientId}`,
      width: 60,
    },
    {
      id: 'lastActive',
      header: 'Last Active',
      accessor: (client) => {
        const timestamp = lastActivityLookup[client.clientId];
        return timestamp ? formatRelativeTime(timestamp) : '-';
      },
      width: 100,
      align: 'right',
    },
  ], [lastActivityLookup, formatRelativeTime]);

  // Create room name to title lookup
  const roomTitleLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    if (snapshot?.rooms) {
      for (const room of snapshot.rooms) {
        lookup[room.name] = room.title || 'Untitled';
      }
    }
    return lookup;
  }, [snapshot?.rooms]);

  // Create client lookup for avatar/name display
  const clientLookup = useMemo(() => {
    const lookup: Record<number, { username: string | null; color: string }> = {};
    if (snapshot?.clients) {
      for (const client of snapshot.clients) {
        lookup[client.clientId] = { username: client.username, color: client.color };
      }
    }
    return lookup;
  }, [snapshot?.clients]);

  // Event table columns
  const eventColumns: TableColumn<DiagnosticEvent>[] = useMemo(() => [
    {
      id: 'time',
      header: 'Time',
      accessor: (event) => formatTime(event.timestamp),
      width: 90,
    },
    {
      id: 'type',
      header: 'Type',
      accessor: 'type',
      width: 120,
      cell: (value) => (
        <span style={{ color: EVENT_TYPE_COLORS[value as string] || '#888', fontWeight: 500 }}>
          {value as string}
        </span>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      accessor: (event) => {
        if (event.clientId === undefined) return '-';
        const client = clientLookup[event.clientId];
        return client?.username || `#${event.clientId}`;
      },
      cell: (value, event) => {
        if (event.clientId === undefined) return '-';
        const client = clientLookup[event.clientId];
        return (
          <span className={styles.clientInfo}>
            <Avatar
              size="xs"
              fallback={client?.username || '?'}
              color={client?.color || '#888'}
            />
            {value as string}
          </span>
        );
      },
      width: 120,
    },
    {
      id: 'room',
      header: 'Document',
      accessor: (event) => event.roomName ? (roomTitleLookup[event.roomName] || event.roomName.slice(0, 8) + '...') : '-',
    },
    {
      id: 'details',
      header: 'Details',
      accessor: (event) => event.details ? JSON.stringify(event.details) : '-',
    },
  ], [roomTitleLookup, clientLookup]);

  if (!snapshot) {
    return (
      <div className={styles.overviewContent}>
        <div className={styles.loading}>
          <Spinner size="lg" />
          <p>Connecting to diagnostics server...</p>
        </div>
      </div>
    );
  }

  // Left pane content: Header, Stats, Documents, Clients
  const leftPane = (
    <div ref={leftPaneRef} className={styles.leftPane}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Server Diagnostics</h1>
          <span className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <Button icon={<RefreshIcon />} variant="ghost" onClick={handleRefresh}>
          Refresh
        </Button>
      </header>

      {/* Stats Cards */}
      <section className={styles.stats}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{snapshot.clientCount}</div>
          <div className={styles.statLabel}>Editors</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{snapshot.roomCount}</div>
          <div className={styles.statLabel}>Documents</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{formatUptime(displayUptime)}</div>
          <div className={styles.statLabel}>Uptime</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{formatBytes(snapshot.memoryUsage.heapUsed)}</div>
          <div className={styles.statLabel}>Memory</div>
        </Card>
      </section>

      {/* Documents and Clients - responsive grid */}
      <section className={useTwoColumnLayout ? styles.gridTwoCol : styles.gridOneCol}>
        {/* Documents Table */}
        <Card className={styles.tableCard}>
          <h2>Active Documents ({snapshot.rooms.length})</h2>
          <div className={styles.tableWrapper}>
            <Table<RoomData>
              columns={roomColumns}
              data={snapshot.rooms}
              getRowKey={(room) => room.name}
              size="sm"
              striped
              emptyMessage="No active documents"
            />
          </div>
        </Card>

        {/* Clients Table */}
        <Card className={styles.tableCard}>
          <h2>Connected Clients ({snapshot.clients.length})</h2>
          <div className={styles.tableWrapper}>
            <Table<ClientData>
              columns={clientColumns}
              data={snapshot.clients}
              getRowKey={(client) => String(client.clientId)}
              size="sm"
              striped
              emptyMessage="No connected clients"
            />
          </div>
        </Card>
      </section>
    </div>
  );

  // Right pane content: Event Log
  const rightPane = (
    <div className={styles.rightPane}>
      <div className={styles.eventLogHeader}>
        <h2>Event Log ({filteredEvents.length})</h2>
        <div className={styles.eventLogControls}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Events</option>
            <option value="server_start">Server Start</option>
            <option value="server_stop">Server Stop</option>
            <option value="client_join">Client Join</option>
            <option value="client_leave">Client Leave</option>
            <option value="room_create">Room Create</option>
            <option value="room_destroy">Room Destroy</option>
            <option value="sync">Sync</option>
            <option value="awareness">Awareness</option>
            <option value="persist">Persist</option>
          </select>
          <Button
            icon={<TrashIcon />}
            variant="ghost"
            size="sm"
            onClick={handleClearEvents}
          >
            Clear
          </Button>
        </div>
      </div>
      <div
        ref={eventLogRef}
        className={styles.eventLog}
        onScroll={handleEventLogScroll}
      >
        <Table<DiagnosticEvent>
          columns={eventColumns}
          data={filteredEvents}
          getRowKey={(event) => event.id}
          size="sm"
          striped
          stickyHeader
          emptyMessage="No events to display"
        />
      </div>
    </div>
  );

  return (
    <div className={styles.overviewContent}>
      <SplitPane
        first={leftPane}
        second={rightPane}
        orientation="horizontal"
        defaultSize="33%"
        minSize={300}
        className={styles.splitPane}
      />
    </div>
  );
}

/**
 * Main Diagnostics page component with tabs.
 * Overview tab shows server diagnostics, Claude tab shows chat session diagnostics.
 */
export function Diagnostics() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  // Default to 'overview' if no tab specified
  const activeTab = tab === 'claude' ? 'claude' : 'overview';

  // Tab items without content - we render content separately
  const tabItems = [
    { value: 'overview', label: 'Overview', content: null },
    { value: 'claude', label: 'Claude', content: null },
  ];

  const handleTabChange = useCallback((newTab: string) => {
    // Use /diagnostics for overview (default), /diagnostics/claude for claude
    navigate(newTab === 'overview' ? '/diagnostics' : `/diagnostics/${newTab}`);
  }, [navigate]);

  return (
    <div className={styles.diagnostics}>
      {/* Page Header with centered tabs */}
      <header className={styles.pageHeader}>
        <h1>Diagnostics</h1>
        <Tabs
          items={tabItems}
          value={activeTab}
          onChange={handleTabChange}
          variant="underline"
          className={styles.headerTabs}
        />
      </header>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' ? <OverviewContent /> : <ClaudeDiagnostics />}
      </div>
    </div>
  );
}

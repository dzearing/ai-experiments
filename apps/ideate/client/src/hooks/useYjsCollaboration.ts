import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { getContrastingTextColor } from '@ui-kit/core';

/**
 * Convert an rgb/rgba color string to hex format.
 * E.g., "rgb(255, 128, 64)" -> "#ff8040"
 */
function rgbStringToHex(rgbStr: string): string | null {
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  const [, r, g, b] = match;
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(parseInt(r))}${toHex(parseInt(g))}${toHex(parseInt(b))}`;
}

/**
 * Fix a single cursor label element's styles.
 * Called immediately when yCollab creates or modifies the element.
 */
function fixCursorLabel(element: HTMLElement): void {
  // Skip if we're already fixing this element (prevent infinite loop)
  if (element.dataset.fixing === 'true') return;

  const bgColor = getComputedStyle(element).backgroundColor;
  const hex = rgbStringToHex(bgColor);
  if (hex) {
    // Mark as fixing to prevent re-entry
    element.dataset.fixing = 'true';

    // Apply all fixes as inline styles to override yCollab's inline styles
    element.style.setProperty('color', getContrastingTextColor(hex), 'important');
    element.style.setProperty('opacity', '1', 'important');
    element.style.setProperty('transition', 'none', 'important');
    element.style.setProperty('font-family', 'var(--font-sans)', 'important');
    element.style.setProperty('font-size', 'var(--text-sm)', 'important');
    element.style.setProperty('font-weight', '500', 'important');
    element.style.setProperty('top', 'auto', 'important');
    element.style.setProperty('left', '0', 'important');
    element.style.setProperty('bottom', '100%', 'important');

    // Clear the fixing flag after a microtask (allows mutation to complete)
    queueMicrotask(() => {
      delete element.dataset.fixing;
    });
  }
}

/**
 * Module-level MutationObserver for cursor label fixes.
 * Watches for yCollab creating/modifying cursor labels and immediately fixes them.
 */
let cursorObserver: MutationObserver | null = null;
let observerRefCount = 0;

function startCursorObserver(): void {
  observerRefCount++;
  if (cursorObserver) return; // Already running

  cursorObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Handle new nodes being added
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if the added node is a cursor label
            if (node.classList.contains('cm-ySelectionInfo')) {
              fixCursorLabel(node);
            }
            // Check children of the added node
            node.querySelectorAll<HTMLElement>('.cm-ySelectionInfo').forEach(fixCursorLabel);
          }
        });
      }
      // Handle attribute/style changes on existing cursor labels
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        if (mutation.target.classList.contains('cm-ySelectionInfo')) {
          fixCursorLabel(mutation.target);
        }
      }
    }
  });

  cursorObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  // Also fix any existing cursor labels
  document.querySelectorAll<HTMLElement>('.cm-ySelectionInfo').forEach(fixCursorLabel);
}

function stopCursorObserver(): void {
  observerRefCount--;
  if (observerRefCount <= 0 && cursorObserver) {
    cursorObserver.disconnect();
    cursorObserver = null;
    observerRefCount = 0;
  }
}

/**
 * Module-level cache for document instances.
 * This survives React StrictMode remounts and prevents creating duplicate connections.
 */
interface DocumentCache {
  doc: Y.Doc;
  text: Y.Text;
  undoManager: Y.UndoManager;
  wsProvider: WebsocketProvider | null;
  idbProvider: IndexeddbPersistence | null;
  refCount: number;
  cleanupTimeout: ReturnType<typeof setTimeout> | null;
}
const documentCache = new Map<string, DocumentCache>();

/**
 * Get or create a cached document instance.
 * Uses a cache key combining documentId and serverUrl to ensure proper isolation.
 * Note: This does NOT increment refCount - call acquireDocument for that.
 */
function getOrCreateDocument(documentId: string, serverUrl?: string): DocumentCache {
  const cacheKey = `${documentId}:${serverUrl || 'offline'}`;

  let cached = documentCache.get(cacheKey);
  if (cached) {
    // Cancel any pending cleanup (just to be safe)
    if (cached.cleanupTimeout) {
      clearTimeout(cached.cleanupTimeout);
      cached.cleanupTimeout = null;
    }
    return cached;
  }

  // Create new document with refCount 0 - caller must call acquireDocument
  const doc = new Y.Doc();
  const text = doc.getText('content');
  const undoManager = new Y.UndoManager(text);

  cached = {
    doc,
    text,
    undoManager,
    wsProvider: null,
    idbProvider: null,
    refCount: 0, // Start at 0, acquireDocument will increment
    cleanupTimeout: null,
  };

  documentCache.set(cacheKey, cached);
  return cached;
}

/**
 * Acquire a reference to a cached document.
 * Call this once per component mount, and releaseDocument on unmount.
 */
function acquireDocument(documentId: string, serverUrl?: string): void {
  const cacheKey = `${documentId}:${serverUrl || 'offline'}`;
  const cached = documentCache.get(cacheKey);
  if (cached) {
    // Cancel any pending cleanup (in case we're reacquiring during StrictMode remount)
    if (cached.cleanupTimeout) {
      clearTimeout(cached.cleanupTimeout);
      cached.cleanupTimeout = null;
    }
    cached.refCount++;
  }
}

/**
 * Release a reference to a cached document.
 * The document is destroyed after a delay if no new references are acquired.
 */
function releaseDocument(documentId: string, serverUrl?: string): void {
  const cacheKey = `${documentId}:${serverUrl || 'offline'}`;
  const cached = documentCache.get(cacheKey);

  if (!cached) return;

  cached.refCount--;

  if (cached.refCount <= 0) {
    // Schedule cleanup after a delay to survive StrictMode remounts
    cached.cleanupTimeout = setTimeout(() => {
      const current = documentCache.get(cacheKey);
      if (current && current.refCount <= 0) {
        if (current.wsProvider) {
          current.wsProvider.destroy();
        }
        if (current.idbProvider) {
          current.idbProvider.destroy();
        }
        current.doc.destroy();

        documentCache.delete(cacheKey);
      }
    }, 100); // Short delay to handle StrictMode unmount/remount
  }
}

/**
 * Co-author information for cursor display
 */
export interface CoAuthor {
  clientId: number;
  name: string;
  color: string;
  cursor?: {
    anchor: number;
    head: number;
  };
}

/**
 * Connection state for the WebSocket provider
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

/**
 * Options for the useYjsCollaboration hook
 */
export interface UseYjsCollaborationOptions {
  /** Unique document ID for collaboration */
  documentId: string;
  /** WebSocket server URL (e.g., ws://localhost:3002) */
  serverUrl?: string;
  /** Initial content to set if document is empty */
  initialContent?: string;
  /** Local user information for awareness */
  localUser?: {
    name: string;
    color: string;
  };
  /** Called when document content changes */
  onChange?: (content: string) => void;
  /** Called when connection state changes */
  onConnectionChange?: (state: ConnectionState) => void;
  /** Called when co-authors change */
  onCoAuthorsChange?: (coAuthors: CoAuthor[]) => void;
  /** Enable offline persistence with IndexedDB */
  enableOfflinePersistence?: boolean;
}

/**
 * Return value from useYjsCollaboration hook
 */
export interface UseYjsCollaborationResult {
  /** The Yjs document instance */
  doc: Y.Doc;
  /** The Y.Text instance for the document content */
  text: Y.Text;
  /** Awareness instance for cursor/presence */
  awareness: WebsocketProvider['awareness'] | null;
  /** Undo manager for local undo/redo */
  undoManager: Y.UndoManager;
  /** CodeMirror extensions for collaborative editing */
  extensions: Extension[];
  /** Current connection state */
  connectionState: ConnectionState;
  /** List of current co-authors */
  coAuthors: CoAuthor[];
  /** Whether the document is synced with server */
  isSynced: boolean;
  /** Get current document content */
  getContent: () => string;
  /** Insert text at position */
  insertAt: (position: number, content: string) => void;
  /** Delete text range */
  deleteRange: (start: number, length: number) => void;
  /** Replace all content */
  setContent: (content: string) => void;
  /** Manually connect to server */
  connect: () => void;
  /** Manually disconnect from server */
  disconnect: () => void;
}

/**
 * React hook for Yjs collaborative editing.
 *
 * Manages:
 * - Y.Doc lifecycle
 * - WebSocket connection via y-websocket
 * - Offline persistence via y-indexeddb
 * - Awareness (cursor positions, user presence)
 * - Undo/redo with Y.UndoManager
 */
export function useYjsCollaboration(
  options: UseYjsCollaborationOptions
): UseYjsCollaborationResult {
  const {
    documentId,
    serverUrl,
    initialContent,
    localUser,
    onChange,
    onConnectionChange,
    onCoAuthorsChange,
    enableOfflinePersistence = true,
  } = options;

  // Refs for callbacks and values - prevents effect re-runs when these change
  const onChangeRef = useRef(onChange);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const onCoAuthorsChangeRef = useRef(onCoAuthorsChange);
  // Ref for localUser to avoid stale closures in awareness handlers
  const localUserRef = useRef(localUser);
  // Ref for initialContent - only used once for offline-only mode initial setup
  const initialContentRef = useRef(initialContent);

  // Keep refs updated with latest values
  onChangeRef.current = onChange;
  onConnectionChangeRef.current = onConnectionChange;
  onCoAuthorsChangeRef.current = onCoAuthorsChange;
  localUserRef.current = localUser;
  // Note: We intentionally don't update initialContentRef after first render
  // because it's only used for initial document setup, not for re-syncing

  // Get or create cache entry - this is stable for the lifetime of the hook instance
  // useState initializer runs once per component mount, and survives StrictMode remounts
  const [cache] = useState(() => getOrCreateDocument(documentId, serverUrl));

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [extensions, setExtensions] = useState<Extension[]>([]);

  const { doc, text, undoManager } = cache;

  // Acquire and release cache reference - this runs once per mount
  useEffect(() => {
    acquireDocument(documentId, serverUrl);
    return () => {
      releaseDocument(documentId, serverUrl);
    };
  }, [documentId, serverUrl]);

  // Set up providers and observers
  useEffect(() => {
    // Start the MutationObserver for cursor label fixes
    startCursorObserver();

    // Track co-author update timeout for cleanup
    let coAuthorUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

    // Helper to update co-authors from awareness
    const updateCoAuthorsFromProvider = (wsProvider: WebsocketProvider, immediate = false) => {
      if (coAuthorUpdateTimeout) {
        clearTimeout(coAuthorUpdateTimeout);
      }

      const doUpdate = () => {
        const states = wsProvider.awareness.getStates();
        const authors: CoAuthor[] = [];
        // Track seen user names to deduplicate stale awareness states
        const seenNames = new Set<string>();

        states.forEach((state, clientId) => {
          if (clientId === wsProvider.awareness.clientID) return;
          if (!state.user) return;

          const name = state.user.name || 'Anonymous';
          // Skip duplicate users (stale awareness states from reconnections)
          if (seenNames.has(name)) return;
          seenNames.add(name);

          authors.push({
            clientId,
            name,
            color: state.user.color || '#888888',
            cursor: state.cursor,
          });
        });

        setCoAuthors(authors);
        onCoAuthorsChangeRef.current?.(authors);
      };

      if (immediate) {
        doUpdate();
      } else {
        coAuthorUpdateTimeout = setTimeout(doUpdate, 50);
      }
    };

    // If providers already exist, sync React state with current provider state
    if (cache.wsProvider && serverUrl) {
      const wsProvider = cache.wsProvider;

      // CRITICAL: Also set extensions when provider already exists
      // This handles StrictMode remounts and component re-renders
      const existingExtensions = [
        yCollab(text, wsProvider.awareness, { undoManager }),
        keymap.of(yUndoManagerKeymap),
      ];
      setExtensions(existingExtensions);

      // Sync connection state
      if (wsProvider.wsconnected) {
        setConnectionState('connected');
        setIsSynced(true);
      } else if (wsProvider.wsconnecting) {
        setConnectionState('connecting');
      } else {
        setConnectionState('disconnected');
      }

      // Sync co-authors
      updateCoAuthorsFromProvider(wsProvider, true);

      // Re-attach event handlers for this component instance
      const handleStatus = (event: { status: string }) => {
        const state: ConnectionState =
          event.status === 'connected' ? 'connected' :
          event.status === 'connecting' ? 'connecting' : 'disconnected';
        setConnectionState(state);
        onConnectionChangeRef.current?.(state);
        if (state === 'connected') {
          setTimeout(() => updateCoAuthorsFromProvider(wsProvider, true), 100);
        }
      };

      const handleSync = (synced: boolean) => {
        setIsSynced(synced);
        if (synced) {
          updateCoAuthorsFromProvider(wsProvider, true);
        }
      };

      const handleAwarenessChange = () => {
        updateCoAuthorsFromProvider(wsProvider, false);
      };

      wsProvider.on('status', handleStatus);
      wsProvider.on('sync', handleSync);
      wsProvider.awareness.on('change', handleAwarenessChange);

      // Observe text changes
      const textObserver = () => {
        onChangeRef.current?.(text.toString());
      };
      text.observe(textObserver);

      return () => {
        text.unobserve(textObserver);
        if (coAuthorUpdateTimeout) {
          clearTimeout(coAuthorUpdateTimeout);
        }
        wsProvider.off('status', handleStatus);
        wsProvider.off('sync', handleSync);
        wsProvider.awareness.off('change', handleAwarenessChange);
      };
    }

    if (!serverUrl && cache.idbProvider) {
      // For offline mode, just observe text changes
      const textObserver = () => {
        onChangeRef.current?.(text.toString());
      };
      text.observe(textObserver);
      return () => {
        text.unobserve(textObserver);
      };
    }

    // Track sync state from both providers
    let idbSynced = !enableOfflinePersistence;
    let wsSynced = !serverUrl;
    let initialContentInserted = false;

    const maybeInsertInitialContent = () => {
      if (initialContentInserted) return;
      if (!idbSynced || !wsSynced) return;

      // If connected to a server, the server is responsible for initializing content.
      if (serverUrl) return;

      // Offline-only mode: insert initial content if document is empty
      const content = initialContentRef.current;
      if (text.length === 0 && content) {
        text.insert(0, content);
        initialContentInserted = true;
      }
    };

    // Set up IndexedDB persistence for offline support
    if (enableOfflinePersistence && !cache.idbProvider) {
      const idbProvider = new IndexeddbPersistence(documentId, doc);
      cache.idbProvider = idbProvider;

      idbProvider.on('synced', () => {
        idbSynced = true;
        maybeInsertInitialContent();
      });
    }

    // If no providers at all, insert initial content immediately
    if (!enableOfflinePersistence && !serverUrl) {
      maybeInsertInitialContent();
    }

    // Set up WebSocket provider if server URL provided
    if (serverUrl && !cache.wsProvider) {
      const wsProvider = new WebsocketProvider(serverUrl, documentId, doc);
      cache.wsProvider = wsProvider;

      // Set local user awareness - uses ref to always get latest user info
      const setUserAwareness = () => {
        const currentUser = localUserRef.current;
        if (currentUser) {
          wsProvider.awareness.setLocalStateField('user', {
            name: currentUser.name,
            color: currentUser.color,
          });
        }
      };
      setUserAwareness();

      // Create extensions with awareness for cursor sync
      // Extensions must be fresh for each editor instance - yCollab binds to CodeMirror state
      const newExtensions = [
        yCollab(text, wsProvider.awareness, { undoManager }),
        keymap.of(yUndoManagerKeymap),
      ];
      setExtensions(newExtensions);

      // Ensure user field persists after awareness changes
      // yCollab may update cursor position without preserving user field
      // Uses ref to always get latest user info and re-sets if name doesn't match
      const ensureUserField = () => {
        const currentUser = localUserRef.current;
        const localState = wsProvider.awareness.getLocalState();
        if (currentUser && (!localState || !localState.user || localState.user.name !== currentUser.name)) {
          setUserAwareness();
        }
      };

      // Handle awareness changes (co-authors)
      // Define this first so it can be called from other handlers
      const updateCoAuthors = (immediate = false) => {
        // Debounce updates to prevent flickering during rapid cursor movements
        if (coAuthorUpdateTimeout) {
          clearTimeout(coAuthorUpdateTimeout);
        }

        const doUpdate = () => {
          const states = wsProvider.awareness.getStates();
          const authors: CoAuthor[] = [];
          // Track seen user names to deduplicate stale awareness states
          const seenNames = new Set<string>();

          states.forEach((state, clientId) => {
            if (clientId === wsProvider.awareness.clientID) return;
            if (!state.user) return;

            const name = state.user.name || 'Anonymous';
            // Skip duplicate users (stale awareness states from reconnections)
            if (seenNames.has(name)) return;
            seenNames.add(name);

            authors.push({
              clientId,
              name,
              color: state.user.color || '#888888',
              cursor: state.cursor,
            });
          });

          setCoAuthors(authors);
          onCoAuthorsChangeRef.current?.(authors);
        };

        if (immediate) {
          doUpdate();
        } else {
          coAuthorUpdateTimeout = setTimeout(doUpdate, 50);
        }
      };

      // Listen for awareness changes
      // 1. Ensure our user field persists (yCollab may overwrite it)
      // 2. Update co-authors list (debounced to prevent flickering)
      wsProvider.awareness.on('change', () => {
        ensureUserField();
        updateCoAuthors(false);
      });

      // Also update co-authors when awareness syncs (catches existing users on connect)
      // Use immediate update for these since they're less frequent
      wsProvider.awareness.on('update', () => {
        ensureUserField();
        updateCoAuthors(true);
      });

      // Handle connection state changes
      wsProvider.on('status', (event: { status: string }) => {
        const state: ConnectionState =
          event.status === 'connected' ? 'connected' :
          event.status === 'connecting' ? 'connecting' : 'disconnected';
        setConnectionState(state);
        onConnectionChangeRef.current?.(state);

        // When connected, update co-authors after a short delay to allow awareness sync
        if (state === 'connected') {
          setTimeout(() => updateCoAuthors(true), 100);
        }
      });

      // Handle sync state
      wsProvider.on('sync', (synced: boolean) => {
        setIsSynced(synced);
        if (synced) {
          wsSynced = true;
          maybeInsertInitialContent();
          // Also update co-authors after document sync
          updateCoAuthors(true);
        }
      });
    } else {
      // No server - create extensions without awareness
      const newExtensions = [
        yCollab(text, null, { undoManager }),
        keymap.of(yUndoManagerKeymap),
      ];
      setExtensions(newExtensions);
    }

    // Observe text changes
    const textObserver = () => {
      onChangeRef.current?.(text.toString());
    };
    text.observe(textObserver);

    // Cleanup - note: releaseDocument is called by the separate lifecycle effect
    return () => {
      text.unobserve(textObserver);

      // Clear any pending co-author update timeout
      if (coAuthorUpdateTimeout) {
        clearTimeout(coAuthorUpdateTimeout);
      }

      // Stop the cursor label observer
      stopCursorObserver();
    };
  // Note: callbacks, localUser, and initialContent are accessed via refs so they don't
  // need to be in deps. User info changes are handled by the separate useEffect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, serverUrl, enableOfflinePersistence, doc, text]);

  // Update local user awareness when user info changes
  const userName = localUser?.name;
  const userColor = localUser?.color;
  useEffect(() => {
    if (cache.wsProvider && userName && userColor) {
      cache.wsProvider.awareness.setLocalStateField('user', {
        name: userName,
        color: userColor,
      });
    }
  }, [cache.wsProvider, userName, userColor]);

  // Methods
  const getContent = useCallback(() => {
    return text.toString();
  }, [text]);

  const insertAt = useCallback((position: number, content: string) => {
    text.insert(position, content);
  }, [text]);

  const deleteRange = useCallback((start: number, length: number) => {
    text.delete(start, length);
  }, [text]);

  const setContent = useCallback((content: string) => {
    doc.transact(() => {
      text.delete(0, text.length);
      text.insert(0, content);
    });
  }, [doc, text]);

  const connect = useCallback(() => {
    if (cache.wsProvider) {
      cache.wsProvider.connect();
    }
  }, [cache.wsProvider]);

  const disconnect = useCallback(() => {
    if (cache.wsProvider) {
      cache.wsProvider.disconnect();
    }
  }, [cache.wsProvider]);

  // Get awareness from provider (might be null if not connected)
  const awareness = cache.wsProvider?.awareness ?? null;

  return useMemo(() => ({
    doc,
    text,
    awareness,
    undoManager,
    extensions,
    connectionState,
    coAuthors,
    isSynced,
    getContent,
    insertAt,
    deleteRange,
    setContent,
    connect,
    disconnect,
  }), [
    doc,
    text,
    awareness,
    undoManager,
    extensions,
    connectionState,
    coAuthors,
    isSynced,
    getContent,
    insertAt,
    deleteRange,
    setContent,
    connect,
    disconnect,
  ]);
}

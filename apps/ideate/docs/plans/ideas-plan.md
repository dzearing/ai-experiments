# Ideas Feature Implementation Plan

## Overview

Add a new "Ideas" Kanban board feature to the ideate app as a top-level navigation pivot. Ideas flow through 4 lanes: New → Exploring → Executing → Archived. Features include drag-and-drop, ratings, tags, AI suggestions, and real-time collaboration.

---

## Key Requirements

- **4 Kanban Lanes**: New, Exploring, Executing, Archived
- **Scope**: Global or workspace-assigned (hybrid)
- **Auto-sort**: Higher-rated ideas float to top of each lane
- **Executing Lane**: Progress indicators, waiting states, dedicated chat rooms with AI coauthoring
- **AI Integration**: Facilitator has CRUD access; AI-generated ideas marked with badge
- **Real-time**: WebSocket updates for all changes

---

## UI Design (from mockup)

### Header
- "Ideas" title with total count badge
- Filter toggles: All (N) / User (N) / AI (N)
- Filter icon, Search icon, "+ New Idea" button

### Idea Creation
- Use existing Facilitator overlay for creating ideas (no dedicated input section - saves space)
- "+ New Idea" button opens a simple modal for quick manual entry
- Facilitator has CRUD access to ideas and can create them conversationally

### Kanban Board (4 lanes)
- **New** - Fresh ideas/pitches with + button
- **Exploring** - Planning phase with + button
- **Executing** - With progress indicators, waiting states, chat access
- **Archived** - With + button

### Idea Card Design
- Title (bold)
- Description (truncated with ellipsis)
- Priority tags (colored: high=red, medium=blue, low=green)
- Regular tags (gray pills)
- "+N" overflow for extra tags
- Rating dots (1-4 scale)
- AI badge for AI-generated ideas
- Selected state (blue border)
- Drag handle for reordering

---

## Implementation Phases

### Phase 1: Server-Side Foundation

#### 1.1 Create IdeaService
**File**: `/apps/ideate/server/src/services/IdeaService.ts`

```typescript
interface IdeaMetadata {
  id: string;
  title: string;
  summary: string;
  tags: string[];              // includes 'priority:high|medium|low'
  rating: 1 | 2 | 3 | 4;
  source: 'user' | 'ai';
  status: 'new' | 'exploring' | 'executing' | 'archived';
  ownerId: string;
  workspaceId?: string;        // null = global
  createdAt: string;
  updatedAt: string;
  attachments: IdeaAttachment[];
  execution?: {                // only when status === 'executing'
    progressPercent: number;
    waitingForFeedback: boolean;
    chatRoomId?: string;
  };
}
```

Storage: `~/Ideate/ideas/{id}.meta.json` and `{id}.description.md`

Methods:
- `listIdeas(userId, workspaceId?, status?)` - List with filters
- `createIdea(userId, data)` - Create new idea
- `getIdea(id, userId)` - Get single idea with description
- `updateIdea(id, userId, updates)` - Update idea
- `deleteIdea(id, userId)` - Delete idea
- `updateStatus(id, userId, newStatus)` - Move between lanes (creates chat room if → executing)
- `updateRating(id, userId, rating)` - Update rating
- `addAttachment(ideaId, userId, attachment, fileBuffer?)` - Add attachment
- `removeAttachment(ideaId, userId, attachmentId)` - Remove attachment
- `getIdeasByLane(userId, workspaceId?)` - Get grouped by status for kanban view

#### 1.2 Create Ideas Routes
**File**: `/apps/ideate/server/src/routes/ideas.ts`

Endpoints:
- `GET /api/ideas` - List (with workspaceId, status filters)
- `GET /api/ideas/by-lane` - Get grouped by status
- `GET /api/ideas/:id` - Get single
- `POST /api/ideas` - Create
- `PATCH /api/ideas/:id` - Update
- `DELETE /api/ideas/:id` - Delete
- `PATCH /api/ideas/:id/status` - Move to lane (creates chat room if → executing)
- `PATCH /api/ideas/:id/rating` - Update rating
- `POST /api/ideas/:id/attachments` - Add attachment
- `DELETE /api/ideas/:id/attachments/:attachmentId` - Remove attachment

#### 1.3 Wire Up Server
**File**: `/apps/ideate/server/src/index.ts`

- Import and mount `ideasRouter` at `/api/ideas`
- Pass `workspaceHandler` to ideas routes for WebSocket notifications

---

### Phase 2: Client-Side Infrastructure

#### 2.1 Type Definitions
**File**: `/apps/ideate/client/src/types/idea.ts`

```typescript
export type IdeaPriority = 'high' | 'medium' | 'low';
export type IdeaSource = 'user' | 'ai';
export type IdeaStatus = 'new' | 'exploring' | 'executing' | 'archived';
export type IdeaWaitState = 'none' | 'feedback' | 'approval' | 'dependency';

export interface IdeaMetadata {
  id: string;
  workspaceId?: string;
  title: string;
  description: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  source: IdeaSource;
  rating: number;  // 1-4
  tags: string[];
  chatRoomId?: string;
  progress?: number;
  waitState?: IdeaWaitState;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaFilter {
  source?: IdeaSource | 'all';
  status?: IdeaStatus | 'all';
  searchQuery?: string;
  tags?: string[];
}
```

#### 2.2 IdeasContext
**File**: `/apps/ideate/client/src/contexts/IdeasContext.tsx`

Following DocumentContext pattern:

State:
- `ideas: IdeaMetadata[]`
- `isLoading: boolean`
- `error: string | null`
- `filter: IdeaFilter`
- `selectedIdeaId: string | null`

Computed:
- `ideasByStatus: Record<IdeaStatus, IdeaMetadata[]>` - Grouped & sorted by rating
- `filteredIdeas: IdeaMetadata[]` - Filtered by current filter
- `counts: { total, user, ai }`

Actions:
- `fetchIdeas(workspaceId?)` - Fetch ideas
- `createIdea(title, workspaceId?, description?)` - Create
- `getIdea(id)` - Get single with full content
- `updateIdea(id, updates)` - Update
- `deleteIdea(id)` - Delete
- `moveIdea(id, newStatus, newIndex?)` - Move to lane
- `reorderIdeas(status, orderedIds)` - Reorder within lane
- `setFilter(filter)` - Update filter
- `setIdeas` - Direct setter for WebSocket updates

#### 2.3 WebSocket Hook
**File**: `/apps/ideate/client/src/hooks/useIdeasSocket.ts`

Following useWorkspaceSocket pattern:

Options:
- `workspaceId?: string`
- `onIdeaCreated?: (idea) => void`
- `onIdeaUpdated?: (idea) => void`
- `onIdeaDeleted?: (ideaId) => void`
- `onIdeaMoved?: (ideaId, oldStatus, newStatus) => void`

Message types handled:
- `idea_created`
- `idea_updated`
- `idea_deleted`
- `idea_moved`

#### 2.4 Config Update
**File**: `/apps/ideate/client/src/config.ts`

Add: `export const IDEAS_WS_URL = \`\${WS_URL}/ideas-ws\`;`

---

### Phase 3: UI Components

#### 3.1 KanbanBoard Components
**Directory**: `/apps/ideate/client/src/components/KanbanBoard/`

**KanbanBoard.tsx** - Main container
- Renders 4 KanbanLane components
- Handles cross-lane drag and drop
- Uses `ideasByStatus` from context

**KanbanLane.tsx** - Individual lane
- Header with title, count, + button
- Drop zone for cards
- Renders IdeaCard for each idea
- Empty state placeholder

**KanbanBoard.module.css**
- 4-column grid layout
- Lane styling with rounded corners
- Drop zone highlight on drag over

#### 3.2 IdeaCard Component
**Directory**: `/apps/ideate/client/src/components/IdeaCard/`

**IdeaCard.tsx**
- Drag handle (visible on hover)
- Title, description (2-line clamp)
- Priority chip (colored)
- Tag chips with +N overflow
- Rating dots (filled/empty)
- AI badge (if source === 'ai')
- Progress bar (if executing)
- Waiting state indicator (if executing & waiting)
- Selected state styling

**IdeaCard.module.css**
- Card hover/selected states
- Tag color variants
- Rating dot styles
- Progress section

#### 3.3 NewIdeaModal Component
**Directory**: `/apps/ideate/client/src/components/NewIdeaModal/`

**NewIdeaModal.tsx**
- Simple form: Title, Description, Priority, Tags
- Quick entry without full detail view
- Creates idea in "New" lane

**NewIdeaModal.module.css**
- Modal form styling

#### 3.4 IdeaDetailModal Component
**Directory**: `/apps/ideate/client/src/components/IdeaDetailModal/`

**IdeaDetailModal.tsx**
- Header: Title input, AI badge
- Body: Description textarea, progress (if executing)
- Sidebar: Status select, Priority select, Rating input
- "Open Chat" button (if executing with chatRoomId)
- Footer: Delete button, Cancel, Save

**IdeaDetailModal.module.css**
- Modal layout (main + sidebar)
- Form field styling

---

### Phase 4: Pages & Navigation

#### 4.1 Ideas Page
**File**: `/apps/ideate/client/src/pages/Ideas.tsx`
**File**: `/apps/ideate/client/src/pages/Ideas.module.css`

Structure:
```tsx
<div className={styles.ideasPage}>
  <header className={styles.header}>
    <div className={styles.headerLeft}>
      <h1>Ideas <span className={styles.countBadge}>{counts.total}</span></h1>
    </div>
    <div className={styles.headerCenter}>
      <Segmented options={filterOptions} value={filter.source} onChange={...} />
    </div>
    <div className={styles.headerRight}>
      <Button variant="ghost" icon={<FilterIcon />} />
      <Button variant="ghost" icon={<SearchIcon />} />
      <Button variant="primary" icon={<AddIcon />} onClick={() => setShowNewModal(true)}>
        New Idea
      </Button>
    </div>
  </header>

  <KanbanBoard
    workspaceId={workspaceId}
    onCardClick={handleCardClick}
    selectedIdeaId={selectedIdeaId}
  />

  <NewIdeaModal
    open={showNewModal}
    onClose={() => setShowNewModal(false)}
    workspaceId={workspaceId}
  />
  <IdeaDetailModal ideaId={selectedIdeaId} onClose={() => setSelectedIdeaId(null)} />
</div>
```

Note: Users can also create ideas via the Facilitator overlay which has CRUD access.

#### 4.2 Update Navigation
**File**: `/apps/ideate/client/src/components/AppLayout/AppLayout.tsx`

Add Ideas button to nav:
```tsx
const isIdeasActive = useIsActive('/ideas');

// In nav section:
<Button
  href="/ideas"
  variant={isIdeasActive ? 'primary' : 'ghost'}
  icon={<LightbulbIcon />}
>
  Ideas
</Button>
```

#### 4.3 Update Routes
**File**: `/apps/ideate/client/src/App.tsx`

Add IdeasProvider:
```tsx
<IdeasProvider>
  {/* existing providers/routes */}
</IdeasProvider>
```

Add routes:
```tsx
<Route path="/ideas" component={Ideas} />
<Route path="/workspace/:workspaceId/ideas" component={Ideas} />
```

#### 4.4 Workspace Dashboard Link
**File**: `/apps/ideate/client/src/pages/WorkspaceDetail.tsx`

Add section with quicklink to workspace-filtered ideas board

---

### Phase 5: WebSocket Integration

#### 5.1 Update WorkspaceWebSocketHandler
**File**: `/apps/ideate/server/src/websocket/WorkspaceWebSocketHandler.ts`

Add 'idea' to ResourceType:
```typescript
export type ResourceType = 'document' | 'chatroom' | 'idea';
```

Use existing notification methods:
- `notifyResourceCreated(workspaceId, id, 'idea', ideaData)`
- `notifyResourceUpdated(workspaceId, id, 'idea', ideaData)`
- `notifyResourceDeleted(workspaceId, id, 'idea')`

---

## File Summary

### New Server Files
1. `/apps/ideate/server/src/services/IdeaService.ts`
2. `/apps/ideate/server/src/routes/ideas.ts`

### Modified Server Files
3. `/apps/ideate/server/src/index.ts` - Mount routes, wire WebSocket
4. `/apps/ideate/server/src/websocket/WorkspaceWebSocketHandler.ts` - Add 'idea' resource type

### New Client Files
5. `/apps/ideate/client/src/types/idea.ts`
6. `/apps/ideate/client/src/contexts/IdeasContext.tsx`
7. `/apps/ideate/client/src/hooks/useIdeasSocket.ts`
8. `/apps/ideate/client/src/pages/Ideas.tsx`
9. `/apps/ideate/client/src/pages/Ideas.module.css`
10. `/apps/ideate/client/src/components/KanbanBoard/KanbanBoard.tsx`
11. `/apps/ideate/client/src/components/KanbanBoard/KanbanLane.tsx`
12. `/apps/ideate/client/src/components/KanbanBoard/KanbanBoard.module.css`
13. `/apps/ideate/client/src/components/KanbanBoard/index.ts`
14. `/apps/ideate/client/src/components/IdeaCard/IdeaCard.tsx`
15. `/apps/ideate/client/src/components/IdeaCard/IdeaCard.module.css`
16. `/apps/ideate/client/src/components/IdeaCard/index.ts`
17. `/apps/ideate/client/src/components/NewIdeaModal/NewIdeaModal.tsx`
18. `/apps/ideate/client/src/components/NewIdeaModal/NewIdeaModal.module.css`
19. `/apps/ideate/client/src/components/NewIdeaModal/index.ts`
20. `/apps/ideate/client/src/components/IdeaDetailModal/IdeaDetailModal.tsx`
21. `/apps/ideate/client/src/components/IdeaDetailModal/IdeaDetailModal.module.css`
22. `/apps/ideate/client/src/components/IdeaDetailModal/index.ts`

### Modified Client Files
23. `/apps/ideate/client/src/config.ts` - Add IDEAS_WS_URL
24. `/apps/ideate/client/src/App.tsx` - Add IdeasProvider, routes
25. `/apps/ideate/client/src/components/AppLayout/AppLayout.tsx` - Add Ideas nav button
26. `/apps/ideate/client/src/pages/WorkspaceDetail.tsx` - Add ideas quicklink

---

## Implementation Order

1. **Server Foundation** (IdeaService, routes, index.ts wiring)
2. **Client Infrastructure** (types, context, WebSocket hook, config)
3. **Core Components** (KanbanBoard, KanbanLane, IdeaCard)
4. **Ideas Page** (page component, navigation, routes)
5. **Modals** (NewIdeaModal, IdeaDetailModal)
6. **Workspace Integration** (dashboard quicklinks)
7. **Real-time Polish** (WebSocket updates, optimistic UI)
8. **Facilitator Integration** (CRUD tools for ideas)

---

## Future Enhancements

- AI idea generation job (periodic background task)
- Idea templates
- Bulk actions (archive multiple, tag multiple)
- Advanced filtering (date ranges, creators)
- Idea dependencies/linking
- Export to markdown
- Collaborative editing on idea descriptions (Yjs)

# Workspace Hierarchy Redesign

## Problem Statement

The current workspace model has limitations:

1. **No personal space** - Users must explicitly create a workspace to do anything
2. **No default home** - New users face a "create workspace" barrier before they can start
3. **Flat navigation** - "Workspaces" is a nav button alongside Topics/Ideas/Documents, but it's a different concept (container vs content)
4. **Settings buried** - Gear icon is hidden inside avatar dropdown

Users should have a personal workspace that:
- Exists automatically (no setup required)
- Is always private (can't be shared)
- Serves as their default home
- Stores personal schemas, templates, and preferences

## Goals

1. **Personal workspace** - Every user has one, auto-created, private
2. **Clear hierarchy** - Personal vs Team workspaces are distinct concepts
3. **Intuitive switching** - Easy to move between personal and team workspaces
4. **Content portability** - Copy schemas/templates from personal to team workspaces
5. **Cleaner navigation** - Remove workspace as a "tab", make it a context switcher

## Design Principles

### Clean Break, No Hacks
- **No backward compatibility shims** - Old schema is replaced, not extended
- **No deprecated field preservation** - Remove `memberIds` entirely after migration
- **No fallback logic** - Code assumes new schema; migration is prerequisite to deployment
- **No dual-path code** - Single code path for workspace handling

### Modular Architecture
- **Single responsibility** - Each service/component does one thing well
- **Shared utilities** - Permission checking, validation, error handling in reusable modules
- **Consistent patterns** - All content types (Topics, Ideas, Documents, Schemas) use same copy interface

### DRY Code
- **Reusable components:**
  - `CopyToWorkspaceModal` - Generic, works for any content type
  - `WorkspacePermissionGuard` - Wraps UI elements that need permission checks
  - `useWorkspaceContext` - Single hook for all workspace state access
  - `workspaceAuthMiddleware` - Single middleware for all permission checks

- **Shared types:**
  ```typescript
  // Shared across client and server
  type WorkspaceType = 'personal' | 'team';
  type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
  type ContentType = 'topic' | 'idea' | 'document' | 'schema';

  interface CopyRequest {
    contentType: ContentType;
    contentId: string;
    targetWorkspaceId: string;
    targetTopicId?: string;  // Required for ideas
    conflictResolution?: 'replace' | 'rename';
  }
  ```

- **Centralized constants:**
  ```typescript
  const WORKSPACE_LIMITS = {
    maxOwned: 20,
    maxMemberOf: 50,
    maxMembersPerWorkspace: 100,
  } as const;

  const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
    owner: ['view', 'create', 'edit', 'delete', 'manage_members', 'delete_workspace'],
    admin: ['view', 'create', 'edit', 'delete', 'manage_members'],
    member: ['view', 'create', 'edit', 'delete_own'],
    viewer: ['view'],
  };
  ```

### Code Organization
```
server/src/
├── types/
│   └── workspace.ts          # All workspace types (shared via package)
├── services/
│   ├── WorkspaceService.ts   # Workspace CRUD, personal workspace creation
│   ├── PermissionService.ts  # Role/permission checking (reused by all routes)
│   └── ContentCopyService.ts # Generic copy logic for all content types
├── middleware/
│   └── workspaceAuth.ts      # Permission middleware (single implementation)
└── routes/
    └── workspaces.ts         # Thin route handlers, delegate to services

client/src/
├── contexts/
│   └── WorkspaceContext.tsx  # All workspace state, single source of truth
├── hooks/
│   ├── useWorkspace.ts       # Convenience hook wrapping context
│   └── usePermission.ts      # Check permissions, returns boolean + reason
├── components/
│   ├── WorkspaceSwitcher/    # Header dropdown
│   ├── CopyToWorkspaceModal/ # Generic copy modal
│   └── PermissionGuard/      # Conditionally render based on permissions
└── utils/
    └── workspaceStorage.ts   # localStorage helpers (single module)
```

### Implementation Rules
1. **No inline permission checks** - Always use `PermissionService` or `usePermission`
2. **No hardcoded limits** - Always reference `WORKSPACE_LIMITS`
3. **No duplicate validation** - Validate once at API boundary, trust internal calls
4. **No copy-paste between content type handlers** - Extract shared logic to `ContentCopyService`
5. **Types shared between client/server** - Single source of truth in shared package

## Design

### Workspace Types

| Type | Created | Sharing | Deletion | Purpose |
|------|---------|---------|----------|---------|
| **Personal** | Auto (on first sign-in) | Never shareable | Cannot delete | Private work, personal schemas/templates |
| **Team** | Explicit (user creates) | Via share link | Owner can delete | Collaboration, shared content |

### Personal Workspace Characteristics

- **ID**: `personal-{userId}` (deterministic, predictable)
- **Name**: "Personal" (not editable)
- **Owner**: The user (always)
- **Members**: None (always empty, can't add)
- **Share token**: Never generated (sharing disabled)
- **Default**: User lands here on sign-in if no workspace selected

### Data Model Changes

```typescript
type WorkspaceType = 'personal' | 'team';
type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

interface WorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: WorkspaceMember[];  // CHANGED: was memberIds: string[]
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
  type: WorkspaceType;  // NEW: Distinguish workspace types
}
```

**Migration note:** The `memberIds: string[]` field is replaced by `members: WorkspaceMember[]`. During migration, existing member IDs are converted to `WorkspaceMember` objects with `role: 'member'` (except the owner who gets `role: 'owner'`).

**Constraints enforced by API:**
- `type: 'personal'` workspaces:
  - Cannot update `name` (always "Personal")
  - Cannot update `memberIds` (always empty)
  - Cannot generate share token
  - Cannot delete
- Only one personal workspace per user

### Team Workspace Roles & Permissions

Team workspaces support role-based access control using the `WorkspaceRole` type defined above.

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| View content | ✓ | ✓ | ✓ | ✓ |
| Create/edit content | ✓ | ✓ | ✓ | ✗ |
| Delete own content | ✓ | ✓ | ✓ | ✗ |
| Delete others' content | ✓ | ✓ | ✗ | ✗ |
| Manage members | ✓ | ✓ | ✗ | ✗ |
| Change member roles | ✓ | ✓* | ✗ | ✗ |
| Delete workspace | ✓ | ✗ | ✗ | ✗ |
| Transfer ownership | ✓ | ✗ | ✗ | ✗ |

*Admins cannot promote others to Owner or demote the Owner.

**Default role**: Users joining via share link become `member`.

### Workspace Limits & Scalability

| Limit | Value | Rationale |
|-------|-------|-----------|
| Team workspaces per user (owned) | 20 | Prevent abuse, encourage consolidation |
| Team workspaces per user (member of) | 50 | Allow broad collaboration |
| Members per team workspace | 100 | Performance, manageable teams |

**Switcher behavior with many workspaces:**
- Show first 10 workspaces (Personal + 9 recent team workspaces)
- "Show all (N)" link at bottom opens full list modal
- Full list modal includes search/filter
- Sort by: recent access (default), alphabetical, creation date

### Navigation Redesign

#### Current Header Layout
```
+-------------------------------------------------------------+
| [Logo]  [Topics] [Ideas] [Documents] [Workspaces]    [sun] [avatar] |
+-------------------------------------------------------------+
```

#### Proposed Header Layout
```
+-------------------------------------------------------------+
| [Logo]  [Workspace v]  [Topics] [Ideas] [Documents]   [gear v] [avatar] |
+-------------------------------------------------------------+
```

**Changes:**
1. **Remove** "Workspaces" nav button
2. **Add** Workspace switcher dropdown after logo (left side)
3. **Move** gear icon out of avatar dropdown, place next to avatar
4. **Simplify** avatar to just show user (no dropdown, or minimal dropdown)

### Workspace Switcher Dropdown

Located after logo, shows current workspace name with dropdown arrow.

```
+--------------------------+
| check Personal           |  <-- Current selection (checkmark)
+--------------------------+
|   Team Alpha             |  <-- Team workspaces
|   Project Beta           |
|   Client X               |
+--------------------------+
| + Create workspace...    |  <-- Creates new team workspace
+--------------------------+
```

**Behavior:**
- Shows "Personal" at top (always first, with home icon?)
- Lists team workspaces below (alphabetical or recent)
- Checkmark on current selection
- "Create workspace" at bottom
- Clicking switches workspace context immediately

### Settings Dropdown (Gear Icon)

New gear icon dropdown next to avatar:

```
+--------------------------+
| User Settings            |  -> /settings (profile, preferences)
+--------------------------+
| Manage Workspaces        |  -> /workspaces (list, create, delete)
+--------------------------+
```

**Rationale:**
- "User Settings" = personal preferences, profile, appearance
- "Manage Workspaces" = CRUD operations on workspaces (vs switcher which is quick selection)

### Avatar Behavior

Two options:

**Option A: Avatar is not clickable (simplest)**
- Just displays user identity
- All actions via gear dropdown

**Option B: Avatar has minimal dropdown**
```
+--------------------------+
| Signed in as David       |
+--------------------------+
| Sign Out                 |
+--------------------------+
```

**Recommendation**: Option B - keeps sign out accessible without going to settings

### URL Structure

Current:
- `/workspaces` - Workspace list
- `/workspace/{id}` - Specific workspace (but what content?)
- `/topics`, `/ideas`, `/documents` - Content pages (implicitly within current workspace)

Proposed:
- `/settings` - User settings (unchanged)
- `/workspaces` - Manage workspaces (list, create, edit, delete)
- `/topics`, `/ideas`, `/documents` - Content pages (workspace from context/state)
- No `/workspace/{id}` needed - switching workspace changes context, not URL

**Note**: The workspace context is stored in state (e.g., localStorage or React context), not in the URL path. This keeps URLs clean and matches how users think ("I'm looking at my Topics" vs "I'm looking at Topics in workspace X").

### State Management Details

**What's stored where:**

| Data | Storage | Reason |
|------|---------|--------|
| Current workspace ID | localStorage (`ideate:currentWorkspaceId`) | Persist across sessions |
| Workspace list | React state (WorkspaceContext) | Changes frequently, needs reactivity |
| Workspace metadata cache | React state + memory cache | Performance, avoid re-fetching |
| Last accessed timestamps | localStorage (`ideate:workspaceAccess`) | For "recent" sorting in switcher |

**Cross-tab synchronization:**
- Listen to `storage` events for `ideate:currentWorkspaceId` changes
- When another tab switches workspace, show toast: "Workspace changed in another tab. [Refresh]"
- Don't auto-switch to avoid jarring UX; let user decide

**Recovery scenarios:**

| Scenario | Behavior |
|----------|----------|
| localStorage cleared | Default to personal workspace |
| Stored workspace ID invalid/deleted | Show "Workspace not found" toast, redirect to personal |
| Personal workspace missing | Re-create it automatically (API handles this) |
| User removed from team workspace | Show "Access removed" toast, redirect to personal |

### Responsive Layout

**Desktop (≥1024px):**
```
[Logo] [Workspace ▼] [Topics] [Ideas] [Documents]     [⚙] [Avatar]
```

**Tablet (768px - 1023px):**
```
[Logo] [Workspace ▼] [Topics] [Ideas] [Docs]     [⚙] [Avatar]
```
- Truncate "Documents" to "Docs"
- Workspace name truncated with ellipsis if > 15 chars

**Mobile (<768px):**
```
[Logo]                              [☰]
```
- Hamburger menu contains:
  - Workspace switcher (expanded, not dropdown)
  - Navigation links (Topics, Ideas, Documents)
  - Settings link
  - Sign out
- Workspace name shown as section header in menu

### Loading & Transition States

**Workspace switching:**
1. User clicks new workspace in switcher
2. Immediately update switcher UI (optimistic)
3. Show subtle loading indicator on content area (not full-page spinner)
4. Fetch workspace data in background
5. On success: Update content, persist to localStorage
6. On failure: Revert switcher selection, show error toast

**Personal workspace creation (first sign-in):**
1. Sign-in completes
2. API checks for personal workspace
3. If missing, create synchronously (blocking)
4. Redirect to personal workspace
5. If creation fails after 3 retries: Show error page with "Retry" button

**Content copy operation:**
1. User clicks "Copy to workspace"
2. Modal opens with workspace list
3. User selects target, clicks "Copy"
4. Button shows spinner, disable interactions
5. On success: Close modal, show success toast with link to target workspace
6. On failure: Keep modal open, show inline error, allow retry

### Content Copying Flow

Content copying allows users to duplicate Topics, Ideas, Documents, and Schemas between workspaces.

**Supported content types:**

| Content Type | Can Copy | Notes |
|--------------|----------|-------|
| Topic | ✓ | Copies topic metadata only; ideas not included |
| Idea | ✓ | Copies to specified topic in target workspace |
| Document | ✓ | Full content copied |
| Schema | ✓ | Template definition copied |

**User flow (example: copying a schema):**

1. User is in **Personal** workspace, viewing schemas
2. User clicks "Copy to workspace" on a schema
3. Modal shows list of team workspaces (where user has create permission)
4. User selects target workspace
5. Schema is duplicated into target workspace
6. Success toast: "Schema copied to Team Alpha" with [View] link

```
+-----------------------------------------+
| Copy "Package" schema to...             |
+-----------------------------------------+
| o Team Alpha                            |
| o Project Beta                          |
| o Client X                              |
+-----------------------------------------+
|                      [Cancel] [Copy]    |
+-----------------------------------------+
```

**Conflict handling:**
- If schema with same `targetType` exists in destination:
  ```
  +-----------------------------------------+
  | A "Package" schema already exists in    |
  | Team Alpha.                             |
  +-----------------------------------------+
  | o Replace existing schema               |
  | o Create copy as "Package (2)"          |
  | o Cancel                                |
  +-----------------------------------------+
  ```

**Reference handling:**
- Internal links (e.g., `[[Topic Name]]`) are copied as-is
- If referenced content doesn't exist in target workspace, links become plain text
- No automatic resolution or broken link warnings (keep simple for v1)

**Batch copying (future):**
- Not in initial scope
- If needed later: multi-select + "Copy selected to..." action

### Error Handling

**API Error Responses:**

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Error codes for workspace operations
type WorkspaceErrorCode =
  | 'WORKSPACE_NOT_FOUND'
  | 'WORKSPACE_ACCESS_DENIED'
  | 'WORKSPACE_LIMIT_REACHED'
  | 'PERSONAL_WORKSPACE_IMMUTABLE'
  | 'MEMBER_LIMIT_REACHED'
  | 'INVALID_ROLE_CHANGE'
  | 'CANNOT_REMOVE_OWNER'
  | 'COPY_TARGET_CONFLICT';
```

**Client-side error handling:**

| Error | User-facing message | Recovery action |
|-------|---------------------|-----------------|
| `WORKSPACE_NOT_FOUND` | "This workspace no longer exists" | Redirect to personal |
| `WORKSPACE_ACCESS_DENIED` | "You don't have access to this workspace" | Redirect to personal |
| `WORKSPACE_LIMIT_REACHED` | "You've reached the maximum number of workspaces (20)" | Show upgrade prompt or suggest deleting |
| `PERSONAL_WORKSPACE_IMMUTABLE` | (Should never reach user; API prevents) | Log error, no-op |
| `MEMBER_LIMIT_REACHED` | "This workspace has reached its member limit (100)" | Contact workspace admin |
| Network error | "Connection lost. Retrying..." | Auto-retry 3x with exponential backoff |
| Unknown error | "Something went wrong. Please try again." | Log to server, show retry button |

**Graceful degradation:**
- If workspace list fails to load: Show cached list (if available) with "outdated" indicator
- If workspace switch fails: Stay on current workspace, show error toast
- If personal workspace creation fails repeatedly: Show blocking error page (cannot proceed without personal workspace)

## Implementation Phases

### Phase 1: Data Model & API

**Files to modify:**
- `server/src/types/workspace.ts` - Add `type` field, roles, member structure
- `server/src/services/WorkspaceService.ts` - Personal workspace logic, permissions
- `server/src/routes/workspaces.ts` - Enforce personal workspace constraints
- `server/src/middleware/workspaceAuth.ts` - New file for permission checks

**Tasks:**
1. Add `type: 'personal' | 'team'` to `WorkspaceMetadata`
2. Replace `memberIds: string[]` with `members: WorkspaceMember[]` (includes role)
3. Add `WorkspaceRole` type and permission checking utilities
4. Create personal workspace on first API call if doesn't exist
5. Enforce constraints (no sharing, no delete, no rename for personal)
6. Add `GET /api/workspaces/personal` endpoint for convenience
7. Add permission middleware for role-based access control
8. Implement workspace limits (20 owned, 50 member, 100 members per workspace)
9. Migrate existing workspaces to `type: 'team'` with owner as `owner` role

### Phase 2: Navigation Redesign

**Files to modify:**
- `client/src/components/AppLayout/AppLayout.tsx` - Header restructure
- `client/src/components/WorkspaceSwitcher/` - New component
- `client/src/components/SettingsDropdown/` - New component
- `client/src/contexts/WorkspaceContext.tsx` - Current workspace state

**Tasks:**
1. Create `WorkspaceSwitcher` component
2. Create `SettingsDropdown` component
3. Update `AppLayout` header structure
4. Remove "Workspaces" from main nav buttons
5. Update avatar dropdown (simplify to just sign out)
6. Store current workspace selection in localStorage
7. Default to personal workspace if none selected

### Phase 3: Workspace Management Page

**Files to modify:**
- `client/src/pages/Workspaces.tsx` - Update to management focus

**Tasks:**
1. Rename/refocus page as "Manage Workspaces"
2. Show personal workspace at top (non-deletable, no share option)
3. List team workspaces with full CRUD
4. Add workspace type badges
5. Link from gear dropdown

### Phase 4: Content Copying

**Files to modify:**
- `client/src/components/CopyToWorkspaceModal/` - New component (reusable for all content types)
- `server/src/services/TopicService.ts` - Topic copy operation
- `server/src/services/IdeaService.ts` - Idea copy operation
- `server/src/services/DocumentService.ts` - Document copy operation
- `server/src/services/SchemaService.ts` - Schema copy operation
- `server/src/routes/topics.ts` - Copy endpoint
- `server/src/routes/ideas.ts` - Copy endpoint
- `server/src/routes/documents.ts` - Copy endpoint
- `server/src/routes/schemas.ts` - Copy endpoint

**Tasks:**
1. Create `CopyToWorkspaceModal` component (generic, works for any content type)
2. Add "Copy to workspace" action to Topics list
3. Add "Copy to workspace" action to Ideas list (requires selecting target topic)
4. Add "Copy to workspace" action to Documents list
5. Add "Copy to workspace" action to Schemas list
6. Implement `POST /api/topics/{id}/copy` endpoint
7. Implement `POST /api/ideas/{id}/copy` endpoint (with `targetTopicId` param)
8. Implement `POST /api/documents/{id}/copy` endpoint
9. Implement `POST /api/schemas/{id}/copy` endpoint
10. Handle naming conflicts (show conflict resolution dialog)
11. Check user has create permission in target workspace
12. Add success/error toasts with "View in workspace" link

## Migration Strategy

### Existing Users

When an existing user signs in after this change:

1. **Check for personal workspace**: `personal-{userId}`
2. **If not exists**: Create it automatically
3. **If exists**: No action needed (shouldn't happen, but handle gracefully)
4. **Existing workspaces**: Set `type: 'team'` on all existing workspaces

### New Users

On first sign-in:
1. Create personal workspace automatically
2. Land user in personal workspace
3. Show onboarding hint: "This is your personal workspace. Create a team workspace to collaborate."

### Data Migration Script

```typescript
async function migrateWorkspaces() {
  const workspaces = await getAllWorkspaces();

  for (const ws of workspaces) {
    if (!ws.type) {
      // Existing workspace without type = team
      // Convert memberIds to members with 'member' role, owner gets 'owner' role
      const members = ws.memberIds.map(userId => ({
        userId,
        role: userId === ws.ownerId ? 'owner' : 'member',
        joinedAt: ws.createdAt, // Use workspace creation as join date
      }));
      await updateWorkspace(ws.id, { type: 'team', members });
    }
  }

  // Create personal workspaces for all existing users
  const users = await getAllUsers();
  for (const user of users) {
    const personalId = `personal-${user.id}`;
    const exists = await workspaceExists(personalId);
    if (!exists) {
      await createWorkspace({
        id: personalId,
        name: 'Personal',
        type: 'personal',
        ownerId: user.id,
        members: [],
      });
    }
  }
}
```

### Rollback Strategy

**Pre-migration backup:**
- Before running migration, export all workspace data to backup file
- Store backup with timestamp: `workspaces-backup-{timestamp}.json`

**Rollback triggers:**
- Migration script fails mid-execution
- Critical bug discovered post-deployment
- User reports data loss

**Rollback procedure:**

1. **Immediate (within 24 hours):**
   ```bash
   # Stop the application
   # Restore workspace data from backup
   node scripts/restore-workspaces.js --backup workspaces-backup-{timestamp}.json
   # Deploy previous version
   # Restart application
   ```

2. **Partial rollback (keep new features, fix data):**
   - If only some workspaces are affected, restore those specifically
   - Personal workspaces can be deleted and re-created (no user data loss)

**Data preservation guarantees:**
- No workspace content (Topics, Ideas, Documents) is modified during migration
- Only workspace metadata changes
- Existing `memberIds` data preserved in `members[].userId`

## Testing Strategy

### Unit Tests

**Server-side (`server/src/__tests__/`):**

| Test Suite | Coverage |
|------------|----------|
| `WorkspaceService.test.ts` | Personal workspace creation, type constraints, permission checks |
| `workspaceAuth.test.ts` | Role-based permission middleware |
| `workspaceLimits.test.ts` | Workspace and member limits enforcement |
| `contentCopy.test.ts` | Copy operations for all content types |

**Key test cases:**
- Personal workspace auto-creation on first API call
- Cannot delete/rename/share personal workspace
- Role permissions (owner vs admin vs member vs viewer)
- Workspace limit enforcement (20 owned, 50 member)
- Copy with conflict resolution
- Migration script idempotency

### Integration Tests

**API tests (`server/src/__tests__/integration/`):**

| Endpoint | Test Cases |
|----------|------------|
| `GET /api/workspaces` | Returns personal + team workspaces, sorted correctly |
| `GET /api/workspaces/personal` | Returns personal workspace, creates if missing |
| `POST /api/workspaces` | Creates team workspace, enforces limits |
| `DELETE /api/workspaces/:id` | Fails for personal, succeeds for team (owner only) |
| `POST /api/topics/:id/copy` | Copies to target workspace, handles conflicts |

### E2E Tests

**Playwright tests (`client/e2e/`):**

| Test File | Scenarios |
|-----------|-----------|
| `workspace-switcher.spec.ts` | Switch workspaces, verify content changes |
| `workspace-create.spec.ts` | Create team workspace, verify in switcher |
| `workspace-permissions.spec.ts` | Verify role-based UI restrictions |
| `content-copy.spec.ts` | Copy topic/idea/document between workspaces |
| `responsive-nav.spec.ts` | Mobile hamburger menu, workspace switching |

**Critical user journeys to test:**
1. New user sign-in → lands in personal workspace
2. Create team workspace → appears in switcher → switch to it
3. Copy schema from personal to team → verify in target
4. Remove member from team workspace → they lose access
5. Delete team workspace → content gone, redirected to personal

### Migration Testing

**Pre-production checklist:**
- [ ] Run migration on copy of production data
- [ ] Verify all workspaces have `type` field
- [ ] Verify all users have personal workspace
- [ ] Verify `members` array correctly populated from `memberIds`
- [ ] Verify no data loss in workspace content
- [ ] Test rollback procedure on staging

## Open Questions

### 1. Personal workspace content scope
**Question**: Should ALL content types live in personal workspace, or just schemas/templates?

**Recommendation**: All content types. Personal workspace is a full workspace, just private. Users can:
- Create Topics, Ideas, Documents in personal space
- Copy any of them to team workspaces when ready to share

### 2. Workspace-specific settings
**Question**: Should workspaces have their own settings (beyond schemas)?

**Recommendation**: Defer. Start with schemas only. If needed, add workspace settings later:
- Default document template
- Notification preferences
- Agent behavior settings

### 3. Personal workspace naming
**Question**: Should it be called "Personal", "My Workspace", "Home", or something else?

**Recommendation**: "Personal" - clear, concise, distinguishes from team spaces.

### 4. Workspace switcher location
**Question**: Left side (after logo) vs right side (near avatar)?

**Recommendation**: Left side. The workspace context affects what content you see (Topics, Ideas, Documents), so it belongs near the content navigation, not near user actions.

## Success Criteria

### Core Functionality
- [ ] Personal workspace auto-created on first sign-in
- [ ] Personal workspace cannot be shared, renamed, or deleted
- [ ] Workspace switcher in header allows quick switching
- [ ] Gear dropdown provides access to settings and workspace management
- [ ] "Workspaces" removed from main nav buttons
- [ ] Existing users see their workspaces migrated to "team" type
- [ ] New users land in personal workspace by default

### Permissions & Limits
- [ ] Role-based permissions enforced (owner, admin, member, viewer)
- [ ] Workspace limits enforced (20 owned, 50 member, 100 members)
- [ ] Users can only see workspaces they have access to
- [ ] Permission errors show helpful messages

### Content Copying
- [ ] Topics can be copied between workspaces
- [ ] Ideas can be copied between workspaces (with target topic selection)
- [ ] Documents can be copied between workspaces
- [ ] Schemas can be copied between workspaces
- [ ] Naming conflicts show resolution dialog

### State & Error Handling
- [ ] Workspace selection persists across sessions (localStorage)
- [ ] Cross-tab workspace changes show notification
- [ ] Invalid workspace redirects to personal with toast
- [ ] Network errors show retry option
- [ ] Personal workspace creation failures show blocking error with retry

### Responsive Design
- [ ] Desktop layout shows full workspace switcher
- [ ] Mobile layout uses hamburger menu with workspace selection
- [ ] Workspace names truncate appropriately at all breakpoints

### Migration & Rollback
- [ ] Migration script is idempotent (can run multiple times safely)
- [ ] Backup created before migration
- [ ] Rollback procedure documented and tested

## Relationship to Other Plans

This plan is a **prerequisite** for the Topic Type Schemas feature ([03-topic-type-schemas.md](./03-topic-type-schemas.md)). Specifically:

- **Personal schemas**: Users create schemas in personal workspace
- **Copy to team**: Schemas copied to team workspaces for collaboration
- **Default schemas**: Created in personal workspace on first sign-in

**Plan sequence:**
1. [01-things-to-topics-rename.md](./01-things-to-topics-rename.md) - Rename Things to Topics first
2. This plan (02) - Workspace hierarchy
3. [03-topic-type-schemas.md](./03-topic-type-schemas.md) - Topic schemas (depends on this plan)
